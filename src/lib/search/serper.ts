import { createServiceClient } from "@/lib/supabase/server";

interface SerperResult {
  title: string;
  link: string;
  snippet: string;
}

interface SerperResponse {
  organic?: SerperResult[];
}

async function getSerperKey(): Promise<string> {
  const supabase = await createServiceClient();
  const { data } = await supabase.from("settings").select("value").eq("key", "serper_api_key").single();
  const key = data?.value as string | null;
  if (!key || key === "null") throw new Error("Serper API key not configured. Go to Settings to add it.");
  return key;
}

export async function searchWeb(query: string, num = 10): Promise<SerperResult[]> {
  const apiKey = await getSerperKey();

  const response = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: { "X-API-KEY": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({ q: query, num }),
  });

  if (!response.ok) {
    throw new Error(`Serper search failed: ${response.statusText}`);
  }

  const data: SerperResponse = await response.json();
  return data.organic ?? [];
}

export type { SerperResult };
