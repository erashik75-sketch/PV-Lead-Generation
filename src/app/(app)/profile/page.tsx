"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User } from "lucide-react";

interface Profile {
  full_name: string;
  title: string;
  linkedin_url: string | null;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile>({ full_name: "", title: "", linkedin_url: "" });
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((d) => {
        if (d.profile) setProfile(d.profile);
        if (d.email) setEmail(d.email);
        setLoading(false);
      });
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(profile) });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  if (loading) return <div className="text-muted-foreground text-sm">Loading...</div>;

  return (
    <div className="max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <User className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Profile</h1>
          <p className="text-sm text-muted-foreground">{email}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Information</CardTitle>
          <CardDescription>This appears as the sign-off in outreach messages</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                value={profile.full_name}
                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                placeholder="Erfanul Hoque"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={profile.title}
                onChange={(e) => setProfile({ ...profile, title: e.target.value })}
                placeholder="Partner, Plummy Venture"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="linkedin_url">LinkedIn URL</Label>
              <Input
                id="linkedin_url"
                type="url"
                value={profile.linkedin_url ?? ""}
                onChange={(e) => setProfile({ ...profile, linkedin_url: e.target.value || null })}
                placeholder="https://linkedin.com/in/yourprofile"
              />
            </div>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : saved ? "Saved!" : "Save Profile"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
