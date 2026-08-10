CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE IF NOT EXISTS category (
  id bigserial PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  name text NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS city (
  id bigserial PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  name text NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS company (
  id bigserial PRIMARY KEY,
  source_id text,
  name text NOT NULL,
  name_norm text NOT NULL,
  category_id bigint REFERENCES category(id),
  city_id bigint REFERENCES city(id),
  address text,
  rating numeric(3, 1) CHECK (rating IS NULL OR (rating >= 0 AND rating <= 5)),
  reviews_count integer CHECK (reviews_count IS NULL OR reviews_count >= 0),
  website text,
  website_host text,
  phone_e164 text,
  phone_raw text,
  dedup_key text NOT NULL UNIQUE,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  source_file text,
  source_index integer,
  raw jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS ix_company_city_id ON company(city_id);
CREATE INDEX IF NOT EXISTS ix_company_category_id ON company(category_id);
CREATE INDEX IF NOT EXISTS ix_company_name_norm_trgm ON company USING gin (name_norm gin_trgm_ops);
CREATE INDEX IF NOT EXISTS ix_company_city_rating ON company(city_id, rating DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS ix_company_reviews_10 ON company(reviews_count) WHERE reviews_count >= 10;

CREATE TABLE IF NOT EXISTS ingest_run (
  id bigserial PRIMARY KEY,
  source text NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  status text NOT NULL CHECK (status IN ('running', 'success', 'failed')),
  rows_read integer NOT NULL DEFAULT 0,
  rows_inserted integer NOT NULL DEFAULT 0,
  rows_updated integer NOT NULL DEFAULT 0,
  rows_rejected integer NOT NULL DEFAULT 0,
  git_sha text
);

CREATE TABLE IF NOT EXISTS rejected_row (
  id bigserial PRIMARY KEY,
  run_id bigint REFERENCES ingest_run(id),
  source_file text NOT NULL,
  source_index integer NOT NULL,
  payload jsonb NOT NULL,
  code text NOT NULL,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS review (
  id bigserial PRIMARY KEY,
  external_id text UNIQUE,
  company_id bigint NOT NULL REFERENCES company(id),
  author text,
  email text,
  email_status text,
  rating numeric(3, 1) CHECK (rating IS NULL OR (rating >= 0 AND rating <= 5)),
  body text,
  review_date timestamptz,
  raw jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS review_quarantine (
  id bigserial PRIMARY KEY,
  run_id bigint REFERENCES ingest_run(id),
  payload jsonb NOT NULL,
  code text NOT NULL,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
