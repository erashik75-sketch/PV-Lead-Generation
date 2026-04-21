import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (error && error.code !== "PGRST116") return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ profile: data ?? null, email: user.email });
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { full_name, title, linkedin_url } = body;

  const { data, error } = await supabase
    .from("profiles")
    .upsert({ id: user.id, full_name, title: title ?? "", linkedin_url: linkedin_url ?? null }, { onConflict: "id" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ profile: data });
}
