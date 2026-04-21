"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { SIGNATORIES } from "@/types/domain";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

const CHANNELS = ["linkedin", "email", "instagram"];

export default function NewCampaignPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    product_category: "",
    target_market: "",
    min_price_point: "",
    channels: [] as string[],
    assigned_signatory: "erfanul" as "erfanul" | "ikramul",
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleChannel(ch: string) {
    setForm((f) => ({
      ...f,
      channels: f.channels.includes(ch) ? f.channels.filter((c) => c !== ch) : [...f.channels, ch],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      ...form,
      min_price_point: form.min_price_point ? Number(form.min_price_point) : null,
      notes: form.notes || null,
    };

    const res = await fetch("/api/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (data.campaign) {
      router.push(`/campaigns/${data.campaign.id}`);
    } else {
      setError(data.error ?? "Failed to create campaign");
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/campaigns">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">New Campaign</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Campaign Details</CardTitle>
          <CardDescription>Configure the targeting parameters for this lead generation campaign.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Campaign Name</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Q2 Activewear USA"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="product_category">Product Category</Label>
                <Input
                  id="product_category"
                  value={form.product_category}
                  onChange={(e) => setForm({ ...form, product_category: e.target.value })}
                  placeholder="Knitwear, Activewear"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="target_market">Target Market</Label>
                <Input
                  id="target_market"
                  value={form.target_market}
                  onChange={(e) => setForm({ ...form, target_market: e.target.value })}
                  placeholder="USA DTC Brands"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="min_price_point">Minimum Retail Price (USD)</Label>
              <Input
                id="min_price_point"
                type="number"
                min="0"
                value={form.min_price_point}
                onChange={(e) => setForm({ ...form, min_price_point: e.target.value })}
                placeholder="50"
              />
            </div>

            <div className="space-y-2">
              <Label>Outreach Channels</Label>
              <div className="flex gap-2">
                {CHANNELS.map((ch) => (
                  <button
                    key={ch}
                    type="button"
                    onClick={() => toggleChannel(ch)}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-colors capitalize ${
                      form.channels.includes(ch)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-muted-foreground border-input hover:bg-muted"
                    }`}
                  >
                    {ch}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Assigned Signatory</Label>
              <Select
                value={form.assigned_signatory}
                onValueChange={(v) => setForm({ ...form, assigned_signatory: v as "erfanul" | "ikramul" })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SIGNATORIES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.name} — {s.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Input
                id="notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Any special instructions for this campaign"
              />
            </div>

            {error && <p className="text-xs text-destructive">{error}</p>}

            <div className="flex gap-2">
              <Button type="submit" disabled={saving || !form.name || !form.product_category || !form.target_market}>
                {saving ? "Creating..." : "Create Campaign"}
              </Button>
              <Link href="/campaigns">
                <Button type="button" variant="outline">Cancel</Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
