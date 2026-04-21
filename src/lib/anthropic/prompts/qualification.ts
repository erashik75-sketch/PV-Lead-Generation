import type { BlockerRule, Niche, Product } from "@/types/domain";

export function buildQualificationPrompt(
  candidates: Array<{ brand_name: string; website: string | null; snippet: string | null }>,
  niches: Niche[],
  products: Product[],
  blockerRules: BlockerRule[],
  dailyTarget: number
): string {
  const nicheList = niches.filter((n) => n.enabled).map((n) => n.name).join(", ");
  const productList = products.filter((p) => p.enabled).map((p) => p.name).join(", ");
  const activeBlockers = blockerRules.filter((r) => r.enabled);

  return `You are a qualification agent for Plummy Venture, a Bangladesh RMG factory. Evaluate these brand candidates.

## PV's Target Niches: ${nicheList}

## PV's Products: ${productList}

## Hard Blocker Rules (these DISQUALIFY or reroute candidates):
${activeBlockers.map((r) => `- [${r.outcome.toUpperCase()}] ${r.label}: ${r.description}`).join("\n")}

## Candidates to Evaluate:
${candidates.map((c, i) => `${i + 1}. ${c.brand_name} | ${c.website ?? "no website"} | ${c.snippet ?? "no info"}`).join("\n")}

## Instructions
For each candidate, determine:
1. Does it match any PV niche or product category?
2. Does it trigger any blocker rule?
3. Give a fit_score (0-10) based on overall match

Then select the top ${dailyTarget} qualified candidates (those that pass blockers AND match niches/products).

Respond in valid JSON ONLY:
{
  "evaluations": [
    {
      "brand_name": "Brand A",
      "qualified": true,
      "disqualify_reason": null,
      "blocker_triggered": null,
      "fit_score": 7.5
    },
    {
      "brand_name": "Brand B",
      "qualified": false,
      "disqualify_reason": "No niche match — sells pet products",
      "blocker_triggered": null,
      "fit_score": 1.0
    },
    {
      "brand_name": "Brand C",
      "qualified": false,
      "disqualify_reason": "Triggered blocker: Made in USA brand identity",
      "blocker_triggered": "made_in_identity",
      "fit_score": 4.0
    }
  ],
  "selected_brands": ["Brand A", "Brand D"]
}`;
}
