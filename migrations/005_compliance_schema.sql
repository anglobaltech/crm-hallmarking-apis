-- 005_compliance_schema.sql
-- Create compliance related tables

CREATE TABLE IF NOT EXISTS compliance_docs (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    document_name VARCHAR(255) NOT NULL,
    document_type VARCHAR(100),
    expiry_date DATE,
    file_url TEXT,
    status VARCHAR(50) DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS calibration_logs (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    machine_name VARCHAR(255) NOT NULL,
    calibration_date DATE NOT NULL,
    next_due_date DATE,
    technician VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE calibration_logs FORCE ROW LEVEL SECURITY;


-- ==========================================
-- ROW-LEVEL SECURITY (RLS) SETUP
-- ==========================================

ALTER TABLE compliance_docs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_compliance_docs ON compliance_docs;
CREATE POLICY tenant_isolation_compliance_docs ON compliance_docs FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', true)::INTEGER);
ALTER TABLE compliance_docs FORCE ROW LEVEL SECURITY;

ALTER TABLE calibration_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_calibration_logs ON calibration_logs;
CREATE POLICY tenant_isolation_calibration_logs ON calibration_logs FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', true)::INTEGER);
ALTER TABLE calibration_logs FORCE ROW LEVEL SECURITY;

