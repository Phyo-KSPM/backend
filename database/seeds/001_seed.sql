-- 001_seed.sql
-- Idempotent seed for CEIR demo data

INSERT INTO nrc_regions (id, code, name) VALUES
  (1, '1', 'Kachin'),
  (10, '10', 'Yangon')
ON CONFLICT (id) DO UPDATE SET code = EXCLUDED.code, name = EXCLUDED.name;

SELECT setval(pg_get_serial_sequence('nrc_regions', 'id'), GREATEST((SELECT MAX(id) FROM nrc_regions), 10));

INSERT INTO nrc_townships (id, region_id, code, name_en, name_mm) VALUES
  (145, 1, 'KAMANA', 'Kamayut', 'ကမာရွတ်'),
  (210, 10, 'MAYANGONE', 'Mayangone', 'မရမ်းကုန်း')
ON CONFLICT (id) DO UPDATE SET
  region_id = EXCLUDED.region_id,
  code = EXCLUDED.code,
  name_en = EXCLUDED.name_en,
  name_mm = EXCLUDED.name_mm;

SELECT setval(pg_get_serial_sequence('nrc_townships', 'id'), GREATEST((SELECT MAX(id) FROM nrc_townships), 210));

INSERT INTO users (
  id, email, password_hash, phone, full_name, address, township_id,
  business_name, tin, business_registration_no, dealer_verified
) VALUES (
  'b1f2a3c4-d5e6-7890-abcd-ef1234567890',
  'maung@dealer.com',
  '$2b$10$R1hjNMeyqyHgNYBPoABe0evTb8xERlGmmgbywLWsYtjPrx3448AFu',
  '09791243682',
  'Maung Maung',
  'No 27(G), Mayangone, Yangon',
  210,
  'QHRM Trading',
  '123456789',
  'REG-2026-001',
  TRUE
)
ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  phone = EXCLUDED.phone,
  full_name = EXCLUDED.full_name,
  address = EXCLUDED.address,
  township_id = EXCLUDED.township_id,
  business_name = EXCLUDED.business_name,
  tin = EXCLUDED.tin,
  business_registration_no = EXCLUDED.business_registration_no,
  dealer_verified = EXCLUDED.dealer_verified;

INSERT INTO devices (
  id, imei1, imei2, brand, product_name, model_name, serial_number,
  manufacturer, operating_system, device_type, allocation_date,
  registration_status, pmc_status, tax_payment_status, blocking_status
) VALUES
  (
    1024,
    '359876543210108',
    '359876543210109',
    'Samsung',
    'Galaxy A16',
    'SM-A165F/DS',
    'RF303KEK934E',
    'Samsung',
    'Android',
    'smartphone',
    '2025-01-15',
    'registered',
    'correct',
    'unpaid',
    'allowed'
  ),
  (
    1025,
    '359876543210200',
    '359876543210201',
    'Infinix',
    'Note 40',
    'X6850',
    'INF40SERIAL01',
    'Infinix',
    'Android',
    'smartphone',
    '2025-03-01',
    'registered',
    'correct',
    'unpaid',
    'allowed'
  ),
  (
    1026,
    '359876543210300',
    NULL,
    'Xiaomi',
    'Redmi Note 13',
    '2312DRA50G',
    'XM13SERIAL01',
    'Xiaomi',
    'Android',
    'smartphone',
    '2025-04-10',
    'partial',
    'incorrect',
    'unpaid',
    'blocked'
  )
ON CONFLICT (id) DO UPDATE SET
  imei1 = EXCLUDED.imei1,
  imei2 = EXCLUDED.imei2,
  brand = EXCLUDED.brand,
  product_name = EXCLUDED.product_name,
  model_name = EXCLUDED.model_name,
  serial_number = EXCLUDED.serial_number,
  manufacturer = EXCLUDED.manufacturer,
  operating_system = EXCLUDED.operating_system,
  device_type = EXCLUDED.device_type,
  allocation_date = EXCLUDED.allocation_date,
  registration_status = EXCLUDED.registration_status,
  pmc_status = EXCLUDED.pmc_status,
  tax_payment_status = EXCLUDED.tax_payment_status,
  blocking_status = EXCLUDED.blocking_status;

SELECT setval(pg_get_serial_sequence('devices', 'id'), GREATEST((SELECT MAX(id) FROM devices), 1026));

INSERT INTO activities (id, user_id, type, detail, occurred_at) VALUES
  (90, 'b1f2a3c4-d5e6-7890-abcd-ef1234567890', 'device_claimed', 'Device Claimed', '2026-07-02T09:12:00Z'),
  (91, 'b1f2a3c4-d5e6-7890-abcd-ef1234567890', 'tax_paid', '1 Device(s) Paid Tax Successfully', '2026-07-07T09:17:00Z')
ON CONFLICT (id) DO UPDATE SET
  type = EXCLUDED.type,
  detail = EXCLUDED.detail,
  occurred_at = EXCLUDED.occurred_at;

SELECT setval(pg_get_serial_sequence('activities', 'id'), GREATEST((SELECT MAX(id) FROM activities), 91));
