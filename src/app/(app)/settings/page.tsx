"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Settings as SettingsIcon, Plus, Trash2 } from "lucide-react";
import type { BlockerRule, Niche, Product } from "@/types/domain";

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, unknown>>({});
  const [blockerRules, setBlockerRules] = useState<BlockerRule[]>([]);
  const [niches, setNiches] = useState<Niche[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/settings").then((r) => r.json()),
      fetch("/api/blocker-rules").then((r) => r.json()),
      fetch("/api/niches").then((r) => r.json()),
      fetch("/api/products").then((r) => r.json()),
    ]).then(([s, br, n, p]) => {
      setSettings(s.settings ?? {});
      setBlockerRules(br.rules ?? []);
      setNiches(n.niches ?? []);
      setProducts(p.products ?? []);
    });
  }, []);

  async function saveSettings() {
    setSaving(true);
    await fetch("/api/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(settings) });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  async function toggleBlocker(rule: BlockerRule) {
    const updated = { id: rule.id, enabled: !rule.enabled };
    await fetch("/api/blocker-rules", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updated) });
    setBlockerRules((prev) => prev.map((r) => r.id === rule.id ? { ...r, enabled: !rule.enabled } : r));
  }

  async function toggleNiche(niche: Niche) {
    await fetch("/api/niches", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: niche.id, enabled: !niche.enabled }) });
    setNiches((prev) => prev.map((n) => n.id === niche.id ? { ...n, enabled: !niche.enabled } : n));
  }

  async function toggleProduct(product: Product) {
    await fetch("/api/products", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: product.id, enabled: !product.enabled }) });
    setProducts((prev) => prev.map((p) => p.id === product.id ? { ...p, enabled: !product.enabled } : p));
  }

  async function addNiche(name: string) {
    const res = await fetch("/api/niches", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, enabled: true }) });
    const data = await res.json();
    if (data.niche) setNiches((prev) => [...prev, data.niche]);
  }

  async function deleteNiche(id: string) {
    await fetch(`/api/niches?id=${id}`, { method: "DELETE" });
    setNiches((prev) => prev.filter((n) => n.id !== id));
  }

  async function addProduct(name: string, category: string) {
    const res = await fetch("/api/products", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, category, enabled: true }) });
    const data = await res.json();
    if (data.product) setProducts((prev) => [...prev, data.product]);
  }

  async function deleteProduct(id: string) {
    await fetch(`/api/products?id=${id}`, { method: "DELETE" });
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <SettingsIcon className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      <Tabs defaultValue="api">
        <TabsList>
          <TabsTrigger value="api">API Keys</TabsTrigger>
          <TabsTrigger value="blockers">Blocker Rules</TabsTrigger>
          <TabsTrigger value="niches">Niches</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="org">Org Settings</TabsTrigger>
        </TabsList>

        {/* API Keys */}
        <TabsContent value="api" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>API Keys</CardTitle>
              <CardDescription>Keys are stored encrypted in the database, not in environment variables.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Anthropic API Key</Label>
                <Input
                  type="password"
                  placeholder="sk-ant-..."
                  value={String(settings.anthropic_api_key ?? "")}
                  onChange={(e) => setSettings({ ...settings, anthropic_api_key: e.target.value || null })}
                />
              </div>
              <div className="space-y-2">
                <Label>Serper API Key (Web Search)</Label>
                <Input
                  type="password"
                  placeholder="your-serper-key..."
                  value={String(settings.serper_api_key ?? "")}
                  onChange={(e) => setSettings({ ...settings, serper_api_key: e.target.value || null })}
                />
                <p className="text-xs text-muted-foreground">Get your key at serper.dev — needed for the autonomous daily agent.</p>
              </div>
              <Button onClick={saveSettings} disabled={saving}>
                {saving ? "Saving..." : saved ? "Saved!" : "Save API Keys"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Blocker Rules */}
        <TabsContent value="blockers" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Blocker Rules</CardTitle>
              <CardDescription>
                These rules automatically filter out or reroute leads during qualification and enrichment.
                Toggle rules off to temporarily disable them — all leads are re-evaluated using current rules.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {blockerRules.map((rule) => (
                <div key={rule.id} className="flex items-start gap-4 p-4 rounded-lg border">
                  <Switch checked={rule.enabled} onCheckedChange={() => toggleBlocker(rule)} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{rule.label}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${rule.outcome === "eliminated" ? "bg-red-100 text-red-800" : "bg-orange-100 text-orange-800"}`}>
                        {rule.outcome === "eliminated" ? "Eliminated" : "Warm Intro"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{rule.description}</p>
                    {!rule.enabled && <p className="text-xs text-yellow-600 mt-1">Disabled — rule not applied to new leads</p>}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Niches */}
        <TabsContent value="niches" className="space-y-4 mt-4">
          <NicheEditor niches={niches} onToggle={toggleNiche} onAdd={addNiche} onDelete={deleteNiche} />
        </TabsContent>

        {/* Products */}
        <TabsContent value="products" className="space-y-4 mt-4">
          <ProductEditor products={products} onToggle={toggleProduct} onAdd={addProduct} onDelete={deleteProduct} />
        </TabsContent>

        {/* Org Settings */}
        <TabsContent value="org" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Org Settings</CardTitle>
              <CardDescription>Default parameters for lead generation and outreach.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Daily Leads Target</Label>
                  <Input
                    type="number"
                    min={1}
                    max={20}
                    value={Number(settings.daily_leads_target ?? 5)}
                    onChange={(e) => setSettings({ ...settings, daily_leads_target: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Default MOQ (units)</Label>
                  <Input
                    type="number"
                    min={100}
                    value={Number(settings.moq_units ?? 500)}
                    onChange={(e) => setSettings({ ...settings, moq_units: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Advance Payment %</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={Number(settings.advance_pct ?? 30)}
                    onChange={(e) => setSettings({ ...settings, advance_pct: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Outreach Tone</Label>
                  <Input
                    value={String(settings.outreach_tone ?? "professional_warm")}
                    onChange={(e) => setSettings({ ...settings, outreach_tone: e.target.value })}
                    placeholder="professional_warm"
                  />
                </div>
              </div>
              <Button onClick={saveSettings} disabled={saving}>
                {saving ? "Saving..." : saved ? "Saved!" : "Save Org Settings"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function NicheEditor({
  niches,
  onToggle,
  onAdd,
  onDelete,
}: {
  niches: Niche[];
  onToggle: (n: Niche) => void;
  onAdd: (name: string) => void;
  onDelete: (id: string) => void;
}) {
  const [newName, setNewName] = useState("");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Target Niches</CardTitle>
        <CardDescription>Niches used by the discovery and qualification agents to find and filter brands.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {niches.map((niche) => (
          <div key={niche.id} className="flex items-center gap-3 p-3 rounded-lg border">
            <Switch checked={niche.enabled} onCheckedChange={() => onToggle(niche)} />
            <span className="flex-1 text-sm">{niche.name}</span>
            <Button variant="ghost" size="icon" onClick={() => onDelete(niche.id)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ))}
        <div className="flex gap-2 mt-4">
          <Input
            placeholder="New niche name..."
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && newName.trim()) { onAdd(newName.trim()); setNewName(""); } }}
          />
          <Button onClick={() => { if (newName.trim()) { onAdd(newName.trim()); setNewName(""); } }}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ProductEditor({
  products,
  onToggle,
  onAdd,
  onDelete,
}: {
  products: Product[];
  onToggle: (p: Product) => void;
  onAdd: (name: string, category: string) => void;
  onDelete: (id: string) => void;
}) {
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Product Catalog</CardTitle>
        <CardDescription>PV's manufacturing capabilities — used by agents to match brands to the right products.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {products.map((product) => (
          <div key={product.id} className="flex items-center gap-3 p-3 rounded-lg border">
            <Switch checked={product.enabled} onCheckedChange={() => onToggle(product)} />
            <div className="flex-1">
              <span className="text-sm">{product.name}</span>
              {product.category && <span className="text-xs text-muted-foreground ml-2">({product.category})</span>}
              {product.moq && <span className="text-xs text-muted-foreground ml-2">MOQ: {product.moq}</span>}
            </div>
            <Button variant="ghost" size="icon" onClick={() => onDelete(product.id)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ))}
        <div className="flex gap-2 mt-4">
          <Input
            placeholder="Product name..."
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <Input
            placeholder="Category..."
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            className="max-w-[150px]"
          />
          <Button onClick={() => { if (newName.trim()) { onAdd(newName.trim(), newCategory.trim()); setNewName(""); setNewCategory(""); } }}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
