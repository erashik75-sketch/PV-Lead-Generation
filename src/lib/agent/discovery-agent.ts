import { getAnthropicClient, MODEL, estimateCost } from "@/lib/anthropic/client";
import { searchWeb } from "@/lib/search/serper";
import { extractBrandsFromResults, type BrandCandidate } from "@/lib/search/brand-extractor";
import { buildDiscoveryQueriesPrompt, buildClaudeSuggestionsPrompt } from "@/lib/anthropic/prompts/discovery";
import { createServiceClient } from "@/lib/supabase/server";
import type { Niche, Product } from "@/types/domain";

export interface DiscoveryResult {
  candidatesAdded: number;
  searchQueries: string[];
  totalCost: number;
}

export async function runDiscoveryAgent(
  campaignId: string,
  cronRunId: string
): Promise<DiscoveryResult> {
  const supabase = await createServiceClient();
  const anthropic = await getAnthropicClient();

  const [nichesRes, productsRes, existingRes] = await Promise.all([
    supabase.from("niches").select("*").eq("enabled", true),
    supabase.from("products").select("*").eq("enabled", true),
    supabase.from("leads").select("brand_name"),
  ]);

  const niches: Niche[] = nichesRes.data ?? [];
  const products: Product[] = nichesRes.data ?? [];
  const existingBrands = (existingRes.data ?? []).map((l) => l.brand_name);

  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  const candidates: BrandCandidate[] = [];

  // Phase 1: Generate search queries via Claude
  const queryResponse = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1024,
    messages: [{ role: "user", content: buildDiscoveryQueriesPrompt(niches, products) }],
  });
  totalInputTokens += queryResponse.usage.input_tokens;
  totalOutputTokens += queryResponse.usage.output_tokens;

  const queryText = queryResponse.content[0].type === "text" ? queryResponse.content[0].text : "{}";
  let searchQueries: string[] = [];
  try {
    const parsed = JSON.parse(queryText);
    searchQueries = parsed.queries ?? [];
  } catch {
    searchQueries = [];
  }

  // Phase 2: Execute web searches
  const searchResults = await Promise.allSettled(
    searchQueries.slice(0, 8).map((q) => searchWeb(q, 8))
  );

  for (const result of searchResults) {
    if (result.status === "fulfilled") {
      candidates.push(...extractBrandsFromResults(result.value));
    }
  }

  // Phase 3: Claude suggestions from training knowledge
  const suggestResponse = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 2048,
    messages: [{ role: "user", content: buildClaudeSuggestionsPrompt(niches, products as Product[], existingBrands) }],
  });
  totalInputTokens += suggestResponse.usage.input_tokens;
  totalOutputTokens += suggestResponse.usage.output_tokens;

  const suggestText = suggestResponse.content[0].type === "text" ? suggestResponse.content[0].text : "{}";
  try {
    const parsed = JSON.parse(suggestText);
    const suggestions = parsed.suggestions ?? [];
    for (const s of suggestions) {
      candidates.push({ brand_name: s.brand_name, website: s.website, snippet: s.snippet, source: "claude_suggestion" });
    }
  } catch {}

  // Phase 4: Dedup against existing leads and candidates
  const existingSet = new Set(existingBrands.map((b) => b.toLowerCase()));
  const { data: existingCandidates } = await supabase.from("lead_candidates").select("brand_name");
  const candidateSet = new Set((existingCandidates ?? []).map((c) => c.brand_name.toLowerCase()));

  const deduped = candidates.filter(
    (c) => !existingSet.has(c.brand_name.toLowerCase()) && !candidateSet.has(c.brand_name.toLowerCase())
  );

  // Remove internal duplicates
  const seen = new Set<string>();
  const unique = deduped.filter((c) => {
    const key = c.brand_name.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Phase 5: Insert into lead_candidates
  if (unique.length > 0) {
    const rows = unique.map((c) => ({
      campaign_id: campaignId,
      cron_run_id: cronRunId,
      brand_name: c.brand_name,
      website: c.website,
      snippet: c.snippet,
      source: c.source,
      status: "pending_qualification" as const,
    }));

    await supabase.from("lead_candidates").insert(rows);
  }

  const cost = estimateCost(totalInputTokens, totalOutputTokens);

  // Log API usage
  await supabase.from("api_usage_log").insert({
    operation: "discovery",
    input_tokens: totalInputTokens,
    output_tokens: totalOutputTokens,
    cost_usd: cost,
  });

  return { candidatesAdded: unique.length, searchQueries, totalCost: cost };
}
