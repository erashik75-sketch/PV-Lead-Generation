import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const campaign_id = searchParams.get("campaign_id");

  let query = supabase
    .from("lead_candidates")
    .select("*, campaigns(name)")
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);
  if (campaign_id) query = query.eq("campaign_id", campaign_id);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ candidates: data });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  // Support batch insert
  const items = Array.isArray(body) ? body : [body];
  const { data, error } = await supabase.from("lead_candidates").insert(items).select();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ candidates: data }, { status: 201 });
}
