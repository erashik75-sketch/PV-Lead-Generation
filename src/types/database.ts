export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          title: string;
          linkedin_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["profiles"]["Row"], "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      settings: {
        Row: { key: string; value: Json; updated_at: string };
        Insert: Omit<Database["public"]["Tables"]["settings"]["Row"], "updated_at">;
        Update: Partial<Database["public"]["Tables"]["settings"]["Insert"]>;
      };
      blocker_rules: {
        Row: {
          id: string;
          rule_key: string;
          label: string;
          description: string | null;
          outcome: "eliminated" | "warm_intro";
          enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["blocker_rules"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["blocker_rules"]["Insert"]>;
      };
      niches: {
        Row: { id: string; name: string; description: string | null; enabled: boolean; created_at: string };
        Insert: Omit<Database["public"]["Tables"]["niches"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["niches"]["Insert"]>;
      };
      products: {
        Row: { id: string; name: string; category: string | null; moq: number | null; enabled: boolean; created_at: string };
        Insert: Omit<Database["public"]["Tables"]["products"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["products"]["Insert"]>;
      };
      campaigns: {
        Row: {
          id: string;
          name: string;
          product_category: string;
          target_market: string;
          min_price_point: number | null;
          channels: string[];
          status: "active" | "paused" | "exhausted" | "completed";
          assigned_signatory: "erfanul" | "ikramul";
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["campaigns"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["campaigns"]["Insert"]>;
      };
      lead_candidates: {
        Row: {
          id: string;
          campaign_id: string | null;
          cron_run_id: string | null;
          brand_name: string;
          website: string | null;
          snippet: string | null;
          source: "web_search" | "claude_suggestion" | "manual";
          status: "pending_qualification" | "qualified" | "disqualified" | "promoted";
          disqualify_reason: string | null;
          fit_score: number | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["lead_candidates"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["lead_candidates"]["Insert"]>;
      };
      leads: {
        Row: {
          id: string;
          campaign_id: string | null;
          candidate_id: string | null;
          brand_name: string;
          website: string | null;
          stage: "discovered" | "enriched" | "outreach" | "warm_intro" | "converted" | "eliminated";
          discovery_source: "manual" | "web_search" | "claude_suggestion";
          blocker_outcome: "none" | "eliminated" | "warm_intro" | null;
          blocker_rule_key: string | null;
          founder_name: string | null;
          founder_title: string | null;
          founder_linkedin_id: string | null;
          founder_email: string | null;
          founder_instagram_handle: string | null;
          brand_description: string | null;
          employee_count_estimate: string | null;
          revenue_estimate: string | null;
          founding_year: number | null;
          product_lines: string | null;
          price_point_usd: number | null;
          current_manufacturer_region: string | null;
          instagram_followers: number | null;
          press_mentions: string | null;
          fit_score: number | null;
          enrichment_confidence: number | null;
          enriched_at: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["leads"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["leads"]["Insert"]>;
      };
      score_dimensions: {
        Row: {
          id: string;
          lead_id: string;
          dimension: string;
          score: number;
          rationale: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["score_dimensions"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["score_dimensions"]["Insert"]>;
      };
      outreach_sequences: {
        Row: {
          id: string;
          lead_id: string;
          version: number;
          signatory: "erfanul" | "ikramul";
          channel: "linkedin" | "email" | "instagram";
          status: "draft" | "active" | "completed";
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["outreach_sequences"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["outreach_sequences"]["Insert"]>;
      };
      outreach_touches: {
        Row: {
          id: string;
          sequence_id: string;
          touch_number: number;
          subject: string | null;
          body: string;
          send_after_days: number;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["outreach_touches"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["outreach_touches"]["Insert"]>;
      };
      lead_events: {
        Row: {
          id: string;
          lead_id: string;
          event_type: string;
          event_data: Json | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["lead_events"]["Row"], "id" | "created_at">;
        Update: never;
      };
      api_usage_log: {
        Row: {
          id: string;
          operation: string;
          lead_id: string | null;
          input_tokens: number;
          output_tokens: number;
          cost_usd: number;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["api_usage_log"]["Row"], "id" | "created_at">;
        Update: never;
      };
      cron_run_log: {
        Row: {
          id: string;
          campaign_id: string | null;
          run_at: string;
          status: "running" | "completed" | "failed";
          leads_found: number;
          leads_qualified: number;
          leads_enriched: number;
          error_message: string | null;
          search_queries: Json | null;
          cost_usd: number;
        };
        Insert: Omit<Database["public"]["Tables"]["cron_run_log"]["Row"], "id" | "run_at">;
        Update: Partial<Database["public"]["Tables"]["cron_run_log"]["Insert"]>;
      };
    };
  };
}
