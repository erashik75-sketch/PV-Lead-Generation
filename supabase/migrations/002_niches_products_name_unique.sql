-- Idempotent seed support: ON CONFLICT requires a unique target
ALTER TABLE niches ADD CONSTRAINT niches_name_unique UNIQUE (name);
ALTER TABLE products ADD CONSTRAINT products_name_unique UNIQUE (name);
