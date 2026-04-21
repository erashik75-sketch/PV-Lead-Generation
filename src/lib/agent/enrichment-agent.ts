import { getAnthropicClient, MODEL, estimateCost } from "@/lib/anthropic/client";
import { buildEnrichmentPrompt } from "@/lib/anthropic/prompts/enrichment";
import { applyBlockerRules } from "@/lib/business-logic/blocker-engine";
import { createServiceClient } from "@/lib/supabase/server";
import type { Lead, Niche, Product, BlockerRule } from "@/types/domain";

export interface EnrichmentResult {
  enriched: number;
  blocked: number;
  totalCost: number;
}

interface EnrichmentData {
  brand_name?: string;
  website?: string;
  brand_description?: string;
  founder_name?: string;
  founder_title?: string;
  founder_linkedin_id?: string;
  founder_email?: string;
  founder_instagram_handle?: string;
  founding_year?: number;
  employee_count_estimate?: string;
  revenue_estimate?: string;
  product_lines?: string;
  price_point_usd?: number;
  current_manufacturer_region?: string;
  instagram_followers?: number;
  press_mentions?: string;
  enrichment_confidence?: number;
  score_dimensions?: Record<string, { score: number; rationale: string }>;
}

export async function enrichLead(leadId: string): Promise<{ success: boolean; cost: number }> {
  const supabase = await createServiceClient();
  const anthropic = await getAnthropicClient();

  const { data: lead } = await supabase.from("leads").select("*").eq("id", leadId).single();
  if (!lead) return { success: false, cost: 0 };

  const [nichesRes, productsRes, blockersRes] = await Promise.all([
    supabase.from("niches").select("*").eq("enabled", true),
    supabase.from("products").select("*").eq("enabled", true),
    supabase.from("blocker_rules").select("*").eq("enabled", true),
  ]);

  const niches: Niche[] = nichesRes.data ?? [];
  const products: Product[] = productsRes.data ?? [];
  const blockerRules: BlockerRule[] = blockersRes.data ?? [];

  const prompt = buildEnrichmentPrompt(
    { brand_name: lead.brand_name, website: lead.website, snippet: null },
    niches,
    products
  );

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "{}";
  const cost = estimateCost(response.usage.input_tokens, response.usage.output_tokens);

  let enriched: EnrichmentData = {};
  try {
    enriched = JSON.parse(text);
  } catch {
    await supabase.from("api_usage_log").insert({
      operation: "enrichment",
      lead_id: leadId,
      input_tokens: response.usage.input_tokens,
      output_tokens: response.usage.output_tokens,
      cost_usd: cost,
    });
    return { success: false, cost };
  }

  // Apply blocker rules on enriched data
  const blockerResult = applyBlockerRules(
    {
      brand_description: enriched.brand_description,
      employee_count_estimate: enriched.employee_count_estimate,
    },
    blockerRules
  );

  // Compute weighted fit score from dimension scores
  const dimensions = enriched.score_dimensions ?? {};
  const dimScores = Object.entries(dimensions).map(([dimension, v]) => ({ dimension, score: v.score }));
  const fitScore = dimScores.length > 0
    ? Math.round((dimScores.reduce((sum, d) => sum + d.score, 0) / dimScores.length) * 10) / 10
    : null;

  // Update lead with enriched data
  await supabase.from("leads").update({
    brand_name: enriched.brand_name ?? lead.brand_name,
    website: enriched.website ?? lead.website,
    brand_description: enriched.brand_description,
    founder_name: enriched.founder_name,
    founder_title: enriched.founder_title,
    founder_linkedin_id: enriched.founder_linkedin_id,
    founder_email: enriched.founder_email,
    founder_instagram_handle: enriched.founder_instagram_handle,
    founding_year: enriched.founding_year,
    employee_count_estimate: enriched.employee_count_estimate,
    revenue_estimate: enriched.revenue_estimate,
    product_lines: enriched.product_lines,
    price_point_usd: enriched.price_point_usd,
    current_manufacturer_region: enriched.current_manufacturer_region,
    instagram_followers: enriched.instagram_followers,
    press_mentions: enriched.press_mentions,
    fit_score: fitScore,
    enrichment_confidence: enriched.enrichment_confidence,
    enriched_at: new Date().toISOString(),
    stage: blockerResult.blocked
      ? (blockerResult.outcome === "warm_intro" ? "warm_intro" : "eliminated")
      : "enriched",
    blocker_outcome: blockerResult.outcome,
    blocker_rule_key: blockerResult.rule_key,
    updated_at: new Date().toISOString(),
  }).eq("id", leadId);

  // Insert score dimensions
  if (Object.keys(dimensions).length > 0) {
    const dimRows = Object.entries(dimensions).map(([dimension, v]) => ({
      lead_id: leadId,
      dimension,
      score: v.score,
      rationale: v.rationale,
    }));
    await supabase.from("score_dimensions").delete().eq("lead_id", leadId);
    await supabase.from("score_dimensions").insert(dimRows);
  }

  // Log API usage
  await supabase.from("api_usage_log").insert({
    operation: "enrichment",
    lead_id: leadId,
    input_tokens: response.usage.input_tokens,
    output_tokens: response.usage.output_tokens,
    cost_usd: cost,
  });

  return { success: true, cost };
}

export async function runEnrichmentAgent(campaignId: string): Promise<EnrichmentResult> {
  const supabase = await createServiceClient();

  const { data: leads } = await supabase
    .from("leads")
    .select("id")
    .eq("campaign_id", campaignId)
    .eq("stage", "discovered");

  if (!leads || leads.length === 0) return { enriched: 0, blocked: 0, totalCost: 0 };

  let enriched = 0;
  let blocked = 0;
  let totalCost = 0;

  for (const lead of leads) {
    const result = await enrichLead(lead.id);
    totalCost += result.cost;
    if (result.success) {
      // Check if blocked after enrichment
      const { data: updatedLead } = await supabase
        .from("leads")
        .select("stage")
        .eq("id", lead.id)
        .single();
      if (updatedLead?.stage === "eliminated" || updatedLead?.stage === "warm_intro") {
        blocked++;
      } else {
        enriched++;
      }
    }
  }

  return { enriched, blocked, totalCost };
}
