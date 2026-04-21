"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { SIGNATORIES, SCORE_DIMENSIONS } from "@/types/domain";
import type { Lead, ScoreDimension, OutreachSequence, OutreachTouch } from "@/types/domain";
import { ArrowLeft, Loader2, Mail, Briefcase, Camera, Zap, Copy } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface LeadDetail extends Lead {
  score_dimensions?: ScoreDimension[];
  outreach_sequences?: (OutreachSequence & { outreach_touches: OutreachTouch[] })[];
  campaigns?: { name: string; assigned_signatory: string; product_category: string; target_market: string } | null;
}

const CHANNEL_ICONS = { linkedin: Briefcase, email: Mail, instagram: Camera };

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [lead, setLead] = useState<LeadDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [enriching, setEnriching] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<"linkedin" | "email" | "instagram">("linkedin");
  const [selectedSignatory, setSelectedSignatory] = useState<"erfanul" | "ikramul">("erfanul");

  useEffect(() => {
    fetch(`/api/leads/${id}`)
      .then((r) => r.json())
      .then((d) => { setLead(d.lead); setLoading(false); });
  }, [id]);

  async function handleEnrich() {
    setEnriching(true);
    const res = await fetch(`/api/leads/${id}/enrich`, { method: "POST" });
    const data = await res.json();
    if (data.lead) setLead(data.lead);
    setEnriching(false);
  }

  async function handleGenerateOutreach() {
    setGenerating(true);
    const res = await fetch(`/api/leads/${id}/outreach`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channel: selectedChannel, signatory: selectedSignatory }),
    });
    const data = await res.json();
    if (data.sequence && lead) {
      setLead((prev) => prev ? {
        ...prev,
        outreach_sequences: [...(prev.outreach_sequences ?? []), data.sequence],
      } : prev);
    }
    setGenerating(false);
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
  }

  if (loading) return <div className="text-sm text-muted-foreground">Loading...</div>;
  if (!lead) return <div className="text-sm text-destructive">Lead not found</div>;

  const signatory = SIGNATORIES.find((s) => s.value === lead.campaigns?.assigned_signatory);

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link href="/pipeline">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{lead.brand_name}</h1>
          {lead.website && <a href={`https://${lead.website}`} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">{lead.website}</a>}
        </div>
        <Badge variant={lead.stage === "enriched" ? "success" : lead.stage === "outreach" ? "warning" : "secondary"}>
          {lead.stage}
        </Badge>
        {lead.fit_score && (
          <span className={`text-lg font-bold px-3 py-1 rounded-lg ${lead.fit_score >= 7 ? "bg-green-100 text-green-800" : lead.fit_score >= 5 ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"}`}>
            {lead.fit_score.toFixed(1)}
          </span>
        )}
      </div>

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Brand Details</TabsTrigger>
          <TabsTrigger value="scores">Score ({lead.score_dimensions?.length ?? 0} dims)</TabsTrigger>
          <TabsTrigger value="outreach">Outreach ({lead.outreach_sequences?.length ?? 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4 mt-4">
          {/* Enrichment action */}
          {lead.stage === "discovered" && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="pt-4 flex items-center justify-between">
                <p className="text-sm text-blue-800">This lead hasn&apos;t been enriched yet. Run Agent 3 to get founder details and scores.</p>
                <Button onClick={handleEnrich} disabled={enriching} size="sm">
                  {enriching ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" />Enriching...</> : <><Zap className="h-4 w-4 mr-1" />Enrich Now</>}
                </Button>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Founder</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <InfoRow label="Name" value={lead.founder_name} />
                <InfoRow label="Title" value={lead.founder_title} />
                {lead.founder_linkedin_id && (
                  <div>
                    <p className="text-xs text-muted-foreground">LinkedIn</p>
                    <a href={`https://linkedin.com/in/${lead.founder_linkedin_id}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1 text-sm">
                      <Briefcase className="h-3 w-3" />{lead.founder_linkedin_id}
                    </a>
                  </div>
                )}
                {lead.founder_email && (
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <a href={`mailto:${lead.founder_email}`} className="text-primary hover:underline flex items-center gap-1 text-sm">
                      <Mail className="h-3 w-3" />{lead.founder_email}
                    </a>
                  </div>
                )}
                {lead.founder_instagram_handle && (
                  <div>
                    <p className="text-xs text-muted-foreground">Instagram</p>
                    <a href={`https://instagram.com/${lead.founder_instagram_handle}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1 text-sm">
                      <Camera className="h-3 w-3" />@{lead.founder_instagram_handle}
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Brand Info</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <InfoRow label="Description" value={lead.brand_description} />
                <InfoRow label="Founded" value={lead.founding_year?.toString()} />
                <InfoRow label="Employees" value={lead.employee_count_estimate} />
                <InfoRow label="Revenue" value={lead.revenue_estimate} />
                <InfoRow label="Price Point" value={lead.price_point_usd ? `$${lead.price_point_usd}` : null} />
                <InfoRow label="Products" value={lead.product_lines} />
                <InfoRow label="Manufacturer" value={lead.current_manufacturer_region} />
                <InfoRow label="Instagram" value={lead.instagram_followers ? `${lead.instagram_followers.toLocaleString()} followers` : null} />
                {lead.press_mentions && <InfoRow label="Press" value={lead.press_mentions} />}
              </CardContent>
            </Card>
          </div>

          {lead.blocker_outcome && lead.blocker_outcome !== "none" && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <Badge variant="destructive">{lead.blocker_outcome === "eliminated" ? "Eliminated" : "Warm Intro"}</Badge>
                  <p className="text-sm text-red-800">Triggered blocker rule: <strong>{lead.blocker_rule_key}</strong></p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="scores" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Score Dimensions</CardTitle>
              <CardDescription>Weighted fit assessment across {SCORE_DIMENSIONS.length} dimensions</CardDescription>
            </CardHeader>
            <CardContent>
              {!lead.score_dimensions?.length ? (
                <p className="text-sm text-muted-foreground">No scores yet. Enrich this lead to generate scores.</p>
              ) : (
                <div className="space-y-3">
                  {lead.score_dimensions.map((dim) => (
                    <div key={dim.id} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium capitalize">{dim.dimension.replace(/_/g, " ")}</span>
                        <span className={`font-bold ${dim.score >= 7 ? "text-green-700" : dim.score >= 5 ? "text-yellow-700" : "text-red-700"}`}>
                          {dim.score.toFixed(1)}/10
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-muted">
                        <div
                          className={`h-2 rounded-full ${dim.score >= 7 ? "bg-green-500" : dim.score >= 5 ? "bg-yellow-500" : "bg-red-500"}`}
                          style={{ width: `${(dim.score / 10) * 100}%` }}
                        />
                      </div>
                      {dim.rationale && <p className="text-xs text-muted-foreground">{dim.rationale}</p>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="outreach" className="space-y-4 mt-4">
          {lead.stage === "enriched" || lead.stage === "outreach" || lead.stage === "warm_intro" ? (
            <Card>
              <CardHeader>
                <CardTitle>Generate Outreach Sequence</CardTitle>
                <CardDescription>AI-generated 3-touch sequence tailored to this brand and founder</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Channel</p>
                    <div className="flex gap-2">
                      {(["linkedin", "email", "instagram"] as const).map((ch) => {
                        const Icon = CHANNEL_ICONS[ch];
                        const contact = ch === "linkedin" ? lead.founder_linkedin_id : ch === "email" ? lead.founder_email : lead.founder_instagram_handle;
                        return (
                          <button
                            key={ch}
                            onClick={() => setSelectedChannel(ch)}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-md border text-sm font-medium transition-colors ${selectedChannel === ch ? "bg-primary text-primary-foreground border-primary" : "bg-background border-input hover:bg-muted"}`}
                          >
                            <Icon className="h-4 w-4" />
                            <span className="capitalize">{ch}</span>
                            {!contact && <span className="text-xs opacity-60">?</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Sign-off</p>
                    <Select value={selectedSignatory} onValueChange={(v) => setSelectedSignatory(v as "erfanul" | "ikramul")}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SIGNATORIES.map((s) => (
                          <SelectItem key={s.value} value={s.value}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={handleGenerateOutreach} disabled={generating}>
                  {generating ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" />Generating...</> : "Generate Sequence"}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Enrich this lead first before generating outreach.</p>
              </CardContent>
            </Card>
          )}

          {lead.outreach_sequences?.map((seq) => (
            <Card key={seq.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base capitalize">
                    {seq.channel} · v{seq.version} · {SIGNATORIES.find((s) => s.value === seq.signatory)?.name}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{seq.status}</Badge>
                    <span className="text-xs text-muted-foreground">{formatDate(seq.created_at)}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {seq.outreach_touches?.sort((a, b) => a.touch_number - b.touch_number).map((touch) => (
                  <div key={touch.id} className="p-4 rounded-lg border space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">Touch {touch.touch_number} · Day {touch.send_after_days}</Badge>
                      <Button variant="ghost" size="icon" onClick={() => copyToClipboard(touch.body)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    {touch.subject && <p className="text-sm font-medium">Subject: {touch.subject}</p>}
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{touch.body}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm">{value}</p>
    </div>
  );
}
