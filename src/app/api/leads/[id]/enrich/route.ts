import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { enrichLead } from "@/lib/agent/enrichment-agent";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const result = await enrichLead(id);

  if (!result.success) {
    return NextResponse.json({ error: "Enrichment failed" }, { status: 500 });
  }

  const { data: lead } = await supabase
    .from("leads")
    .select("*, score_dimensions(*)")
    .eq("id", id)
    .single();

  return NextResponse.json({ lead, cost: result.cost });
}
