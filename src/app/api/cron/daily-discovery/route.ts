import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { runPipeline } from "@/lib/agent/pipeline";

export const maxDuration = 300; // 5 min timeout for Vercel

export async function POST(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createServiceClient();

  // Get all active campaigns
  const { data: campaigns, error } = await supabase
    .from("campaigns")
    .select("id, name")
    .eq("status", "active");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!campaigns?.length) return NextResponse.json({ message: "No active campaigns" });

  const results = await Promise.allSettled(
    campaigns.map((c) => runPipeline(c.id))
  );

  const summary = results.map((r, i) => ({
    campaign: campaigns[i].name,
    result: r.status === "fulfilled" ? r.value : { error: String(r.reason) },
  }));

  return NextResponse.json({ ok: true, summary });
}

// Allow Vercel Cron to call via GET as well
export async function GET(request: Request) {
  return POST(request);
}
