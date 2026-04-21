import type { LeadCandidate, Niche, Product } from "@/types/domain";

export function buildEnrichmentPrompt(
  candidate: Pick<LeadCandidate, "brand_name" | "website" | "snippet">,
  niches: Niche[],
  products: Product[]
): string {
  const nicheList = niches.map((n) => `- ${n.name}`).join("\n");
  const productList = products.map((p) => `- ${p.name} (MOQ: ${p.moq ?? "500"} units)`).join("\n");

  return `You are a market research analyst for Plummy Venture, a Bangladesh RMG/textile factory. Your job is to deeply research a DTC brand and extract structured information.

## Brand to Research
Name: ${candidate.brand_name}
Website: ${candidate.website ?? "Unknown"}
Initial snippet: ${candidate.snippet ?? "None"}

## PV's Target Niches
${nicheList}

## PV's Products
${productList}

## Instructions
Research this brand thoroughly using your knowledge and any available information. Extract the following and respond in valid JSON ONLY (no markdown, no explanation):

{
  "brand_name": "Official brand name",
  "website": "Primary website URL",
  "brand_description": "2-3 sentence description of what they sell and who they are",
  "founder_name": "Full name of founder or co-founder",
  "founder_title": "Founder's title (e.g. Founder & CEO)",
  "founder_linkedin_id": "LinkedIn username from linkedin.com/in/[username] — extract just the username, or null",
  "founder_email": "Direct email if discoverable, or null",
  "founder_instagram_handle": "Instagram handle without @, or null",
  "founding_year": 2018,
  "employee_count_estimate": "e.g. '10-50', '50-200', or specific number",
  "revenue_estimate": "e.g. '$1M-$5M ARR' or null if unknown",
  "product_lines": "Comma-separated list of main product categories they sell",
  "price_point_usd": 85.00,
  "current_manufacturer_region": "Where they currently manufacture, or null",
  "instagram_followers": 45000,
  "press_mentions": "Notable press or awards, or null",
  "niche_match": "Which of PV's niches best describes this brand",
  "product_match": "Which PV product lines are most relevant",
  "enrichment_confidence": 0.85,
  "score_dimensions": {
    "product_fit": { "score": 8.5, "rationale": "Strong match for knitwear activewear" },
    "founder_accessibility": { "score": 7.0, "rationale": "Active on LinkedIn, responds publicly" },
    "brand_growth_signals": { "score": 8.0, "rationale": "Strong Instagram growth, press coverage" },
    "price_point_alignment": { "score": 9.0, "rationale": "$85 retail price supports factory margin" },
    "market_geography": { "score": 8.0, "rationale": "US-based, common Plummy target market" },
    "manufacturing_openness": { "score": 7.5, "rationale": "Currently uses generic Asian suppliers" },
    "communication_channels": { "score": 8.0, "rationale": "Active on LinkedIn and Instagram" },
    "brand_size_fit": { "score": 7.0, "rationale": "Small team, right size for new supplier" },
    "timing_readiness": { "score": 7.5, "rationale": "Growing rapidly, likely evaluating scaling" }
  }
}

Score each dimension from 0-10. enrichment_confidence is 0-1.
If information is unavailable, use null for that field.
Respond with JSON only.`;
}
