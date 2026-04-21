import type { SerperResult } from "./serper";

export interface BrandCandidate {
  brand_name: string;
  website: string | null;
  snippet: string;
  source: "web_search" | "claude_suggestion";
}

export function extractBrandsFromResults(results: SerperResult[]): BrandCandidate[] {
  return results
    .filter((r) => r.link && !isSkippedDomain(r.link))
    .map((r) => ({
      brand_name: extractBrandName(r.title, r.link),
      website: extractRootDomain(r.link),
      snippet: r.snippet ?? "",
      source: "web_search" as const,
    }));
}

function isSkippedDomain(url: string): boolean {
  const skipDomains = ["amazon.", "etsy.", "ebay.", "walmart.", "target.", "linkedin.", "instagram.", "facebook.", "twitter.", "youtube.", "pinterest.", "wikipedia.", "reddit.", "yelp.", "tripadvisor.", "glassdoor.", "indeed."];
  return skipDomains.some((d) => url.includes(d));
}

function extractBrandName(title: string, url: string): string {
  // Remove common suffixes like " | Shop Online", " - Official Store", etc.
  const cleaned = title
    .replace(/\s*[-|–—]\s*.+$/, "")
    .replace(/\s*(Official\s+)?Store\s*$/i, "")
    .replace(/\s*Online\s*$/i, "")
    .trim();

  if (cleaned.length > 2 && cleaned.length < 60) return cleaned;

  // Fall back to domain name
  try {
    const domain = new URL(url).hostname.replace("www.", "");
    return domain.split(".")[0].replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  } catch {
    return title.slice(0, 50);
  }
}

function extractRootDomain(url: string): string | null {
  try {
    const u = new URL(url);
    return u.hostname.startsWith("www.") ? u.hostname.slice(4) : u.hostname;
  } catch {
    return null;
  }
}
