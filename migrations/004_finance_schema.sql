-- 004_finance_schema.sql
-- Create finance related tables

CREATE TABLE IF NOT EXISTS gold_rates (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    rate_24k NUMERIC(10,2) NOT NULL,
    rate_22k NUMERIC(10,2) NOT NULL,
    rate_18k NUMERIC(10,2) NOT NULL,
    effective_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS invoices (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    invoice_number VARCHAR(100) NOT NULL,
    customer_name VARCHAR(255),
    amount NUMERIC(12,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS expenses (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    description TEXT,
    expense_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE invoices FORCE ROW LEVEL SECURITY;
ALTER TABLE expenses FORCE ROW LEVEL SECURITY;


-- ==========================================
-- ROW-LEVEL SECURITY (RLS) SETUP
-- ==========================================

ALTER TABLE gold_rates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_gold_rates ON gold_rates;
CREATE POLICY tenant_isolation_gold_rates ON gold_rates FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', true)::INTEGER);
ALTER TABLE gold_rates FORCE ROW LEVEL SECURITY;

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_invoices ON invoices;
CREATE POLICY tenant_isolation_invoices ON invoices FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', true)::INTEGER);
ALTER TABLE invoices FORCE ROW LEVEL SECURITY;

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_expenses ON expenses;
CREATE POLICY tenant_isolation_expenses ON expenses FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', true)::INTEGER);
ALTER TABLE expenses FORCE ROW LEVEL SECURITY;

