"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { SIGNATORIES } from "@/types/domain";
import type { Campaign } from "@/types/domain";
import { ArrowLeft, Play, Pause, Bot } from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/utils";

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/campaigns/${id}`)
      .then((r) => r.json())
      .then((d) => { setCampaign(d.campaign); setLoading(false); });
  }, [id]);

  async function updateStatus(status: Campaign["status"]) {
    const res = await fetch(`/api/campaigns/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (data.campaign) setCampaign(data.campaign);
  }

  async function runAgent() {
    setRunning(true);
    setRunResult(null);
    const res = await fetch("/api/cron/daily-discovery", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET ?? ""}`,
      },
    });
    const data = await res.json();
    const result = data.summary?.[0]?.result;
    if (result?.error) {
      setRunResult(`Error: ${result.error}`);
    } else if (result) {
      setRunResult(`Done! Found ${result.discovered ?? 0}, qualified ${result.qualified ?? 0}, enriched ${result.enriched ?? 0}. Cost: ${formatCurrency(result.totalCost ?? 0)}`);
    }
    setRunning(false);
  }

  if (loading) return <div className="text-sm text-muted-foreground">Loading...</div>;
  if (!campaign) return <div className="text-sm text-destructive">Campaign not found</div>;

  const signatory = SIGNATORIES.find((s) => s.value === campaign.assigned_signatory);

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/campaigns">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{campaign.name}</h1>
          <p className="text-sm text-muted-foreground">{campaign.product_category} · {campaign.target_market}</p>
        </div>
        <Badge variant={campaign.status === "active" ? "success" : "secondary"}>{campaign.status}</Badge>
      </div>

      <Card>
        <CardHeader><CardTitle>Campaign Details</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <div><p className="text-muted-foreground text-xs">Signatory</p><p>{signatory?.name}</p><p className="text-xs text-muted-foreground">{signatory?.title}</p></div>
            <div><p className="text-muted-foreground text-xs">Min Price Point</p><p>{campaign.min_price_point ? `$${campaign.min_price_point}` : "—"}</p></div>
            <div><p className="text-muted-foreground text-xs">Channels</p><div className="flex flex-wrap gap-1 mt-1">{campaign.channels?.map((ch: string) => <span key={ch} className="text-xs bg-muted px-2 py-0.5 rounded-full capitalize">{ch}</span>)}</div></div>
            <div><p className="text-muted-foreground text-xs">Created</p><p>{formatDate(campaign.created_at)}</p></div>
          </div>
          {campaign.notes && <div><p className="text-muted-foreground text-xs">Notes</p><p>{campaign.notes}</p></div>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
          <CardDescription>Manually trigger the 3-agent pipeline for this campaign</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            {campaign.status === "active" ? (
              <Button variant="outline" onClick={() => updateStatus("paused")}>
                <Pause className="h-4 w-4 mr-1" /> Pause Campaign
              </Button>
            ) : (
              <Button variant="outline" onClick={() => updateStatus("active")}>
                <Play className="h-4 w-4 mr-1" /> Resume Campaign
              </Button>
            )}
            <Button onClick={runAgent} disabled={running || campaign.status !== "active"}>
              <Bot className="h-4 w-4 mr-1" />
              {running ? "Running agents..." : "Run Agent Pipeline Now"}
            </Button>
          </div>
          {runResult && (
            <p className={`text-sm ${runResult.startsWith("Error") ? "text-destructive" : "text-green-700"}`}>
              {runResult}
            </p>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Link href="/discovery">
          <Button variant="outline">Add Leads Manually</Button>
        </Link>
        <Link href={`/pipeline?campaign=${id}`}>
          <Button variant="outline">View Pipeline</Button>
        </Link>
      </div>
    </div>
  );
}
