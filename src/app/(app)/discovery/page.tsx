"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Telescope, ChevronRight, Loader2, CheckCircle2, XCircle } from "lucide-react";
import type { Campaign, LeadCandidate } from "@/types/domain";

interface ParsedBrand {
  brand_name: string;
  website: string | null;
  snippet: string;
}

function parseBrandText(text: string): ParsedBrand[] {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const brands: ParsedBrand[] = [];

  for (const line of lines) {
    // Try to parse: "Brand Name | website.com | description"
    const parts = line.split(/[|,\t]/).map((p) => p.trim());
    if (parts.length >= 1 && parts[0]) {
      const brand_name = parts[0].replace(/^[-*•]\s*/, "").trim();
      if (brand_name.length < 2) continue;

      const websiteCandidate = parts.find((p) => p.includes(".") && !p.includes(" "));
      const snippet = parts.filter((p) => p !== brand_name && p !== websiteCandidate).join(" ").trim();

      brands.push({
        brand_name,
        website: websiteCandidate ?? null,
        snippet: snippet || line,
      });
    }
  }

  return brands;
}

export default function DiscoveryPage() {
  const [pasteText, setPasteText] = useState("");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState("");
  const [parsed, setParsed] = useState<ParsedBrand[]>([]);
  const [saving, setSaving] = useState(false);
  const [qualifying, setQualifying] = useState(false);
  const [savedCandidates, setSavedCandidates] = useState<LeadCandidate[]>([]);
  const [step, setStep] = useState<"input" | "preview" | "qualify">("input");
  const [qualifyResult, setQualifyResult] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/campaigns")
      .then((r) => r.json())
      .then((d) => setCampaigns(d.campaigns ?? []));
  }, []);

  function handleParse() {
    const brands = parseBrandText(pasteText);
    setParsed(brands);
    setStep("preview");
  }

  async function handleSave() {
    if (!selectedCampaign) return;
    setSaving(true);

    const payload = parsed.map((b) => ({
      campaign_id: selectedCampaign,
      brand_name: b.brand_name,
      website: b.website,
      snippet: b.snippet,
      source: "manual",
      status: "pending_qualification",
    }));

    const res = await fetch("/api/lead-candidates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setSavedCandidates(data.candidates ?? []);
    setSaving(false);
    setStep("qualify");
  }

  async function handleQualify() {
    if (!selectedCampaign) return;
    setQualifying(true);
    setQualifyResult(null);

    // Trigger cron/pipeline for this campaign
    const res = await fetch("/api/cron/daily-discovery", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    const data = await res.json();
    const result = data.summary?.[0]?.result;
    if (result?.error) {
      setQualifyResult(`Error: ${result.error}`);
    } else {
      setQualifyResult(`Agents ran! Qualified ${result?.qualified ?? 0} leads, enriched ${result?.enriched ?? 0}.`);
    }
    setQualifying(false);
  }

  function reset() {
    setPasteText("");
    setParsed([]);
    setSavedCandidates([]);
    setQualifyResult(null);
    setStep("input");
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Telescope className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Manual Discovery</h1>
          <p className="text-sm text-muted-foreground">Paste brand names/URLs to add them to the qualification pipeline</p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 text-sm">
        {["input", "preview", "qualify"].map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === s ? "bg-primary text-primary-foreground" : i < ["input","preview","qualify"].indexOf(step) ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"}`}>
              {i + 1}
            </span>
            <span className={step === s ? "font-medium" : "text-muted-foreground capitalize"}>{s === "qualify" ? "Run Agents" : s}</span>
            {i < 2 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          </div>
        ))}
      </div>

      {step === "input" && (
        <Card>
          <CardHeader>
            <CardTitle>Paste Brand Data</CardTitle>
            <CardDescription>
              One brand per line. Format: <code className="text-xs bg-muted px-1 rounded">Brand Name | website.com | description</code>
              <br />Or just brand names, one per line.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Campaign</Label>
              <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a campaign..." />
                </SelectTrigger>
                <SelectContent>
                  {campaigns.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Brand List</Label>
              <Textarea
                rows={12}
                placeholder={"Vuori | vuori.com | DTC performance apparel\nAllbirds | allbirds.com\nSets"}
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                className="font-mono text-sm"
              />
            </div>
            <Button onClick={handleParse} disabled={!pasteText.trim() || !selectedCampaign}>
              Parse & Preview
            </Button>
          </CardContent>
        </Card>
      )}

      {step === "preview" && (
        <Card>
          <CardHeader>
            <CardTitle>Preview — {parsed.length} brands parsed</CardTitle>
            <CardDescription>Review the parsed brands before saving to the qualification queue</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="max-h-80 overflow-y-auto space-y-2">
              {parsed.map((brand, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg border text-sm">
                  <span className="text-muted-foreground w-5 text-right shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{brand.brand_name}</p>
                    {brand.website && <p className="text-xs text-primary">{brand.website}</p>}
                    {brand.snippet && <p className="text-xs text-muted-foreground truncate">{brand.snippet}</p>}
                  </div>
                  <Badge variant="secondary">pending</Badge>
                </div>
              ))}
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Saving...</> : `Save ${parsed.length} Candidates`}
              </Button>
              <Button variant="outline" onClick={() => setStep("input")}>Back</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "qualify" && (
        <Card>
          <CardHeader>
            <CardTitle>Candidates Saved!</CardTitle>
            <CardDescription>{savedCandidates.length} brands added to the qualification queue</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-green-50 border border-green-200 flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
              <p className="text-sm text-green-800">
                {savedCandidates.length} candidates are pending qualification. Run the agents to filter and enrich them.
              </p>
            </div>

            {qualifyResult && (
              <div className={`p-4 rounded-lg border flex items-center gap-3 ${qualifyResult.startsWith("Error") ? "bg-red-50 border-red-200" : "bg-blue-50 border-blue-200"}`}>
                {qualifyResult.startsWith("Error")
                  ? <XCircle className="h-5 w-5 text-red-600 shrink-0" />
                  : <CheckCircle2 className="h-5 w-5 text-blue-600 shrink-0" />
                }
                <p className={`text-sm ${qualifyResult.startsWith("Error") ? "text-red-800" : "text-blue-800"}`}>
                  {qualifyResult}
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={handleQualify} disabled={qualifying}>
                {qualifying ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Running agents...</> : "Run Qualifier + Enrichment Agents"}
              </Button>
              <Button variant="outline" onClick={reset}>Add More Brands</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
