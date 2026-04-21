import type { Database } from "./database";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Setting = Database["public"]["Tables"]["settings"]["Row"];
export type BlockerRule = Database["public"]["Tables"]["blocker_rules"]["Row"];
export type Niche = Database["public"]["Tables"]["niches"]["Row"];
export type Product = Database["public"]["Tables"]["products"]["Row"];
export type Campaign = Database["public"]["Tables"]["campaigns"]["Row"];
export type LeadCandidate = Database["public"]["Tables"]["lead_candidates"]["Row"];
export type Lead = Database["public"]["Tables"]["leads"]["Row"];
export type ScoreDimension = Database["public"]["Tables"]["score_dimensions"]["Row"];
export type OutreachSequence = Database["public"]["Tables"]["outreach_sequences"]["Row"];
export type OutreachTouch = Database["public"]["Tables"]["outreach_touches"]["Row"];
export type LeadEvent = Database["public"]["Tables"]["lead_events"]["Row"];
export type CronRunLog = Database["public"]["Tables"]["cron_run_log"]["Row"];

export type LeadStage = Lead["stage"];
export type CampaignStatus = Campaign["status"];
export type Signatory = Campaign["assigned_signatory"];
export type BlockerOutcome = NonNullable<Lead["blocker_outcome"]>;

export const SIGNATORIES = [
  { value: "erfanul" as const, name: "Erfanul Hoque", title: "Partner, Plummy Venture" },
  { value: "ikramul" as const, name: "Ikramul Hoque Rayan", title: "Managing Partner, Plummy Venture" },
];

export const SCORE_DIMENSIONS = [
  "product_fit",
  "founder_accessibility",
  "brand_growth_signals",
  "price_point_alignment",
  "market_geography",
  "manufacturing_openness",
  "communication_channels",
  "brand_size_fit",
  "timing_readiness",
] as const;

export type ScoreDimensionKey = (typeof SCORE_DIMENSIONS)[number];

export const LEAD_STAGES: { value: LeadStage; label: string }[] = [
  { value: "discovered", label: "Discovered" },
  { value: "enriched", label: "Enriched" },
  { value: "outreach", label: "In Outreach" },
  { value: "warm_intro", label: "Warm Intro" },
  { value: "converted", label: "Converted" },
  { value: "eliminated", label: "Eliminated" },
];
