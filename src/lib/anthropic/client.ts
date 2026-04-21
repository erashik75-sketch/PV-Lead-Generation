import Anthropic from "@anthropic-ai/sdk";
import { createServiceClient } from "@/lib/supabase/server";

let cachedClient: Anthropic | null = null;
let cachedKey: string | null = null;

export async function getAnthropicClient(): Promise<Anthropic> {
  const supabase = await createServiceClient();
  const { data } = await supabase.from("settings").select("value").eq("key", "anthropic_api_key").single();
  const apiKey = data?.value as string | null;

  if (!apiKey || apiKey === "null") {
    throw new Error("Anthropic API key not configured. Go to Settings to add it.");
  }

  if (apiKey !== cachedKey) {
    cachedClient = new Anthropic({ apiKey });
    cachedKey = apiKey;
  }

  return cachedClient!;
}

export const MODEL = "claude-sonnet-4-6";

export function estimateCost(inputTokens: number, outputTokens: number): number {
  // claude-sonnet-4-6 pricing: $3/M input, $15/M output
  return (inputTokens / 1_000_000) * 3 + (outputTokens / 1_000_000) * 15;
}
