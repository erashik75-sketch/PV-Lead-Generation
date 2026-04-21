-- ============================================================
-- PV Lead Generation — Seed Data
-- ============================================================

-- Org Settings (defaults)
INSERT INTO settings (key, value) VALUES
  ('anthropic_api_key',   'null'::jsonb),
  ('serper_api_key',      'null'::jsonb),
  ('daily_leads_target',  '5'::jsonb),
  ('moq_units',           '500'::jsonb),
  ('advance_pct',         '30'::jsonb),
  ('outreach_tone',       '"professional_warm"'::jsonb),
  ('scoring_weights', '{
    "product_fit": 20,
    "founder_accessibility": 15,
    "brand_growth_signals": 15,
    "price_point_alignment": 12,
    "market_geography": 10,
    "manufacturing_openness": 10,
    "communication_channels": 8,
    "brand_size_fit": 5,
    "timing_readiness": 5
  }'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Blocker Rules (3 defaults matching original spec)
INSERT INTO blocker_rules (rule_key, label, description, outcome, enabled) VALUES
  (
    'made_in_identity',
    '"Made in [Country]" Brand Identity',
    'Brand explicitly markets manufacturing origin as a core identity (e.g. "Made in USA", "Made in Italy"). Moving manufacturing would undermine their brand promise.',
    'eliminated',
    TRUE
  ),
  (
    'enterprise',
    'Enterprise / Corporate Group',
    'Company has 200+ employees or is owned by a corporate group. Procurement decisions go through procurement committees, not founders. Route to warm intro track instead.',
    'warm_intro',
    TRUE
  ),
  (
    'anti_outsourcing',
    'Explicit Anti-Outsourcing Policy',
    'Brand has publicly stated they will never outsource manufacturing, or has anti-outsourcing as a core brand value.',
    'eliminated',
    TRUE
  )
ON CONFLICT (rule_key) DO NOTHING;

-- Niches (PV target market niches)
INSERT INTO niches (name, description, enabled) VALUES
  ('DTC Sustainable Activewear', 'Direct-to-consumer brands selling eco-conscious workout/athleisure apparel, typically priced $60-$200 per item', TRUE),
  ('DTC Premium Basics', 'Minimalist, high-quality everyday clothing brands. Founder-led with loyal communities', TRUE),
  ('DTC Outdoor & Adventure Apparel', 'Outdoor lifestyle brands selling technical but stylish outdoor gear', TRUE),
  ('DTC Womenswear', 'Independent womenswear brands targeting millennial/Gen-Z women, direct-to-consumer', TRUE),
  ('DTC Menswear', 'Independent menswear brands, founder-led, DTC-first', TRUE),
  ('DTC Streetwear', 'Limited-drop streetwear and urban fashion brands, strong social media presence', TRUE),
  ('DTC Yoga & Wellness Apparel', 'Yoga, pilates, and wellness-focused apparel brands', TRUE),
  ('DTC Kids & Family Apparel', 'Premium children and family clothing brands, DTC model', TRUE),
  ('DTC Swimwear & Resort', 'Swimwear and resort wear brands with year-round DTC model', TRUE),
  ('DTC Workwear & Smart Casual', 'Modern workwear brands bridging professional and casual styles', TRUE)
ON CONFLICT DO NOTHING;

-- Products (PV product catalog)
INSERT INTO products (name, category, moq, enabled) VALUES
  ('Knitwear — T-Shirts & Polos',         'Knitwear',       500,  TRUE),
  ('Knitwear — Sweatshirts & Hoodies',     'Knitwear',       300,  TRUE),
  ('Knitwear — Sweaters & Cardigans',      'Knitwear',       300,  TRUE),
  ('Knitwear — Activewear Tops',           'Knitwear',       500,  TRUE),
  ('Knitwear — Leggings & Yoga Pants',     'Knitwear',       500,  TRUE),
  ('Knitwear — Sports Bras',              'Knitwear',       500,  TRUE),
  ('Woven — Shirts & Blouses',            'Woven',          500,  TRUE),
  ('Woven — Pants & Trousers',            'Woven',          300,  TRUE),
  ('Woven — Jackets & Outerwear',         'Woven',          300,  TRUE),
  ('Woven — Shorts',                      'Woven',          500,  TRUE),
  ('Woven — Dresses & Skirts',            'Woven',          300,  TRUE),
  ('Cut & Sew — Activewear Sets',         'Cut & Sew',      500,  TRUE),
  ('Cut & Sew — Athleisure Coordinates',  'Cut & Sew',      300,  TRUE),
  ('Cut & Sew — Kids Apparel',            'Cut & Sew',      500,  TRUE),
  ('Swimwear & Beachwear',                'Swimwear',       500,  TRUE)
ON CONFLICT DO NOTHING;
