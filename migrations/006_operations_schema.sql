-- 006_operations_schema.sql
-- Create operations related tables

CREATE TABLE IF NOT EXISTS staff (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(100) NOT NULL,
    phone VARCHAR(50),
    status VARCHAR(50) DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(255) NOT NULL,
    details JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS daily_reports (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    report_date DATE NOT NULL,
    total_articles INTEGER DEFAULT 0,
    total_revenue NUMERIC(12,2) DEFAULT 0,
    summary JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE notifications FORCE ROW LEVEL SECURITY;
ALTER TABLE audit_logs FORCE ROW LEVEL SECURITY;
ALTER TABLE daily_reports FORCE ROW LEVEL SECURITY;


-- ==========================================
-- ROW-LEVEL SECURITY (RLS) SETUP
-- ==========================================

ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_staff ON staff;
CREATE POLICY tenant_isolation_staff ON staff FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', true)::INTEGER);
ALTER TABLE staff FORCE ROW LEVEL SECURITY;

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_notifications ON notifications;
CREATE POLICY tenant_isolation_notifications ON notifications FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', true)::INTEGER);
ALTER TABLE notifications FORCE ROW LEVEL SECURITY;

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_audit_logs ON audit_logs;
CREATE POLICY tenant_isolation_audit_logs ON audit_logs FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', true)::INTEGER);
ALTER TABLE audit_logs FORCE ROW LEVEL SECURITY;

ALTER TABLE daily_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_daily_reports ON daily_reports;
CREATE POLICY tenant_isolation_daily_reports ON daily_reports FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', true)::INTEGER);
ALTER TABLE daily_reports FORCE ROW LEVEL SECURITY;

