import { createServiceClient } from "@/lib/supabase/server";
import { runDiscoveryAgent } from "./discovery-agent";
import { runQualifierAgent } from "./qualifier-agent";
import { runEnrichmentAgent } from "./enrichment-agent";

export interface PipelineResult {
  campaignId: string;
  discovered: number;
  qualified: number;
  enriched: number;
  totalCost: number;
  error?: string;
}

export async function runPipeline(campaignId: string): Promise<PipelineResult> {
  const supabase = await createServiceClient();

  // Create cron run log entry
  const { data: runLog } = await supabase
    .from("cron_run_log")
    .insert({ campaign_id: campaignId, status: "running" })
    .select()
    .single();

  const cronRunId = runLog?.id;
  if (!cronRunId) {
    return { campaignId, discovered: 0, qualified: 0, enriched: 0, totalCost: 0, error: "Failed to create run log" };
  }

  try {
    // Agent 1: Discovery
    const discoveryResult = await runDiscoveryAgent(campaignId, cronRunId);

    // Agent 2: Qualifier
    const qualifierResult = await runQualifierAgent(campaignId, cronRunId, 5);

    // Agent 3: Enrichment
    const enrichmentResult = await runEnrichmentAgent(campaignId);

    const totalCost = discoveryResult.totalCost + qualifierResult.totalCost + enrichmentResult.totalCost;

    // Update cron run log
    await supabase.from("cron_run_log").update({
      status: "completed",
      leads_found: discoveryResult.candidatesAdded,
      leads_qualified: qualifierResult.promoted,
      leads_enriched: enrichmentResult.enriched,
      search_queries: discoveryResult.searchQueries,
      cost_usd: totalCost,
    }).eq("id", cronRunId);

    return {
      campaignId,
      discovered: discoveryResult.candidatesAdded,
      qualified: qualifierResult.promoted,
      enriched: enrichmentResult.enriched,
      totalCost,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await supabase.from("cron_run_log").update({
      status: "failed",
      error_message: message,
    }).eq("id", cronRunId);

    return { campaignId, discovered: 0, qualified: 0, enriched: 0, totalCost: 0, error: message };
  }
}
