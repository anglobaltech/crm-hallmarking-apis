-- 007_billing_upgrades.sql
-- Overhaul the billing system to support advanced POS features and line items

-- 1. Drop the old simplistic billing table
DROP TABLE IF EXISTS billing CASCADE;

-- 2. Create the robust invoices table (Header)
CREATE TABLE IF NOT EXISTS invoices (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    invoice_number VARCHAR(100) UNIQUE NOT NULL,
    invoice_date DATE DEFAULT CURRENT_DATE,
    invoice_time TIME DEFAULT CURRENT_TIME,
    sale_type VARCHAR(50) DEFAULT 'Cash', -- Cash or Credit
    customer_id VARCHAR(100),
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50),
    billing_address TEXT,
    shipping_address TEXT,
    state_of_supply VARCHAR(100),
    
    -- Totals
    subtotal NUMERIC(15,2) DEFAULT 0,
    total_discount NUMERIC(15,2) DEFAULT 0,
    total_tax NUMERIC(15,2) DEFAULT 0,
    round_off NUMERIC(10,2) DEFAULT 0,
    grand_total NUMERIC(15,2) DEFAULT 0,
    
    status VARCHAR(50) DEFAULT 'Unpaid',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create the invoice_items table (Line Items)
CREATE TABLE IF NOT EXISTS invoice_items (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    item_name VARCHAR(255) NOT NULL,
    quantity NUMERIC(10,3) DEFAULT 1,
    unit VARCHAR(50) DEFAULT 'NONE',
    price_per_unit NUMERIC(15,2) DEFAULT 0,
    is_tax_inclusive BOOLEAN DEFAULT false,
    
    discount_pct NUMERIC(5,2) DEFAULT 0,
    discount_amt NUMERIC(15,2) DEFAULT 0,
    
    tax_rate VARCHAR(50) DEFAULT 'NONE', -- e.g. 'GST@18%'
    tax_amt NUMERIC(15,2) DEFAULT 0,
    
    amount NUMERIC(15,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_invoices_tenant ON invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invoices_customer ON invoices(customer_name);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items(invoice_id);

-- ==========================================
-- ROW-LEVEL SECURITY (RLS) SETUP
-- ==========================================

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_invoices ON invoices;
CREATE POLICY tenant_isolation_invoices ON invoices FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', true)::INTEGER);
ALTER TABLE invoices FORCE ROW LEVEL SECURITY;

ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_invoice_items ON invoice_items;
CREATE POLICY tenant_isolation_invoice_items ON invoice_items FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', true)::INTEGER);
ALTER TABLE invoice_items FORCE ROW LEVEL SECURITY;
