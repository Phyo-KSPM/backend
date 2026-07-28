-- 004_er_diagram_reconcile.sql
-- Align existing DBs with UI-first ER: drop refresh_tokens / dealer fields,
-- add users.nrc_no, shrink claim_doc_type to device_photo only.

ALTER TABLE users ADD COLUMN IF NOT EXISTS nrc_no TEXT;

ALTER TABLE users DROP COLUMN IF EXISTS tin;
ALTER TABLE users DROP COLUMN IF EXISTS business_registration_no;
ALTER TABLE users DROP COLUMN IF EXISTS dealer_verified;

DROP TABLE IF EXISTS refresh_tokens;

ALTER TABLE payment_batches DROP COLUMN IF EXISTS tin;
ALTER TABLE payment_batches DROP COLUMN IF EXISTS business_registration_no;
ALTER TABLE payment_batches DROP COLUMN IF EXISTS dealer_business_name;
ALTER TABLE payment_batches DROP COLUMN IF EXISTS dealer_verified;

-- claim_doc_type: keep only device_photo (Postgres cannot DROP ENUM value in-place)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_enum e ON e.enumtypid = t.oid
    WHERE t.typname = 'claim_doc_type' AND e.enumlabel IN ('nrc_front', 'nrc_back')
  ) THEN
    UPDATE claim_documents SET doc_type = 'device_photo' WHERE doc_type::text IN ('nrc_front', 'nrc_back');
    ALTER TYPE claim_doc_type RENAME TO claim_doc_type_old;
    CREATE TYPE claim_doc_type AS ENUM ('device_photo');
    ALTER TABLE claim_documents
      ALTER COLUMN doc_type TYPE claim_doc_type
      USING doc_type::text::claim_doc_type;
    DROP TYPE claim_doc_type_old;
  END IF;
END $$;
