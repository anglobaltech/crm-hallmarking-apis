import pg from 'pg';
import { AsyncLocalStorage } from 'async_hooks';

export const tenantStorage = new AsyncLocalStorage();

if (!process.env.DATABASE_URL) {
  console.error('FATAL ERROR: DATABASE_URL environment variable is missing. Supabase connection is required.');
  process.exit(1);
}

console.log('Connecting to Postgres (Supabase) via DATABASE_URL...');
export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL
});

const originalQuery = pool.query.bind(pool);
pool.query = async (text, params) => {
  const tenantId = tenantStorage.getStore();
  if (tenantId && !text.includes('SET LOCAL')) {
    // Postgres (pg) requires checking out a client from the pool to run SET LOCAL within a transaction reliably.
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(`SET LOCAL ROLE app_user`);
      await client.query(`SET LOCAL app.current_tenant_id = '${tenantId}'`);
      const res = await client.query(text, params);
      await client.query('COMMIT');
      return res;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
  return await originalQuery(text, params);
};

export async function checkDatabase() {
  const result = await pool.query('SELECT now() AS now');
  
  try {
    // Add address and expiry columns to tenants
    await pool.query('ALTER TABLE tenants ADD COLUMN IF NOT EXISTS address TEXT');
    await pool.query('ALTER TABLE tenants ADD COLUMN IF NOT EXISTS bis_licence_expiry DATE');
    await pool.query('ALTER TABLE tenants ADD COLUMN IF NOT EXISTS gst_number VARCHAR(100)');
    await pool.query('ALTER TABLE tenants ADD COLUMN IF NOT EXISTS logo_url TEXT');
    
    // Add columns to users
    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255)');
    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS mobile VARCHAR(20)');

    
    // Add billing columns
    await pool.query('ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_amount NUMERIC(15,2) DEFAULT 0');
    await pool.query('ALTER TABLE invoices ADD COLUMN IF NOT EXISTS balance_due NUMERIC(15,2) DEFAULT 0');

    // Ensure all tables have tenant_id BEFORE we query information_schema!
    const tablesToTenant = [
      'orders', 'article_tracking', 'billing', 'reminders', 'invoices', 'invoice_items',
      'laser_jobs', 'soldering_jobs', 'fire_assays', 'gold_exchanges', 'xrf_tests',
      'gold_rates', 'expenses', 'customers', 'staff', 'compliance_docs', 'jewellers'
    ];
    
    for (const tbl of tablesToTenant) {
      try {
        await pool.query(`ALTER TABLE ${tbl} ADD COLUMN IF NOT EXISTS tenant_id INTEGER`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_${tbl}_tenant_id ON ${tbl}(tenant_id)`);
        try { await pool.query(`CREATE INDEX IF NOT EXISTS idx_${tbl}_created_at ON ${tbl}(created_at)`); } catch(e) {}
      } catch (e) {
        // Table might not exist yet, ignore
      }
    }

    const res = await pool.query(`
      SELECT table_name, data_type 
      FROM information_schema.columns 
      WHERE column_name = 'tenant_id' AND table_schema = 'public'
    `);
    
    for (const row of res.rows) {
      const tableName = row.table_name;
      const dataType = row.data_type === 'integer' ? 'INTEGER' : 'VARCHAR';
      
      // We skip RLS on users and tenants so login/registration queries can run without a tenant session context
      if (tableName !== 'users' && tableName !== 'tenants') {
        try {
          await pool.query(`ALTER TABLE ${tableName} ALTER COLUMN tenant_id SET DEFAULT current_setting('app.current_tenant_id', true)::${dataType}`);
        } catch(e) {}

        // Migrate old data that might have a NULL tenant_id
        await pool.query(`UPDATE ${tableName} SET tenant_id = '1' WHERE tenant_id IS NULL`);

        await pool.query(`ALTER TABLE ${tableName} ENABLE ROW LEVEL SECURITY`);
        await pool.query(`ALTER TABLE ${tableName} FORCE ROW LEVEL SECURITY`);
        await pool.query(`DROP POLICY IF EXISTS tenant_isolation_policy ON ${tableName}`);
        await pool.query(`
          CREATE POLICY tenant_isolation_policy ON ${tableName}
          FOR ALL
          USING (tenant_id::VARCHAR = current_setting('app.current_tenant_id', true)::VARCHAR)
          WITH CHECK (tenant_id::VARCHAR = current_setting('app.current_tenant_id', true)::VARCHAR)
        `);
      }
    }
    
    // Ensure app_user exists so RLS isn't bypassed by superuser
    try {
      await pool.query('CREATE ROLE app_user');
    } catch(e) {}
    
    // Grant app_user to the connection user (often postgres) so we can SET ROLE to it
    try {
      await pool.query('GRANT app_user TO current_user');
    } catch(e) {}
    
    // Grant privileges to app_user so it can read/write everything
    await pool.query('GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO app_user');
    await pool.query('GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO app_user');

    // Fix missing columns that were added dynamically during development
    await pool.query('ALTER TABLE laser_jobs ADD COLUMN IF NOT EXISTS address TEXT, ADD COLUMN IF NOT EXISTS gst_number VARCHAR(100), ADD COLUMN IF NOT EXISTS purity VARCHAR(50), ADD COLUMN IF NOT EXISTS priority VARCHAR(50)');
    await pool.query('ALTER TABLE soldering_jobs ADD COLUMN IF NOT EXISTS address TEXT, ADD COLUMN IF NOT EXISTS gst_number VARCHAR(100), ADD COLUMN IF NOT EXISTS purity VARCHAR(50), ADD COLUMN IF NOT EXISTS priority VARCHAR(50)');
    await pool.query('ALTER TABLE fire_assays ADD COLUMN IF NOT EXISTS address TEXT, ADD COLUMN IF NOT EXISTS gst_number VARCHAR(100), ADD COLUMN IF NOT EXISTS purity VARCHAR(50), ADD COLUMN IF NOT EXISTS priority VARCHAR(50), ADD COLUMN IF NOT EXISTS metal VARCHAR(50)');
    await pool.query('ALTER TABLE gold_exchanges ADD COLUMN IF NOT EXISTS address TEXT, ADD COLUMN IF NOT EXISTS gst_number VARCHAR(100), ADD COLUMN IF NOT EXISTS purity VARCHAR(50), ADD COLUMN IF NOT EXISTS priority VARCHAR(50), ADD COLUMN IF NOT EXISTS metal VARCHAR(50)');
    await pool.query('ALTER TABLE xrf_tests ADD COLUMN IF NOT EXISTS address TEXT');
    
    await pool.query('ALTER TABLE invoices ADD COLUMN IF NOT EXISTS subtotal NUMERIC(10,2) DEFAULT 0');
    await pool.query('ALTER TABLE invoices ADD COLUMN IF NOT EXISTS sgst NUMERIC(10,2) DEFAULT 0');
    await pool.query('ALTER TABLE invoices ADD COLUMN IF NOT EXISTS cgst NUMERIC(10,2) DEFAULT 0');
    await pool.query('ALTER TABLE invoices ADD COLUMN IF NOT EXISTS igst NUMERIC(10,2) DEFAULT 0');
    
    // New billing dashboard and feature columns
    await pool.query('ALTER TABLE invoices ADD COLUMN IF NOT EXISTS invoice_date DATE');
    await pool.query('ALTER TABLE invoices ADD COLUMN IF NOT EXISTS sale_type VARCHAR(50)');
    await pool.query('ALTER TABLE invoices ADD COLUMN IF NOT EXISTS customer_id INTEGER');
    await pool.query('ALTER TABLE invoices ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(50)');
    await pool.query('ALTER TABLE invoices ADD COLUMN IF NOT EXISTS billing_address TEXT');
    await pool.query('ALTER TABLE invoices ADD COLUMN IF NOT EXISTS shipping_address TEXT');
    await pool.query('ALTER TABLE invoices ADD COLUMN IF NOT EXISTS state_of_supply VARCHAR(100)');
    await pool.query('ALTER TABLE invoices ADD COLUMN IF NOT EXISTS total_discount NUMERIC(10,2) DEFAULT 0');
    await pool.query('ALTER TABLE invoices ADD COLUMN IF NOT EXISTS total_tax NUMERIC(10,2) DEFAULT 0');
    await pool.query('ALTER TABLE invoices ADD COLUMN IF NOT EXISTS round_off NUMERIC(10,2) DEFAULT 0');
    await pool.query('ALTER TABLE invoices ADD COLUMN IF NOT EXISTS grand_total NUMERIC(10,2) DEFAULT 0');
    await pool.query('ALTER TABLE invoices ADD COLUMN IF NOT EXISTS image_url TEXT');
    await pool.query('ALTER TABLE invoices ADD COLUMN IF NOT EXISTS description TEXT');
    await pool.query('ALTER TABLE invoices ADD COLUMN IF NOT EXISTS linked_payment VARCHAR(255)');
    await pool.query('ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_amount NUMERIC(10,2) DEFAULT 0');
    
    await pool.query('ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255)');
    await pool.query('ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_mobile VARCHAR(50)');
    await pool.query('ALTER TABLE article_tracking ADD COLUMN IF NOT EXISTS priority VARCHAR(50)');
    await pool.query('ALTER TABLE xrf_tests ADD COLUMN IF NOT EXISTS priority VARCHAR(50)');
    
    // Reminder-specific columns
    await pool.query("ALTER TABLE reminders ADD COLUMN IF NOT EXISTS reminder_type VARCHAR(50) DEFAULT 'General'");
    await pool.query('ALTER TABLE reminders ADD COLUMN IF NOT EXISTS alert_before INTEGER DEFAULT 3');
    await pool.query("ALTER TABLE reminders ADD COLUMN IF NOT EXISTS alert_unit VARCHAR(20) DEFAULT 'Days'");
    await pool.query("ALTER TABLE reminders ADD COLUMN IF NOT EXISTS repeat_type VARCHAR(50) DEFAULT 'None'");
    await pool.query('ALTER TABLE reminders ADD COLUMN IF NOT EXISTS assigned_to VARCHAR(255)');
    await pool.query('ALTER TABLE reminders ADD COLUMN IF NOT EXISTS notes TEXT');
    await pool.query('ALTER TABLE reminders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()');
    
  } catch (err) {
    console.error('Failed to set default tenant id on startup:', err.message);
  }

  return result.rows[0].now;
}
