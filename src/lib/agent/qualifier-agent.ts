import { getAnthropicClient, MODEL, estimateCost } from "@/lib/anthropic/client";
import { buildQualificationPrompt } from "@/lib/anthropic/prompts/qualification";
import { createServiceClient } from "@/lib/supabase/server";
import type { BlockerRule, Niche, Product } from "@/types/domain";

export interface QualifierResult {
  qualified: number;
  disqualified: number;
  promoted: number;
  totalCost: number;
}

export async function runQualifierAgent(
  campaignId: string,
  cronRunId: string,
  dailyTarget: number
): Promise<QualifierResult> {
  const supabase = await createServiceClient();
  const anthropic = await getAnthropicClient();

  const [candidatesRes, nichesRes, productsRes, blockersRes, settingsRes] = await Promise.all([
    supabase.from("lead_candidates")
      .select("*")
      .eq("campaign_id", campaignId)
      .eq("cron_run_id", cronRunId)
      .eq("status", "pending_qualification"),
    supabase.from("niches").select("*").eq("enabled", true),
    supabase.from("products").select("*").eq("enabled", true),
    supabase.from("blocker_rules").select("*").eq("enabled", true),
    supabase.from("settings").select("value").eq("key", "daily_leads_target").single(),
  ]);

  const candidates = candidatesRes.data ?? [];
  const niches: Niche[] = nichesRes.data ?? [];
  const products: Product[] = productsRes.data ?? [];
  const blockerRules: BlockerRule[] = blockersRes.data ?? [];
  const target = dailyTarget || Number(settingsRes.data?.value ?? 5);

  if (candidates.length === 0) return { qualified: 0, disqualified: 0, promoted: 0, totalCost: 0 };

  let totalInputTokens = 0;
  let totalOutputTokens = 0;

  // Batch candidates (process in groups of 20 to stay within token limits)
  const BATCH_SIZE = 20;
  const allEvaluations: Array<{
    brand_name: string;
    qualified: boolean;
    disqualify_reason: string | null;
    blocker_triggered: string | null;
    fit_score: number;
  }> = [];

  for (let i = 0; i < candidates.length; i += BATCH_SIZE) {
    const batch = candidates.slice(i, i + BATCH_SIZE);
    const prompt = buildQualificationPrompt(batch, niches, products, blockerRules, target);

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });
    totalInputTokens += response.usage.input_tokens;
    totalOutputTokens += response.usage.output_tokens;

    const text = response.content[0].type === "text" ? response.content[0].text : "{}";
    try {
      const parsed = JSON.parse(text);
      allEvaluations.push(...(parsed.evaluations ?? []));
    } catch {}
  }

  // Build lookup map
  const evalMap = new Map(allEvaluations.map((e) => [e.brand_name.toLowerCase(), e]));

  let qualified = 0;
  let disqualified = 0;
  let promoted = 0;

  for (const candidate of candidates) {
    const evaluation = evalMap.get(candidate.brand_name.toLowerCase());

    if (!evaluation || !evaluation.qualified) {
      await supabase.from("lead_candidates").update({
        status: "disqualified",
        disqualify_reason: evaluation?.disqualify_reason ?? "No match found",
        fit_score: evaluation?.fit_score ?? 0,
      }).eq("id", candidate.id);
      disqualified++;
    } else {
      await supabase.from("lead_candidates").update({
        status: "qualified",
        fit_score: evaluation.fit_score,
      }).eq("id", candidate.id);
      qualified++;
    }
  }

  // Promote top N qualified candidates to leads table
  const qualifiedCandidates = candidates
    .filter((c) => {
      const ev = evalMap.get(c.brand_name.toLowerCase());
      return ev?.qualified;
    })
    .sort((a, b) => {
      const aScore = evalMap.get(a.brand_name.toLowerCase())?.fit_score ?? 0;
      const bScore = evalMap.get(b.brand_name.toLowerCase())?.fit_score ?? 0;
      return bScore - aScore;
    })
    .slice(0, target);

  for (const candidate of qualifiedCandidates) {
    const { data: lead } = await supabase.from("leads").insert({
      campaign_id: campaignId,
      candidate_id: candidate.id,
      brand_name: candidate.brand_name,
      website: candidate.website,
      stage: "discovered",
      discovery_source: candidate.source === "manual" ? "manual" : candidate.source === "claude_suggestion" ? "claude_suggestion" : "web_search",
      blocker_outcome: "none",
    }).select().single();

    if (lead) {
      await supabase.from("lead_candidates").update({ status: "promoted" }).eq("id", candidate.id);
      promoted++;
    }
  }

  const cost = estimateCost(totalInputTokens, totalOutputTokens);
  await supabase.from("api_usage_log").insert({
    operation: "qualification",
    input_tokens: totalInputTokens,
    output_tokens: totalOutputTokens,
    cost_usd: cost,
  });

  return { qualified, disqualified, promoted, totalCost: cost };
}
