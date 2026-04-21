import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatCurrency } from "@/lib/utils";
import { LayoutDashboard, TrendingUp, Users, DollarSign, Bot } from "lucide-react";

interface FunnelData {
  discovered: number;
  enriched: number;
  outreach: number;
  warm_intro: number;
  converted: number;
  eliminated: number;
}

interface CronRun {
  id: string;
  run_at: string;
  status: string;
  leads_found: number;
  leads_qualified: number;
  leads_enriched: number;
  cost_usd: number;
  error_message: string | null;
}

async function getDashboardData() {
  const supabase = await createClient();

  const [leadsRes, campaignsRes, costRes, cronRes] = await Promise.all([
    supabase.from("leads").select("stage, created_at"),
    supabase.from("campaigns").select("status"),
    supabase.from("api_usage_log").select("cost_usd"),
    supabase.from("cron_run_log").select("*").order("run_at", { ascending: false }).limit(5),
  ]);

  const leads = leadsRes.data ?? [];
  const campaigns = campaignsRes.data ?? [];

  const funnel: FunnelData = {
    discovered: leads.filter((l) => l.stage === "discovered").length,
    enriched: leads.filter((l) => l.stage === "enriched").length,
    outreach: leads.filter((l) => l.stage === "outreach").length,
    warm_intro: leads.filter((l) => l.stage === "warm_intro").length,
    converted: leads.filter((l) => l.stage === "converted").length,
    eliminated: leads.filter((l) => l.stage === "eliminated").length,
  };

  const totalCost = (costRes.data ?? []).reduce((sum, r) => sum + Number(r.cost_usd), 0);

  return {
    funnel,
    totalLeads: leads.length,
    activeCampaigns: campaigns.filter((c) => c.status === "active").length,
    totalCostUsd: Math.round(totalCost * 100) / 100,
    recentRuns: (cronRes.data ?? []) as CronRun[],
  };
}

export default async function DashboardPage() {
  const { funnel, totalLeads, activeCampaigns, totalCostUsd, recentRuns } = await getDashboardData();

  const funnelStages = [
    { key: "discovered", label: "Discovered", count: funnel.discovered, color: "bg-blue-100 text-blue-800" },
    { key: "enriched", label: "Enriched", count: funnel.enriched, color: "bg-purple-100 text-purple-800" },
    { key: "outreach", label: "In Outreach", count: funnel.outreach, color: "bg-yellow-100 text-yellow-800" },
    { key: "warm_intro", label: "Warm Intro", count: funnel.warm_intro, color: "bg-orange-100 text-orange-800" },
    { key: "converted", label: "Converted", count: funnel.converted, color: "bg-green-100 text-green-800" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <LayoutDashboard className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground text-sm">Plummy Venture Lead Generation Overview</p>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-primary p-1.5 bg-primary/10 rounded-lg" />
              <div>
                <p className="text-2xl font-bold">{totalLeads}</p>
                <p className="text-xs text-muted-foreground">Total Leads</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-green-600 p-1.5 bg-green-100 rounded-lg" />
              <div>
                <p className="text-2xl font-bold">{activeCampaigns}</p>
                <p className="text-xs text-muted-foreground">Active Campaigns</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-yellow-600 p-1.5 bg-yellow-100 rounded-lg" />
              <div>
                <p className="text-2xl font-bold">{formatCurrency(totalCostUsd)}</p>
                <p className="text-xs text-muted-foreground">Total AI Cost</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Funnel */}
      <Card>
        <CardHeader>
          <CardTitle>Lead Funnel</CardTitle>
          <CardDescription>Current distribution across pipeline stages</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            {funnelStages.map((stage) => (
              <div key={stage.key} className="flex-1 min-w-[80px] text-center p-4 rounded-lg bg-muted">
                <div className="text-3xl font-bold">{stage.count}</div>
                <div className={`mt-1 inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${stage.color}`}>
                  {stage.label}
                </div>
              </div>
            ))}
            <div className="flex-1 min-w-[80px] text-center p-4 rounded-lg bg-red-50">
              <div className="text-3xl font-bold text-red-600">{funnel.eliminated}</div>
              <div className="mt-1 inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800">
                Eliminated
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Agent Run History */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            <CardTitle>Agent Run History</CardTitle>
          </div>
          <CardDescription>Recent autonomous discovery pipeline runs</CardDescription>
        </CardHeader>
        <CardContent>
          {recentRuns.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No agent runs yet. Configure API keys in Settings to enable the daily agent.
            </p>
          ) : (
            <div className="space-y-3">
              {recentRuns.map((run) => (
                <div key={run.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={run.status === "completed" ? "success" : run.status === "failed" ? "destructive" : "secondary"}
                    >
                      {run.status}
                    </Badge>
                    <div>
                      <p className="text-sm font-medium">{formatDate(run.run_at)}</p>
                      <p className="text-xs text-muted-foreground">
                        {run.leads_found} found · {run.leads_qualified} qualified · {run.leads_enriched} enriched
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{formatCurrency(Number(run.cost_usd))}</p>
                    {run.error_message && (
                      <p className="text-xs text-destructive truncate max-w-[200px]">{run.error_message}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
