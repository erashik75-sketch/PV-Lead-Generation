import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const stage = searchParams.get("stage");
  const campaign_id = searchParams.get("campaign_id");

  let query = supabase
    .from("leads")
    .select("*, score_dimensions(*), campaigns(name, assigned_signatory)")
    .order("created_at", { ascending: false });

  if (stage) query = query.eq("stage", stage);
  if (campaign_id) query = query.eq("campaign_id", campaign_id);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ leads: data });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { data, error } = await supabase.from("leads").insert(body).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ lead: data }, { status: 201 });
}
