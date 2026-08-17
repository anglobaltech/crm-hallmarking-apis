-- ============================================================
-- BIS Hallmarking Centre — PostgreSQL Schema
-- Run: psql -U hallmarkpro -d hallmarkpro -f 001_init.sql
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- JEWELLERS (BIS HUID)
-- ============================================================
CREATE TABLE IF NOT EXISTS jewellers (
  id              TEXT PRIMARY KEY DEFAULT 'J' || to_char(nextval('jeweller_seq'), 'FM000'),
  name            TEXT NOT NULL,
  owner_name      TEXT NOT NULL,
  phone           TEXT NOT NULL,
  email           TEXT,
  address         TEXT,
  city            TEXT,
  state           TEXT DEFAULT 'Rajasthan',
  pincode         TEXT,
  bis_license     TEXT UNIQUE NOT NULL,
  license_expiry  DATE,
  category        TEXT DEFAULT 'Gold',
  gstin           TEXT,
  pan_number      TEXT,
  aadhar          TEXT,
  bank_name       TEXT,
  account_number  TEXT,
  ifsc            TEXT,
  notes           TEXT,
  status          TEXT DEFAULT 'Active',  -- Active | Expiring | Inactive
  huid_issued     INTEGER DEFAULT 0,
  articles_count  INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE SEQUENCE IF NOT EXISTS jeweller_seq START 1;

-- ============================================================
-- LASER CUTTING JOBS
-- ============================================================
CREATE TABLE IF NOT EXISTS laser_jobs (
  id              TEXT PRIMARY KEY DEFAULT 'LC' || to_char(nextval('laser_seq'), 'FM000'),
  job_date        DATE NOT NULL DEFAULT CURRENT_DATE,
  jeweller_name   TEXT NOT NULL,
  jeweller_id     TEXT REFERENCES jewellers(id) ON DELETE SET NULL,
  phone           TEXT,
  article_type    TEXT NOT NULL,
  material        TEXT NOT NULL,
  pieces          INTEGER NOT NULL DEFAULT 1,
  weight          NUMERIC(10,3),
  huid            TEXT,
  start_huid      TEXT,
  end_huid        TEXT,
  description     TEXT,
  operator        TEXT,
  charges         NUMERIC(10,2) DEFAULT 0,
  payment_mode    TEXT DEFAULT 'Cash',
  status          TEXT DEFAULT 'Pending',  -- Pending | Processing | Completed
  remarks         TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE SEQUENCE IF NOT EXISTS laser_seq START 1;

-- ============================================================
-- XRF TESTING
-- ============================================================
CREATE TABLE IF NOT EXISTS xrf_tests (
  id              TEXT PRIMARY KEY DEFAULT 'XRF' || to_char(nextval('xrf_seq'), 'FM000'),
  test_date       DATE NOT NULL DEFAULT CURRENT_DATE,
  sample_id       TEXT,
  jeweller_name   TEXT NOT NULL,
  jeweller_id     TEXT REFERENCES jewellers(id) ON DELETE SET NULL,
  phone           TEXT,
  bis_license     TEXT,
  article_type    TEXT NOT NULL,
  huid            TEXT,
  pieces          INTEGER DEFAULT 1,
  weight          NUMERIC(10,3),
  declared_purity NUMERIC(6,2),
  machine         TEXT DEFAULT 'XRF Analyzer',
  gold_pct        NUMERIC(6,3) DEFAULT 0,
  silver_pct      NUMERIC(6,3) DEFAULT 0,
  copper_pct      NUMERIC(6,3) DEFAULT 0,
  zinc_pct        NUMERIC(6,3) DEFAULT 0,
  other_pct       NUMERIC(6,3) DEFAULT 0,
  tested_purity   NUMERIC(6,2),
  result          TEXT DEFAULT 'Pass',  -- Pass | Fail | Borderline
  operator        TEXT,
  charges         NUMERIC(10,2) DEFAULT 0,
  payment_mode    TEXT DEFAULT 'Cash',
  remarks         TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE SEQUENCE IF NOT EXISTS xrf_seq START 1;

-- ============================================================
-- SOLDERING JOBS
-- ============================================================
CREATE TABLE IF NOT EXISTS soldering_jobs (
  id              TEXT PRIMARY KEY DEFAULT 'SOL' || to_char(nextval('sol_seq'), 'FM000'),
  job_date        DATE NOT NULL DEFAULT CURRENT_DATE,
  jeweller_name   TEXT NOT NULL,
  jeweller_id     TEXT REFERENCES jewellers(id) ON DELETE SET NULL,
  phone           TEXT,
  article_type    TEXT NOT NULL,
  material        TEXT,
  weight          NUMERIC(10,3),
  huid            TEXT,
  pieces          INTEGER DEFAULT 1,
  issue           TEXT,
  issue_desc      TEXT,
  solder_type     TEXT DEFAULT 'Easy',
  solder_weight   NUMERIC(10,3),
  estimated_time  NUMERIC(5,2),
  operator        TEXT,
  delivery_date   DATE,
  status          TEXT DEFAULT 'Pending',  -- Pending | In Progress | Completed | Delivered
  charges         NUMERIC(10,2) DEFAULT 0,
  payment_mode    TEXT DEFAULT 'Cash',
  remarks         TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE SEQUENCE IF NOT EXISTS sol_seq START 1;

-- ============================================================
-- FIRE ASSAYING
-- ============================================================
CREATE TABLE IF NOT EXISTS fire_assays (
  id              TEXT PRIMARY KEY DEFAULT 'FA' || to_char(nextval('fa_seq'), 'FM000'),
  assay_date      DATE NOT NULL DEFAULT CURRENT_DATE,
  sample_id       TEXT,
  jeweller_name   TEXT NOT NULL,
  jeweller_id     TEXT REFERENCES jewellers(id) ON DELETE SET NULL,
  phone           TEXT,
  bis_license     TEXT,
  article_type    TEXT NOT NULL,
  material        TEXT DEFAULT 'Gold',
  article_weight  NUMERIC(10,3),
  huid            TEXT,
  pieces          INTEGER DEFAULT 1,
  cupel_no        TEXT,
  crucible_no     TEXT,
  sample_weight   NUMERIC(10,4),
  lead_weight     NUMERIC(10,4),
  silver_used     NUMERIC(10,4),
  ash_weight      NUMERIC(10,4),
  bead_weight     NUMERIC(10,4),
  parcel_weight   NUMERIC(10,4),
  purity          NUMERIC(6,2),
  fineness        INTEGER,
  hallmark_grade  TEXT DEFAULT '916',
  result          TEXT DEFAULT 'Pass',  -- Pass | Fail | Borderline
  furnace_temp    INTEGER DEFAULT 900,
  operator        TEXT,
  charges         NUMERIC(10,2) DEFAULT 0,
  payment_mode    TEXT DEFAULT 'Cash',
  remarks         TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE SEQUENCE IF NOT EXISTS fa_seq START 1;

-- ============================================================
-- GOLD EXCHANGE
-- ============================================================
CREATE TABLE IF NOT EXISTS gold_exchanges (
  id              TEXT PRIMARY KEY DEFAULT 'GX' || to_char(nextval('gx_seq'), 'FM000'),
  txn_date        DATE NOT NULL DEFAULT CURRENT_DATE,
  txn_type        TEXT NOT NULL DEFAULT 'Buy',  -- Buy | Sell | Exchange
  jeweller_name   TEXT NOT NULL,
  jeweller_id     TEXT REFERENCES jewellers(id) ON DELETE SET NULL,
  phone           TEXT,
  address         TEXT,
  bis_license     TEXT,
  gstin           TEXT,
  gold_type       TEXT DEFAULT 'Old Jewellery',
  purity          NUMERIC(6,2),
  fineness        TEXT,
  huid            TEXT,
  pieces          INTEGER DEFAULT 1,
  gross_weight    NUMERIC(10,3),
  stone_weight    NUMERIC(10,3) DEFAULT 0,
  other_deduct_wt NUMERIC(10,3) DEFAULT 0,
  net_weight      NUMERIC(10,3),
  rate_per_gram   NUMERIC(10,2),
  gross_amount    NUMERIC(12,2),
  making_deduct   NUMERIC(10,2) DEFAULT 0,
  other_deduct    NUMERIC(10,2) DEFAULT 0,
  total_deductions NUMERIC(10,2) DEFAULT 0,
  final_amount    NUMERIC(12,2),
  payment_mode    TEXT DEFAULT 'Cash',
  cheque_no       TEXT,
  upi_ref         TEXT,
  status          TEXT DEFAULT 'Completed',  -- Completed | Pending
  remarks         TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE SEQUENCE IF NOT EXISTS gx_seq START 1;

-- ============================================================
-- Indexes for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_jewellers_bis_license ON jewellers(bis_license);
CREATE INDEX IF NOT EXISTS idx_jewellers_status ON jewellers(status);
CREATE INDEX IF NOT EXISTS idx_laser_jobs_date ON laser_jobs(job_date);
CREATE INDEX IF NOT EXISTS idx_laser_jobs_jeweller ON laser_jobs(jeweller_id);
CREATE INDEX IF NOT EXISTS idx_xrf_tests_date ON xrf_tests(test_date);
CREATE INDEX IF NOT EXISTS idx_soldering_jobs_status ON soldering_jobs(status);
CREATE INDEX IF NOT EXISTS idx_fire_assays_date ON fire_assays(assay_date);
CREATE INDEX IF NOT EXISTS idx_gold_exchanges_date ON gold_exchanges(txn_date);
CREATE INDEX IF NOT EXISTS idx_gold_exchanges_type ON gold_exchanges(txn_type);

-- ============================================================
-- Sample Data (optional — comment out in production)
-- ============================================================
INSERT INTO jewellers (id, name, owner_name, phone, email, address, city, bis_license, license_expiry, category, gstin, status)
VALUES
  ('J001', 'Suresh Kumar Jewellers', 'Suresh Kumar', '9876543210', 'suresh@skjewels.com', 'Shop No. 12, Gold Market', 'Jaipur', 'BIS/HM/RAJ/2024/001', '2026-03-31', 'Gold', '08AAACS1234A1Z5', 'Active'),
  ('J002', 'Anita Gold House', 'Anita Sharma', '9812345678', 'anita@anitagold.com', 'Main Bazaar', 'Ajmer', 'BIS/HM/RAJ/2024/015', '2025-12-31', 'Silver', '08AAACS5678A1Z8', 'Active'),
  ('J003', 'Rajput Ornaments', 'Vikram Rajput', '9988776655', 'vikram@rajputornaments.com', 'Sardar Market', 'Jodhpur', 'BIS/HM/RAJ/2023/042', '2025-08-31', 'Gold', '08AAACR9012A1Z2', 'Expiring')
ON CONFLICT (id) DO NOTHING;

SELECT 'Schema created successfully' AS status;
