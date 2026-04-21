-- ============================================================
-- PV Lead Generation — Initial Schema
-- ============================================================

-- Profiles (one per user, linked to auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT NOT NULL,
  title       TEXT NOT NULL DEFAULT '',
  linkedin_url TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Org-wide key/value settings
CREATE TABLE IF NOT EXISTS settings (
  key        TEXT PRIMARY KEY,
  value      JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Configurable blocker rules
CREATE TABLE IF NOT EXISTS blocker_rules (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_key    TEXT UNIQUE NOT NULL,
  label       TEXT NOT NULL,
  description TEXT,
  outcome     TEXT NOT NULL CHECK (outcome IN ('eliminated', 'warm_intro')),
  enabled     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Target market niches
CREATE TABLE IF NOT EXISTS niches (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT,
  enabled     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- PV product catalog
CREATE TABLE IF NOT EXISTS products (
  id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name     TEXT NOT NULL,
  category TEXT,
  moq      INTEGER,
  enabled  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Campaigns
CREATE TABLE IF NOT EXISTS campaigns (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                TEXT NOT NULL,
  product_category    TEXT NOT NULL,
  target_market       TEXT NOT NULL,
  min_price_point     NUMERIC(10,2),
  channels            TEXT[] NOT NULL DEFAULT '{}',
  status              TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','exhausted','completed')),
  assigned_signatory  TEXT NOT NULL DEFAULT 'erfanul' CHECK (assigned_signatory IN ('erfanul','ikramul')),
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Cron run log
CREATE TABLE IF NOT EXISTS cron_run_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id     UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  run_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status          TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running','completed','failed')),
  leads_found     INTEGER NOT NULL DEFAULT 0,
  leads_qualified INTEGER NOT NULL DEFAULT 0,
  leads_enriched  INTEGER NOT NULL DEFAULT 0,
  error_message   TEXT,
  search_queries  JSONB,
  cost_usd        NUMERIC(10,6) NOT NULL DEFAULT 0
);

-- Lead candidates (staging, populated by Agent 1)
CREATE TABLE IF NOT EXISTS lead_candidates (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id      UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  cron_run_id      UUID REFERENCES cron_run_log(id) ON DELETE SET NULL,
  brand_name       TEXT NOT NULL,
  website          TEXT,
  snippet          TEXT,
  source           TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('web_search','claude_suggestion','manual')),
  status           TEXT NOT NULL DEFAULT 'pending_qualification'
                   CHECK (status IN ('pending_qualification','qualified','disqualified','promoted')),
  disqualify_reason TEXT,
  fit_score        NUMERIC(4,2),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Core leads table
CREATE TABLE IF NOT EXISTS leads (
  id                         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id                UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  candidate_id               UUID REFERENCES lead_candidates(id) ON DELETE SET NULL,
  brand_name                 TEXT NOT NULL,
  website                    TEXT,
  stage                      TEXT NOT NULL DEFAULT 'discovered'
                             CHECK (stage IN ('discovered','enriched','outreach','warm_intro','converted','eliminated')),
  discovery_source           TEXT NOT NULL DEFAULT 'manual'
                             CHECK (discovery_source IN ('manual','web_search','claude_suggestion')),
  blocker_outcome            TEXT CHECK (blocker_outcome IN ('none','eliminated','warm_intro')),
  blocker_rule_key           TEXT,
  -- Founder contact details
  founder_name               TEXT,
  founder_title              TEXT,
  founder_linkedin_id        TEXT,
  founder_email              TEXT,
  founder_instagram_handle   TEXT,
  -- Brand details
  brand_description          TEXT,
  employee_count_estimate    TEXT,
  revenue_estimate           TEXT,
  founding_year              INTEGER,
  product_lines              TEXT,
  price_point_usd            NUMERIC(10,2),
  current_manufacturer_region TEXT,
  instagram_followers        INTEGER,
  press_mentions             TEXT,
  -- Scores
  fit_score                  NUMERIC(4,2),
  enrichment_confidence      NUMERIC(4,2),
  enriched_at                TIMESTAMPTZ,
  notes                      TEXT,
  created_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Score dimensions (9 per lead)
CREATE TABLE IF NOT EXISTS score_dimensions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id    UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  dimension  TEXT NOT NULL,
  score      NUMERIC(4,2) NOT NULL CHECK (score BETWEEN 0 AND 10),
  rationale  TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Outreach sequences
CREATE TABLE IF NOT EXISTS outreach_sequences (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id    UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  version    INTEGER NOT NULL DEFAULT 1,
  signatory  TEXT NOT NULL CHECK (signatory IN ('erfanul','ikramul')),
  channel    TEXT NOT NULL CHECK (channel IN ('linkedin','email','instagram')),
  status     TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Individual touch messages
CREATE TABLE IF NOT EXISTS outreach_touches (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id     UUID NOT NULL REFERENCES outreach_sequences(id) ON DELETE CASCADE,
  touch_number    INTEGER NOT NULL,
  subject         TEXT,
  body            TEXT NOT NULL,
  send_after_days INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Lead events / audit trail
CREATE TABLE IF NOT EXISTS lead_events (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id      UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  event_type   TEXT NOT NULL,
  event_data   JSONB,
  created_by   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- API usage log
CREATE TABLE IF NOT EXISTS api_usage_log (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operation     TEXT NOT NULL,
  lead_id       UUID REFERENCES leads(id) ON DELETE SET NULL,
  input_tokens  INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  cost_usd      NUMERIC(10,6) NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_leads_stage ON leads(stage);
CREATE INDEX IF NOT EXISTS idx_leads_campaign ON leads(campaign_id);
CREATE INDEX IF NOT EXISTS idx_lead_candidates_status ON lead_candidates(status);
CREATE INDEX IF NOT EXISTS idx_lead_candidates_campaign ON lead_candidates(campaign_id);
CREATE INDEX IF NOT EXISTS idx_score_dimensions_lead ON score_dimensions(lead_id);
CREATE INDEX IF NOT EXISTS idx_outreach_sequences_lead ON outreach_sequences(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_events_lead ON lead_events(lead_id);

-- ============================================================
-- Row Level Security
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocker_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE niches ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE score_dimensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_touches ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE cron_run_log ENABLE ROW LEVEL SECURITY;

-- Profiles: each user sees only their own
CREATE POLICY "profiles_own" ON profiles FOR ALL USING (auth.uid() = id);

-- All business tables: any authenticated user can read/write (shared team)
CREATE POLICY "settings_auth" ON settings FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "blocker_rules_auth" ON blocker_rules FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "niches_auth" ON niches FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "products_auth" ON products FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "campaigns_auth" ON campaigns FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "lead_candidates_auth" ON lead_candidates FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "leads_auth" ON leads FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "score_dimensions_auth" ON score_dimensions FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "outreach_sequences_auth" ON outreach_sequences FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "outreach_touches_auth" ON outreach_touches FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "lead_events_auth" ON lead_events FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "api_usage_log_auth" ON api_usage_log FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "cron_run_log_auth" ON cron_run_log FOR ALL USING (auth.role() = 'authenticated');

-- Service role can access everything (for cron jobs)
CREATE POLICY "settings_service" ON settings FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "blocker_rules_service" ON blocker_rules FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "niches_service" ON niches FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "products_service" ON products FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "campaigns_service" ON campaigns FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "lead_candidates_service" ON lead_candidates FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "leads_service" ON leads FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "score_dimensions_service" ON score_dimensions FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "outreach_sequences_service" ON outreach_sequences FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "outreach_touches_service" ON outreach_touches FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "lead_events_service" ON lead_events FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "api_usage_log_service" ON api_usage_log FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "cron_run_log_service" ON cron_run_log FOR ALL USING (auth.role() = 'service_role');

-- ============================================================
-- Updated_at trigger function
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER campaigns_updated_at BEFORE UPDATE ON campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER leads_updated_at BEFORE UPDATE ON leads FOR EACH ROW EXECUTE FUNCTION update_updated_at();
