import type { ScoreDimension } from "@/types/domain";
import type { Json } from "@/types/database";

export interface ScoringWeights {
  product_fit: number;
  founder_accessibility: number;
  brand_growth_signals: number;
  price_point_alignment: number;
  market_geography: number;
  manufacturing_openness: number;
  communication_channels: number;
  brand_size_fit: number;
  timing_readiness: number;
}

const DEFAULT_WEIGHTS: ScoringWeights = {
  product_fit: 20,
  founder_accessibility: 15,
  brand_growth_signals: 15,
  price_point_alignment: 12,
  market_geography: 10,
  manufacturing_openness: 10,
  communication_channels: 8,
  brand_size_fit: 5,
  timing_readiness: 5,
};

export function computeWeightedScore(
  dimensions: ScoreDimension[],
  weights: Partial<ScoringWeights> = {}
): number {
  const w = { ...DEFAULT_WEIGHTS, ...weights };
  const totalWeight = Object.values(w).reduce((a, b) => a + b, 0);

  let weightedSum = 0;
  for (const dim of dimensions) {
    const weight = w[dim.dimension as keyof ScoringWeights] ?? 0;
    weightedSum += (dim.score / 10) * weight;
  }

  return Math.round((weightedSum / totalWeight) * 100) / 10;
}

export function weightsFromSettings(value: Json): Partial<ScoringWeights> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Partial<ScoringWeights>;
}
