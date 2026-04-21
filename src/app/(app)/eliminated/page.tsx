import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { XCircle } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default async function EliminatedPage() {
  const supabase = await createClient();

  const [leadsRes, candidatesRes] = await Promise.all([
    supabase
      .from("leads")
      .select("*, campaigns(name)")
      .eq("stage", "eliminated")
      .order("updated_at", { ascending: false }),
    supabase
      .from("lead_candidates")
      .select("*, campaigns(name)")
      .eq("status", "disqualified")
      .order("created_at", { ascending: false }),
  ]);

  const eliminatedLeads = leadsRes.data ?? [];
  const disqualifiedCandidates = candidatesRes.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <XCircle className="h-6 w-6 text-destructive" />
        <div>
          <h1 className="text-2xl font-bold">Eliminated & Disqualified</h1>
          <p className="text-sm text-muted-foreground">Leads removed from the pipeline and candidates that failed qualification</p>
        </div>
      </div>

      {/* Eliminated Leads */}
      <div>
        <h2 className="text-base font-semibold mb-3">Eliminated Leads ({eliminatedLeads.length})</h2>
        {eliminatedLeads.length === 0 ? (
          <p className="text-sm text-muted-foreground">No eliminated leads.</p>
        ) : (
          <div className="space-y-2">
            {eliminatedLeads.map((lead) => (
              <Card key={lead.id}>
                <CardContent className="py-3 px-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{lead.brand_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {lead.campaigns?.name} · {lead.blocker_rule_key ?? "manually eliminated"} · {formatDate(lead.updated_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {lead.blocker_outcome === "eliminated" && (
                      <Badge variant="destructive">Blocked</Badge>
                    )}
                    {lead.website && (
                      <a href={`https://${lead.website}`} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">{lead.website}</a>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Disqualified Candidates */}
      <div>
        <h2 className="text-base font-semibold mb-3">Disqualified Candidates ({disqualifiedCandidates.length})</h2>
        {disqualifiedCandidates.length === 0 ? (
          <p className="text-sm text-muted-foreground">No disqualified candidates.</p>
        ) : (
          <div className="space-y-2">
            {disqualifiedCandidates.map((candidate) => (
              <Card key={candidate.id}>
                <CardContent className="py-3 px-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{candidate.brand_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {candidate.campaigns?.name} · {candidate.disqualify_reason ?? "no reason given"} · {formatDate(candidate.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Candidate</Badge>
                    {candidate.fit_score !== null && (
                      <span className="text-xs bg-muted px-2 py-0.5 rounded-full">Score: {candidate.fit_score}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
