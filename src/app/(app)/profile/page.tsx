"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  UserRound,
  Mail,
  Copy,
  Check,
  Link as LinkIcon,
  Briefcase,
  Sparkles,
  Shield,
  ExternalLink,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Profile {
  full_name: string;
  title: string;
  linkedin_url: string | null;
}

function initials(name: string) {
  const p = name.trim().split(/\s+/).filter(Boolean);
  if (p.length === 0) return "PV";
  if (p.length === 1) return p[0]!.slice(0, 2).toUpperCase();
  return `${p[0]![0]}${p[p.length - 1]![0]}`.toUpperCase();
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile>({ full_name: "", title: "", linkedin_url: "" });
  const [initialProfile, setInitialProfile] = useState<Profile | null>(null);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/profile")
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error ?? "Could not load profile");
        return d;
      })
      .then((d) => {
        const next = d.profile
          ? {
              full_name: d.profile.full_name ?? "",
              title: d.profile.title ?? "",
              linkedin_url: d.profile.linkedin_url ?? "",
            }
          : { full_name: "", title: "", linkedin_url: "" };
        setProfile(next);
        setInitialProfile(next);
        if (d.email) setEmail(d.email);
      })
      .catch((e: Error) => setLoadError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const dirty = useMemo(() => {
    if (!initialProfile) return false;
    return (
      profile.full_name !== initialProfile.full_name ||
      profile.title !== initialProfile.title ||
      (profile.linkedin_url ?? "") !== (initialProfile.linkedin_url ?? "")
    );
  }, [profile, initialProfile]);

  const linkedinHref = useMemo(() => {
    const u = profile.linkedin_url?.trim();
    if (!u) return null;
    if (u.startsWith("http://") || u.startsWith("https://")) return u;
    return `https://${u}`;
  }, [profile.linkedin_url]);

  const completionPct = useMemo(() => {
    const fields = [profile.full_name?.trim(), profile.title?.trim(), profile.linkedin_url?.trim()];
    const filled = fields.filter(Boolean).length;
    return Math.round((filled / 3) * 100);
  }, [profile.full_name, profile.title, profile.linkedin_url]);

  const handleSave = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setSaving(true);
      setSaveError(null);
      setSaved(false);
      try {
        const res = await fetch("/api/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            full_name: profile.full_name,
            title: profile.title,
            linkedin_url: profile.linkedin_url?.trim() || null,
          }),
        });
        const d = await res.json();
        if (!res.ok) throw new Error(d.error ?? "Save failed");
        const next = {
          full_name: d.profile?.full_name ?? profile.full_name,
          title: d.profile?.title ?? profile.title,
          linkedin_url: d.profile?.linkedin_url ?? profile.linkedin_url,
        };
        setProfile(next);
        setInitialProfile(next);
        setSaved(true);
        window.setTimeout(() => setSaved(false), 4000);
      } catch (err: unknown) {
        setSaveError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setSaving(false);
      }
    },
    [profile]
  );

  const copyEmail = useCallback(() => {
    if (!email) return;
    void navigator.clipboard.writeText(email);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }, [email]);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl animate-pulse space-y-8 px-0">
        <div className="h-36 rounded-2xl bg-muted/60" />
        <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
          <div className="h-48 rounded-2xl bg-muted/50" />
          <div className="space-y-4">
            <div className="h-40 rounded-2xl bg-muted/50" />
            <div className="h-72 rounded-2xl bg-muted/50" />
          </div>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center justify-center gap-4 rounded-2xl border border-destructive/30 bg-destructive/5 px-8 py-16 text-center">
        <AlertCircle className="h-10 w-10 text-destructive" aria-hidden />
        <p className="text-sm font-medium text-foreground">{loadError}</p>
        <Button type="button" variant="outline" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="relative mx-auto max-w-5xl pb-16">
      {/* Hero */}
      <section
        className={cn(
          "relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br",
          "from-primary/[0.07] via-background to-primary/[0.04]",
          "shadow-[0_1px_0_0_hsl(var(--border)),0_24px_48px_-24px_hsl(var(--primary)/0.25)]",
          "before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,hsl(var(--primary)/0.15),transparent)]"
        )}
      >
        <div className="relative flex flex-col gap-6 px-6 py-10 sm:flex-row sm:items-end sm:justify-between sm:px-10">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div
              className={cn(
                "flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl text-2xl font-semibold tracking-tight",
                "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/25"
              )}
              aria-hidden
            >
              {initials(profile.full_name || "Plummy Venture")}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                  {profile.full_name.trim() || "Your profile"}
                </h1>
                <Badge variant="secondary" className="gap-1 font-normal">
                  <Shield className="h-3 w-3" aria-hidden />
                  Active account
                </Badge>
              </div>
              <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted-foreground">
                Identity used across outreach—names and titles appear in email and LinkedIn sequences for Plummy Venture.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Completion
            </span>
              <div className="h-2 w-full max-w-[200px] overflow-hidden rounded-full bg-muted sm:w-[200px]">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${completionPct}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Add name, role, and LinkedIn for a complete outreach signature.
            </p>
          </div>
        </div>
      </section>

      <div className="mt-10 grid gap-8 lg:grid-cols-[280px_1fr] lg:items-start">
        {/* Sidebar */}
        <aside className="space-y-6 lg:sticky lg:top-24">
          <Card className="overflow-hidden border-border/80 shadow-sm">
            <CardHeader className="border-b border-border/60 bg-muted/30 pb-4">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Sparkles className="h-4 w-4 text-primary" aria-hidden />
                Quick tips
              </CardTitle>
              <CardDescription className="text-xs leading-relaxed">
                Keep your title concise—it shows next to your name in templates.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-5 text-sm text-muted-foreground">
              <p>Use the same name your prospects see on LinkedIn.</p>
              <Separator />
              <p className="text-xs leading-relaxed">
                LinkedIn URLs help the team route warm intros and keeps signatures consistent across campaigns.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/80 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Mail className="h-4 w-4" aria-hidden />
                Account email
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 rounded-xl border border-border/80 bg-muted/20 px-3 py-2.5">
                <span className="min-w-0 flex-1 truncate font-mono text-xs text-foreground">{email || "—"}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={copyEmail}
                  disabled={!email}
                  aria-label={copied ? "Copied" : "Copy email"}
                >
                  {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                Managed through Supabase Auth. Contact your admin to change the login email.
              </p>
            </CardContent>
          </Card>
        </aside>

        {/* Main form */}
        <div className="min-w-0 space-y-6">
          <Card className="border-border/80 shadow-sm">
            <CardHeader className="border-b border-border/60 bg-muted/20 pb-6">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-xl font-semibold tracking-tight">Outreach identity</CardTitle>
                  <CardDescription className="mt-1.5 max-w-2xl text-sm">
                    This information is used as the sign-off in automated outreach and internal lead notes.
                  </CardDescription>
                </div>
                {saved && (
                  <Badge variant="success" className="mt-2 w-fit shrink-0 sm:mt-0">
                    <Check className="mr-1 h-3 w-3" aria-hidden />
                    Saved
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-8">
              <form onSubmit={handleSave} className="space-y-8">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="full_name" className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      <UserRound className="h-3.5 w-3.5" aria-hidden />
                      Full name
                    </Label>
                    <Input
                      id="full_name"
                      className="h-11 rounded-xl border-border/80 bg-background shadow-none transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30"
                      value={profile.full_name}
                      onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                      placeholder="Erfanul Hoque"
                      required
                      autoComplete="name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="title" className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      <Briefcase className="h-3.5 w-3.5" aria-hidden />
                      Title / role
                    </Label>
                    <Input
                      id="title"
                      className="h-11 rounded-xl border-border/80 bg-background shadow-none transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30"
                      value={profile.title}
                      onChange={(e) => setProfile({ ...profile, title: e.target.value })}
                      placeholder="Partner, Plummy Venture"
                      autoComplete="organization-title"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="linkedin_url" className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <LinkIcon className="h-3.5 w-3.5" aria-hidden />
                    LinkedIn profile
                  </Label>
                  <Input
                    id="linkedin_url"
                    type="url"
                    className="h-11 rounded-xl border-border/80 bg-background font-mono text-sm shadow-none transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30"
                    value={profile.linkedin_url ?? ""}
                    onChange={(e) => setProfile({ ...profile, linkedin_url: e.target.value || null })}
                    placeholder="https://linkedin.com/in/yourprofile"
                    autoComplete="url"
                  />
                  {linkedinHref && (
                    <a
                      href={linkedinHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                    >
                      Preview public profile
                      <ExternalLink className="h-3 w-3" aria-hidden />
                    </a>
                  )}
                </div>

                {saveError && (
                  <div
                    role="alert"
                    className="flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive"
                  >
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                    {saveError}
                  </div>
                )}

                <Separator className="my-2" />

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-muted-foreground">
                    {dirty ? "You have unsaved changes." : "All changes saved to your workspace profile."}
                  </p>
                  <div className="flex flex-wrap items-center gap-3">
                    <Button
                      type="button"
                      variant="ghost"
                      className="rounded-xl"
                      disabled={!dirty || saving}
                      onClick={() => initialProfile && setProfile(initialProfile)}
                    >
                      Reset
                    </Button>
                    <Button type="submit" disabled={saving || !dirty} className="min-w-[140px] rounded-xl shadow-md shadow-primary/20">
                      {saving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                          Saving…
                        </>
                      ) : (
                        "Save changes"
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
