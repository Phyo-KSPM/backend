-- 001_init_schema.sql
-- CEIR ER diagram schema

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS schema_migrations (
  id SERIAL PRIMARY KEY,
  filename TEXT NOT NULL UNIQUE,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$ BEGIN
  CREATE TYPE device_platform AS ENUM ('android', 'ios');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE registration_status AS ENUM ('registered', 'partial', 'not_registered');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE pmc_status AS ENUM ('correct', 'incorrect');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE tax_payment_status AS ENUM ('paid', 'unpaid', 'pending');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE blocking_status AS ENUM ('allowed', 'blocked');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE payment_method AS ENUM ('mpu', 'kbzpay', 'wavepay');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('pending', 'success', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE payment_batch_status AS ENUM ('draft', 'ready', 'payment_pending', 'paid', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE tax_application_status AS ENUM ('draft', 'calculated', 'paid', 'expired');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE device_claim_status AS ENUM ('submitted', 'under_review', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE claim_doc_type AS ENUM ('device_photo');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE activity_type AS ENUM ('tax_paid', 'imei_checked', 'device_claimed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS nrc_regions (
  id BIGSERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS nrc_townships (
  id BIGSERIAL PRIMARY KEY,
  region_id BIGINT NOT NULL REFERENCES nrc_regions(id),
  code TEXT NOT NULL,
  name_en TEXT NOT NULL,
  name_mm TEXT NOT NULL,
  UNIQUE (region_id, code)
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  agent_id TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  phone TEXT,
  full_name TEXT NOT NULL,
  nrc_no TEXT,
  address TEXT,
  township_id BIGINT REFERENCES nrc_townships(id),
  business_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_device_bindings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  device_fingerprint TEXT NOT NULL UNIQUE,
  device_name TEXT,
  platform device_platform NOT NULL DEFAULT 'android',
  app_version TEXT,
  bound_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS devices (
  id BIGSERIAL PRIMARY KEY,
  imei1 TEXT NOT NULL UNIQUE,
  imei2 TEXT UNIQUE,
  brand TEXT,
  product_name TEXT,
  model_name TEXT,
  serial_number TEXT,
  manufacturer TEXT,
  operating_system TEXT,
  device_type TEXT,
  allocation_date DATE,
  registration_status registration_status NOT NULL DEFAULT 'not_registered',
  pmc_status pmc_status NOT NULL DEFAULT 'incorrect',
  tax_payment_status tax_payment_status NOT NULL DEFAULT 'unpaid',
  blocking_status blocking_status NOT NULL DEFAULT 'allowed'
);

CREATE TABLE IF NOT EXISTS imei_check_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  imei1 TEXT NOT NULL,
  imei2 TEXT,
  result_registration_status registration_status,
  result_blocking_status blocking_status,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tax_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  status tax_application_status NOT NULL DEFAULT 'draft',
  total_tax INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS tax_application_items (
  id BIGSERIAL PRIMARY KEY,
  tax_application_id UUID NOT NULL REFERENCES tax_applications(id) ON DELETE CASCADE,
  device_id BIGINT NOT NULL REFERENCES devices(id),
  custom_value INTEGER NOT NULL DEFAULT 0,
  customs_duty INTEGER NOT NULL DEFAULT 0,
  commercial_tax INTEGER NOT NULL DEFAULT 0,
  redemption_fine INTEGER NOT NULL DEFAULT 0,
  total_tax INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS payment_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES users(id),
  tax_application_id UUID REFERENCES tax_applications(id),
  status payment_batch_status NOT NULL DEFAULT 'draft',
  retry_count INTEGER NOT NULL DEFAULT 0,
  last_payment_error TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payment_batch_items (
  id BIGSERIAL PRIMARY KEY,
  batch_id UUID NOT NULL REFERENCES payment_batches(id) ON DELETE CASCADE,
  device_id BIGINT NOT NULL REFERENCES devices(id),
  imei1 TEXT NOT NULL,
  imei2 TEXT,
  brand TEXT,
  model_name TEXT,
  tax_amount INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS payments (
  id BIGSERIAL PRIMARY KEY,
  payment_id TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES users(id),
  device_id BIGINT REFERENCES devices(id),
  batch_id UUID REFERENCES payment_batches(id),
  tax_application_id UUID REFERENCES tax_applications(id),
  payer_name TEXT,
  payer_phone TEXT,
  payment_method payment_method NOT NULL,
  gateway_ref TEXT,
  total_amount INTEGER NOT NULL,
  payment_status payment_status NOT NULL DEFAULT 'pending',
  paid_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS device_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES users(id),
  claimant_full_name TEXT NOT NULL,
  claimant_nrc_number TEXT NOT NULL,
  claimant_phone TEXT NOT NULL,
  address TEXT,
  township_id BIGINT REFERENCES nrc_townships(id),
  device_id BIGINT REFERENCES devices(id),
  imei1 TEXT NOT NULL,
  imei2 TEXT,
  brand TEXT,
  model_name TEXT,
  status device_claim_status NOT NULL DEFAULT 'submitted',
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS claim_documents (
  id BIGSERIAL PRIMARY KEY,
  claim_id UUID NOT NULL REFERENCES device_claims(id) ON DELETE CASCADE,
  doc_type claim_doc_type NOT NULL,
  file_url TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS activities (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type activity_type NOT NULL,
  detail TEXT NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_devices_imei1 ON devices(imei1);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id);
CREATE INDEX IF NOT EXISTS idx_imei_check_logs_user_id ON imei_check_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_device_claims_user_id ON device_claims(user_id);
