"use client";

import { useState } from "react";
import Link from "next/link";
import type { Lead } from "@/types/domain";
import { LEAD_STAGES, SIGNATORIES } from "@/types/domain";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Zap, Globe } from "lucide-react";

const KANBAN_STAGES = LEAD_STAGES.filter((s) => s.value !== "eliminated");

const STAGE_COLORS: Record<string, string> = {
  discovered: "border-blue-200 bg-blue-50",
  enriched: "border-purple-200 bg-purple-50",
  outreach: "border-yellow-200 bg-yellow-50",
  warm_intro: "border-orange-200 bg-orange-50",
  converted: "border-green-200 bg-green-50",
};

interface LeadWithMeta extends Lead {
  score_dimensions?: Array<{ score: number; dimension: string }>;
  campaigns?: { name: string; assigned_signatory: string } | null;
}

export function PipelineBoard({ initialLeads }: { initialLeads: LeadWithMeta[] }) {
  const [leads, setLeads] = useState<LeadWithMeta[]>(initialLeads);
  const [dragging, setDragging] = useState<string | null>(null);

  function getLeadsForStage(stage: string) {
    return leads.filter((l) => l.stage === stage);
  }

  function onDragStart(leadId: string) {
    setDragging(leadId);
  }

  async function onDrop(targetStage: string) {
    if (!dragging) return;
    const lead = leads.find((l) => l.id === dragging);
    if (!lead || lead.stage === targetStage) { setDragging(null); return; }

    setLeads((prev) => prev.map((l) => l.id === dragging ? { ...l, stage: targetStage as Lead["stage"] } : l));
    setDragging(null);

    await fetch(`/api/leads/${dragging}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage: targetStage }),
    });
  }

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-4 min-w-max">
        {KANBAN_STAGES.map(({ value: stage, label }) => {
          const stageLeads = getLeadsForStage(stage);
          return (
            <div
              key={stage}
              className="w-64 flex flex-col"
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDrop(stage)}
            >
              <div className={`rounded-t-lg px-3 py-2 border-b ${STAGE_COLORS[stage]} border`}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">{label}</span>
                  <span className="text-xs bg-white/60 px-2 py-0.5 rounded-full">{stageLeads.length}</span>
                </div>
              </div>
              <div className={`flex-1 border border-t-0 rounded-b-lg p-2 space-y-2 min-h-[400px] ${STAGE_COLORS[stage]}`}>
                {stageLeads.map((lead) => (
                  <LeadCard key={lead.id} lead={lead} onDragStart={() => onDragStart(lead.id)} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LeadCard({ lead, onDragStart }: { lead: LeadWithMeta; onDragStart: () => void }) {
  const signatory = SIGNATORIES.find((s) => s.value === lead.campaigns?.assigned_signatory);
  const avgScore = lead.fit_score ?? null;

  return (
    <Card
      draggable
      onDragStart={onDragStart}
      className="cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-shadow"
    >
      <CardContent className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-1">
          <p className="font-medium text-sm leading-tight">{lead.brand_name}</p>
          {avgScore !== null && (
            <span className={`text-xs font-bold px-1.5 py-0.5 rounded shrink-0 ${avgScore >= 7 ? "bg-green-100 text-green-800" : avgScore >= 5 ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"}`}>
              {avgScore.toFixed(1)}
            </span>
          )}
        </div>

        {lead.founder_name && (
          <p className="text-xs text-muted-foreground">{lead.founder_name}{lead.founder_title ? `, ${lead.founder_title}` : ""}</p>
        )}

        <div className="flex items-center gap-2 flex-wrap">
          {lead.website && (
            <a href={`https://${lead.website}`} target="_blank" rel="noopener noreferrer" className="text-xs text-primary flex items-center gap-0.5 hover:underline">
              <Globe className="h-3 w-3" />{lead.website}
            </a>
          )}
          {lead.discovery_source === "web_search" && <Zap className="h-3 w-3 text-yellow-500" />}
        </div>

        <div className="flex gap-1 flex-wrap">
          {lead.campaigns?.name && (
            <Badge variant="secondary" className="text-xs">{lead.campaigns.name}</Badge>
          )}
        </div>

        <div className="flex justify-between items-center pt-1">
          <Link href={`/pipeline/${lead.id}`}>
            <Button variant="ghost" size="sm" className="h-6 text-xs px-2">
              View <ExternalLink className="h-3 w-3 ml-1" />
            </Button>
          </Link>
          {signatory && <span className="text-xs text-muted-foreground">{signatory.name.split(" ")[0]}</span>}
        </div>
      </CardContent>
    </Card>
  );
}
