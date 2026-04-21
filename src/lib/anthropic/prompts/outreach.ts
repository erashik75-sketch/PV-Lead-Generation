import type { Lead, Campaign } from "@/types/domain";
import { SIGNATORIES } from "@/types/domain";

export function buildOutreachPrompt(
  lead: Lead,
  campaign: Campaign,
  channel: "linkedin" | "email" | "instagram",
  signatoryKey: "erfanul" | "ikramul",
  toneRule: string
): string {
  const signatory = SIGNATORIES.find((s) => s.value === signatoryKey)!;
  const contactInfo = getContactField(lead, channel);

  return `You are writing outreach messages on behalf of ${signatory.name}, ${signatory.title}.

## Brand Being Targeted
- Brand: ${lead.brand_name}
- Founder: ${lead.founder_name ?? "the founder"}
- Product lines: ${lead.product_lines ?? "clothing"}
- Price point: $${lead.price_point_usd ?? "unknown"} retail
- Current manufacturer: ${lead.current_manufacturer_region ?? "unknown"}
- Brand description: ${lead.brand_description ?? ""}
${contactInfo ? `- Contact channel: ${channel} (${contactInfo})` : ""}

## Campaign Context
- PV's focus: ${campaign.product_category}
- Target market: ${campaign.target_market}

## Tone: ${toneRule}

## Rules (STRICTLY FOLLOW)
1. NEVER mention price, MOQ, advance percentage, or Bangladesh in the first message
2. First message is relationship-building — show genuine interest in the brand
3. Reference something specific about their product or brand story
4. Keep Touch 1 under 150 words
5. Touches 2-3 can be warmer and more direct about manufacturing capabilities
6. Touch 3 can mention Bangladesh and quality capabilities
7. Each touch has a clear, soft call to action
8. DO NOT use generic phrases like "I came across your brand" without specifics

## Task
Write a 3-touch outreach sequence for ${channel}:
- Touch 1: Send now (day 0) — pure relationship/interest
- Touch 2: Follow-up (day 5) — add value, hint at capability
- Touch 3: Final (day 10) — light pitch with Bangladesh quality mention

Sign each message as:
${signatory.name}
${signatory.title}

Respond in valid JSON ONLY:
{
  "touches": [
    {
      "touch_number": 1,
      "subject": "Re: ${lead.brand_name} — [subject if email, null if LinkedIn/Instagram]",
      "body": "Full message body",
      "send_after_days": 0
    },
    {
      "touch_number": 2,
      "subject": null,
      "body": "...",
      "send_after_days": 5
    },
    {
      "touch_number": 3,
      "subject": null,
      "body": "...",
      "send_after_days": 10
    }
  ]
}`;
}

function getContactField(lead: Lead, channel: "linkedin" | "email" | "instagram"): string | null {
  if (channel === "linkedin") return lead.founder_linkedin_id ?? null;
  if (channel === "email") return lead.founder_email ?? null;
  if (channel === "instagram") return lead.founder_instagram_handle ?? null;
  return null;
}
