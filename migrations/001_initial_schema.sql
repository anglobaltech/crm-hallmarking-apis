-- 001_initial_schema.sql
-- Create core tables for Multi-Tenant CRM

CREATE TABLE IF NOT EXISTS tenants (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    bis_licence VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL, -- e.g., 'admin', 'employee'
    pin_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS devices (
    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    device_token VARCHAR(255) NOT NULL,
    last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS articles (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    article_code VARCHAR(100) NOT NULL, -- e.g., 'ART-2024-001'
    customer_name VARCHAR(255),
    type VARCHAR(100),
    weight NUMERIC(10,3),
    purity VARCHAR(50),
    huid VARCHAR(50),
    status VARCHAR(50) DEFAULT 'Intake',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- ROW-LEVEL SECURITY (RLS) SETUP
-- ==========================================

-- 1. Enable RLS on multi-tenant tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

-- 2. Create policies based on the 'app.current_tenant_id' session variable
-- (This variable will be injected by our Node.js middleware for every request)

DROP POLICY IF EXISTS tenant_isolation_users ON users;
CREATE POLICY tenant_isolation_users ON users
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant_id', true)::INTEGER);

DROP POLICY IF EXISTS tenant_isolation_articles ON articles;
CREATE POLICY tenant_isolation_articles ON articles
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant_id', true)::INTEGER);

-- Enable RLS for database superusers/owners (optional in Postgres, but good for total lockdown)
ALTER TABLE users FORCE ROW LEVEL SECURITY;
ALTER TABLE articles FORCE ROW LEVEL SECURITY;
