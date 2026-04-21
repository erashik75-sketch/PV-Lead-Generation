import type { BlockerRule } from "@/types/domain";

export interface BlockerResult {
  blocked: boolean;
  outcome: "none" | "eliminated" | "warm_intro";
  rule_key: string | null;
  rule_label: string | null;
}

export function applyBlockerRules(
  brandData: {
    brand_description?: string | null;
    employee_count_estimate?: string | null;
    notes?: string | null;
    [key: string]: unknown;
  },
  enabledRules: BlockerRule[]
): BlockerResult {
  const textToCheck = [
    brandData.brand_description ?? "",
    brandData.employee_count_estimate ?? "",
    brandData.notes ?? "",
  ]
    .join(" ")
    .toLowerCase();

  for (const rule of enabledRules) {
    if (!rule.enabled) continue;

    const triggered = checkRule(rule.rule_key, textToCheck, brandData);
    if (triggered) {
      return {
        blocked: true,
        outcome: rule.outcome,
        rule_key: rule.rule_key,
        rule_label: rule.label,
      };
    }
  }

  return { blocked: false, outcome: "none", rule_key: null, rule_label: null };
}

function checkRule(ruleKey: string, text: string, data: Record<string, unknown>): boolean {
  switch (ruleKey) {
    case "made_in_identity":
      return /made in (usa|italy|france|germany|uk|england|japan|australia|canada)\b/i.test(text) &&
             /\b(identity|brand|heritage|story|about|pride|craftsmanship)\b/i.test(text);

    case "enterprise": {
      const empStr = String(data.employee_count_estimate ?? "");
      const match = empStr.match(/(\d+)/);
      if (match && parseInt(match[1]) >= 200) return true;
      return /\b(corporate|conglomerate|publicly traded|nyse|nasdaq|s&p 500)\b/i.test(text);
    }

    case "anti_outsourcing":
      return /\b(never outsource|anti.outsourc|always made (in|locally)|domestic.only|local.manufactur|will never.+manufactur)\b/i.test(text);

    default:
      return false;
  }
}
