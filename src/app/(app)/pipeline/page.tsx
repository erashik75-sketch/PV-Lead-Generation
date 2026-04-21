import { createClient } from "@/lib/supabase/server";
import { PipelineBoard } from "@/components/pipeline/PipelineBoard";
import { KanbanSquare } from "lucide-react";

export default async function PipelinePage() {
  const supabase = await createClient();

  const { data: leads } = await supabase
    .from("leads")
    .select("*, score_dimensions(*), campaigns(name, assigned_signatory)")
    .not("stage", "in", '("eliminated")')
    .order("fit_score", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <KanbanSquare className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Pipeline</h1>
          <p className="text-sm text-muted-foreground">Drag leads between stages to track progress</p>
        </div>
      </div>

      <PipelineBoard initialLeads={leads ?? []} />
    </div>
  );
}
