import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAnthropicClient, MODEL, estimateCost } from "@/lib/anthropic/client";
import { buildOutreachPrompt } from "@/lib/anthropic/prompts/outreach";
import type { Lead, Campaign } from "@/types/domain";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const { channel, signatory } = body as { channel: "linkedin" | "email" | "instagram"; signatory: "erfanul" | "ikramul" };

  if (!channel || !signatory) {
    return NextResponse.json({ error: "channel and signatory required" }, { status: 400 });
  }

  const { data: lead } = await supabase.from("leads").select("*, campaigns(*)").eq("id", id).single();
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  const { data: toneData } = await supabase.from("settings").select("value").eq("key", "outreach_tone").single();
  const toneRule = String(toneData?.value ?? "professional_warm");

  const campaign = lead.campaigns as Campaign | null;
  if (!campaign) return NextResponse.json({ error: "Lead has no campaign" }, { status: 400 });

  const anthropic = await getAnthropicClient();
  const prompt = buildOutreachPrompt(lead as Lead, campaign, channel, signatory, toneRule);

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "{}";
  const cost = estimateCost(response.usage.input_tokens, response.usage.output_tokens);

  let touches: Array<{ touch_number: number; subject: string | null; body: string; send_after_days: number }> = [];
  try {
    touches = JSON.parse(text).touches ?? [];
  } catch {
    return NextResponse.json({ error: "Failed to parse outreach response" }, { status: 500 });
  }

  // Get next version number
  const { data: existingSeqs } = await supabase
    .from("outreach_sequences")
    .select("version")
    .eq("lead_id", id)
    .eq("channel", channel)
    .order("version", { ascending: false })
    .limit(1);

  const nextVersion = (existingSeqs?.[0]?.version ?? 0) + 1;

  const { data: sequence } = await supabase.from("outreach_sequences").insert({
    lead_id: id,
    version: nextVersion,
    signatory,
    channel,
    status: "draft",
  }).select().single();

  if (!sequence) return NextResponse.json({ error: "Failed to create sequence" }, { status: 500 });

  await supabase.from("outreach_touches").insert(
    touches.map((t) => ({ ...t, sequence_id: sequence.id }))
  );

  // Log API usage
  await supabase.from("api_usage_log").insert({
    operation: "outreach",
    lead_id: id,
    input_tokens: response.usage.input_tokens,
    output_tokens: response.usage.output_tokens,
    cost_usd: cost,
  });

  // Update lead stage to outreach if still enriched
  if (lead.stage === "enriched") {
    await supabase.from("leads").update({ stage: "outreach", updated_at: new Date().toISOString() }).eq("id", id);
  }

  const { data: fullSequence } = await supabase
    .from("outreach_sequences")
    .select("*, outreach_touches(*)")
    .eq("id", sequence.id)
    .single();

  return NextResponse.json({ sequence: fullSequence, cost });
}
