import type { Niche, Product } from "@/types/domain";

export function buildDiscoveryQueriesPrompt(niches: Niche[], products: Product[]): string {
  const nicheList = niches.filter((n) => n.enabled).map((n) => `- ${n.name}: ${n.description ?? ""}`).join("\n");
  const productList = products.filter((p) => p.enabled).map((p) => `- ${p.name}`).join("\n");

  return `You are helping find DTC (direct-to-consumer) clothing brands that are a good fit for Plummy Venture, a Bangladesh RMG/textile factory.

## PV's Target Niches
${nicheList}

## PV's Products
${productList}

## Your Task
Generate 8 targeted Google search queries to find founder-led DTC brands in these niches that would benefit from a Bangladesh manufacturing partner. Focus on:
- Small-to-mid size brands (10-200 employees)
- Founder actively on LinkedIn or Instagram
- US, UK, or European market
- Price points that support factory margins ($50+ retail)

Generate diverse queries covering different niches and search angles. Use site: operators, specific keywords.

Respond in valid JSON ONLY:
{
  "queries": [
    "founder-led sustainable activewear brand USA direct to consumer 2023",
    "DTC yoga apparel brand linkedin founder CEO",
    "..."
  ]
}`;
}

export function buildClaudeSuggestionsPrompt(
  niches: Niche[],
  products: Product[],
  existingBrands: string[]
): string {
  const nicheList = niches.filter((n) => n.enabled).map((n) => n.name).join(", ");

  return `You are a market researcher for Plummy Venture, a Bangladesh RMG factory.

## Target Niches: ${nicheList}

## Brands Already Known (do NOT suggest these):
${existingBrands.slice(0, 50).join(", ")}

## Task
From your training knowledge, suggest 10-15 founder-led DTC clothing brands that:
1. Sell in these niches
2. Are small-to-mid size (not corporate)
3. Would benefit from a Bangladesh manufacturing partner
4. Are NOT on the already-known list above

Focus on real brands. Be diverse across niches.

Respond in valid JSON ONLY:
{
  "suggestions": [
    { "brand_name": "Vuori", "website": "vuori.com", "snippet": "DTC performance lifestyle brand from California" },
    ...
  ]
}`;
}
