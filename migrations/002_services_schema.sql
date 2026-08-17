-- 002_services_schema.sql
-- Creates tables for Jewellers and all core Hallmarking services

CREATE TABLE IF NOT EXISTS jewellers (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    bis_license VARCHAR(100),
    gst_number VARCHAR(100),
    phone VARCHAR(50),
    email VARCHAR(255),
    address TEXT,
    huid_issued INTEGER DEFAULT 0,
    total_articles INTEGER DEFAULT 0,
    outstanding_balance NUMERIC(10,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS laser_jobs (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    job_date DATE DEFAULT CURRENT_DATE,
    jeweller_name VARCHAR(255) NOT NULL,
    jeweller_id INTEGER REFERENCES jewellers(id) ON DELETE SET NULL,
    phone VARCHAR(50),
    article_type VARCHAR(100) NOT NULL,
    material VARCHAR(100) NOT NULL,
    pieces INTEGER DEFAULT 1,
    weight NUMERIC(10,3),
    huid VARCHAR(50),
    start_huid VARCHAR(50),
    end_huid VARCHAR(50),
    description TEXT,
    operator VARCHAR(100),
    charges NUMERIC(10,2) DEFAULT 0,
    payment_mode VARCHAR(50) DEFAULT 'Cash',
    status VARCHAR(50) DEFAULT 'Pending',
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS xrf_tests (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    test_date DATE DEFAULT CURRENT_DATE,
    sample_id VARCHAR(100),
    jeweller_name VARCHAR(255) NOT NULL,
    jeweller_id INTEGER REFERENCES jewellers(id) ON DELETE SET NULL,
    phone VARCHAR(50),
    bis_license VARCHAR(100),
    article_type VARCHAR(100) NOT NULL,
    huid VARCHAR(50),
    pieces INTEGER DEFAULT 1,
    weight NUMERIC(10,3),
    declared_purity VARCHAR(50),
    machine VARCHAR(100),
    gold_pct NUMERIC(6,2) DEFAULT 0,
    silver_pct NUMERIC(6,2) DEFAULT 0,
    copper_pct NUMERIC(6,2) DEFAULT 0,
    zinc_pct NUMERIC(6,2) DEFAULT 0,
    other_pct NUMERIC(6,2) DEFAULT 0,
    tested_purity VARCHAR(50),
    result VARCHAR(50) DEFAULT 'Pass',
    operator VARCHAR(100),
    charges NUMERIC(10,2) DEFAULT 0,
    payment_mode VARCHAR(50) DEFAULT 'Cash',
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS soldering_jobs (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    job_date DATE DEFAULT CURRENT_DATE,
    jeweller_name VARCHAR(255) NOT NULL,
    jeweller_id INTEGER REFERENCES jewellers(id) ON DELETE SET NULL,
    phone VARCHAR(50),
    article_type VARCHAR(100) NOT NULL,
    material VARCHAR(100),
    weight NUMERIC(10,3),
    huid VARCHAR(50),
    pieces INTEGER DEFAULT 1,
    issue VARCHAR(100),
    issue_desc TEXT,
    solder_type VARCHAR(100),
    solder_weight NUMERIC(10,3),
    estimated_time VARCHAR(100),
    operator VARCHAR(100),
    delivery_date DATE,
    status VARCHAR(50) DEFAULT 'Pending',
    charges NUMERIC(10,2) DEFAULT 0,
    payment_mode VARCHAR(50) DEFAULT 'Cash',
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS fire_assays (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    assay_date DATE DEFAULT CURRENT_DATE,
    batch_no VARCHAR(100),
    jeweller_name VARCHAR(255) NOT NULL,
    jeweller_id INTEGER REFERENCES jewellers(id) ON DELETE SET NULL,
    phone VARCHAR(50),
    article_type VARCHAR(100) NOT NULL,
    pieces INTEGER DEFAULT 1,
    sample_weight NUMERIC(10,4),
    declared_purity VARCHAR(50),
    silver_added NUMERIC(10,4),
    lead_foil_weight NUMERIC(10,4),
    cupel_weight NUMERIC(10,4),
    cornet_weight NUMERIC(10,4),
    final_purity NUMERIC(6,3),
    result VARCHAR(50) DEFAULT 'Pass',
    operator VARCHAR(100),
    charges NUMERIC(10,2) DEFAULT 0,
    payment_mode VARCHAR(50) DEFAULT 'Cash',
    remarks TEXT,
    status VARCHAR(50) DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS gold_exchanges (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    exchange_date DATE DEFAULT CURRENT_DATE,
    jeweller_name VARCHAR(255) NOT NULL,
    jeweller_id INTEGER REFERENCES jewellers(id) ON DELETE SET NULL,
    phone VARCHAR(50),
    article_type VARCHAR(100) NOT NULL,
    pieces INTEGER DEFAULT 1,
    gross_weight NUMERIC(10,3),
    net_weight NUMERIC(10,3),
    purity VARCHAR(50),
    fine_gold_weight NUMERIC(10,3),
    gold_rate NUMERIC(10,2),
    total_value NUMERIC(15,2),
    exchange_type VARCHAR(50), -- e.g., 'Cash', 'Gold Bar', 'New Jewelry'
    status VARCHAR(50) DEFAULT 'Pending',
    operator VARCHAR(100),
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ==========================================
-- ROW-LEVEL SECURITY (RLS) SETUP
-- ==========================================

ALTER TABLE jewellers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_jewellers ON jewellers;
CREATE POLICY tenant_isolation_jewellers ON jewellers FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', true)::INTEGER);
ALTER TABLE jewellers FORCE ROW LEVEL SECURITY;

ALTER TABLE laser_jobs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_laser_jobs ON laser_jobs;
CREATE POLICY tenant_isolation_laser_jobs ON laser_jobs FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', true)::INTEGER);
ALTER TABLE laser_jobs FORCE ROW LEVEL SECURITY;

ALTER TABLE xrf_tests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_xrf_tests ON xrf_tests;
CREATE POLICY tenant_isolation_xrf_tests ON xrf_tests FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', true)::INTEGER);
ALTER TABLE xrf_tests FORCE ROW LEVEL SECURITY;

ALTER TABLE soldering_jobs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_soldering_jobs ON soldering_jobs;
CREATE POLICY tenant_isolation_soldering_jobs ON soldering_jobs FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', true)::INTEGER);
ALTER TABLE soldering_jobs FORCE ROW LEVEL SECURITY;

ALTER TABLE fire_assays ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_fire_assays ON fire_assays;
CREATE POLICY tenant_isolation_fire_assays ON fire_assays FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', true)::INTEGER);
ALTER TABLE fire_assays FORCE ROW LEVEL SECURITY;

ALTER TABLE gold_exchanges ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_gold_exchanges ON gold_exchanges;
CREATE POLICY tenant_isolation_gold_exchanges ON gold_exchanges FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', true)::INTEGER);
ALTER TABLE gold_exchanges FORCE ROW LEVEL SECURITY;

