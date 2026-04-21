import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [leadsRes, campaignsRes, costRes, cronRes] = await Promise.all([
    supabase.from("leads").select("stage, created_at"),
    supabase.from("campaigns").select("status"),
    supabase.from("api_usage_log").select("cost_usd"),
    supabase
      .from("cron_run_log")
      .select("*")
      .order("run_at", { ascending: false })
      .limit(10),
  ]);

  const leads = leadsRes.data ?? [];
  const campaigns = campaignsRes.data ?? [];

  const funnel = {
    discovered: leads.filter((l) => l.stage === "discovered").length,
    enriched: leads.filter((l) => l.stage === "enriched").length,
    outreach: leads.filter((l) => l.stage === "outreach").length,
    warm_intro: leads.filter((l) => l.stage === "warm_intro").length,
    converted: leads.filter((l) => l.stage === "converted").length,
    eliminated: leads.filter((l) => l.stage === "eliminated").length,
  };

  const totalCost = (costRes.data ?? []).reduce((sum, r) => sum + Number(r.cost_usd), 0);

  return NextResponse.json({
    funnel,
    totalLeads: leads.length,
    activeCampaigns: campaigns.filter((c) => c.status === "active").length,
    totalCostUsd: Math.round(totalCost * 100) / 100,
    recentRuns: cronRes.data ?? [],
  });
}
