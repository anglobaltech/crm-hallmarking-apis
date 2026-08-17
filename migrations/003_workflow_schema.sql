-- 003_workflow_schema.sql
-- Creates tables for the remaining CRM workflows: Orders, Article Tracking, Billing, Reminders

CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    order_code VARCHAR(100) UNIQUE NOT NULL, -- e.g. ORD-2024-001
    customer_name VARCHAR(255) NOT NULL,
    customer_mobile VARCHAR(50),
    customer_id VARCHAR(50),
    receipt_date DATE DEFAULT CURRENT_DATE,
    status VARCHAR(50) DEFAULT 'Intake',
    total_articles INTEGER DEFAULT 0,
    gross_weight NUMERIC(10,3),
    priority VARCHAR(50) DEFAULT 'Normal',
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS article_tracking (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    article_code VARCHAR(100) UNIQUE NOT NULL, -- e.g. ART-2024-XXX
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    article_type VARCHAR(100) NOT NULL,
    metal VARCHAR(100) NOT NULL,
    declared_purity VARCHAR(50),
    gross_weight NUMERIC(10,3),
    net_weight NUMERIC(10,3),
    quantity INTEGER DEFAULT 1,
    huid VARCHAR(50),
    lot_number VARCHAR(100),
    bhc_code VARCHAR(100),
    status VARCHAR(50) DEFAULT 'Intake', -- Intake, WeightCheck, ImageAuto, XRF, HUID, Delivery
    current_desk VARCHAR(100) DEFAULT 'reception',
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS billing (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    invoice_no VARCHAR(100) UNIQUE NOT NULL,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    customer_name VARCHAR(255) NOT NULL,
    hallmarking_charges NUMERIC(10,2) DEFAULT 0,
    testing_charges NUMERIC(10,2) DEFAULT 0,
    quantity INTEGER DEFAULT 1,
    discount_pct NUMERIC(5,2) DEFAULT 0,
    discount_amt NUMERIC(10,2) DEFAULT 0,
    subtotal NUMERIC(10,2) DEFAULT 0,
    taxable_amount NUMERIC(10,2) DEFAULT 0,
    gst_amount NUMERIC(10,2) DEFAULT 0,
    total_amount NUMERIC(12,2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'Unpaid',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reminders (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_date DATE NOT NULL,
    equipment VARCHAR(255),
    last_cal_date DATE,
    status VARCHAR(50) DEFAULT 'Pending',
    priority VARCHAR(50) DEFAULT 'Normal',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_name);
CREATE INDEX IF NOT EXISTS idx_article_tracking_status ON article_tracking(status);
CREATE INDEX IF NOT EXISTS idx_billing_invoice ON billing(invoice_no);
CREATE INDEX IF NOT EXISTS idx_reminders_due ON reminders(due_date);



-- ==========================================
-- ROW-LEVEL SECURITY (RLS) SETUP
-- ==========================================

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_orders ON orders;
CREATE POLICY tenant_isolation_orders ON orders FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', true)::INTEGER);
ALTER TABLE orders FORCE ROW LEVEL SECURITY;

ALTER TABLE article_tracking ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_article_tracking ON article_tracking;
CREATE POLICY tenant_isolation_article_tracking ON article_tracking FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', true)::INTEGER);
ALTER TABLE article_tracking FORCE ROW LEVEL SECURITY;

ALTER TABLE billing ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_billing ON billing;
CREATE POLICY tenant_isolation_billing ON billing FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', true)::INTEGER);
ALTER TABLE billing FORCE ROW LEVEL SECURITY;

ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_reminders ON reminders;
CREATE POLICY tenant_isolation_reminders ON reminders FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', true)::INTEGER);
ALTER TABLE reminders FORCE ROW LEVEL SECURITY;

