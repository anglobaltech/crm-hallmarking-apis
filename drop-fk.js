import { pool } from './src/db.js';
async function run() {
  const tables = [
    'users', 'jewellers', 'orders', 'article_tracking', 'reminders',
    'equipment', 'calibrations', 'service_vouchers', 'gold_exchanges',
    'compliance_docs', 'calibration_logs', 'gold_rates', 'expenses',
    'staff', 'notifications', 'audit_logs', 'daily_reports'
  ];
  
  for (const table of tables) {
    try {
      await pool.query(`ALTER TABLE ${table} DROP CONSTRAINT IF EXISTS ${table}_tenant_id_fkey;`);
      
      const policyName = `tenant_isolation_${table}`;
      await pool.query(`DROP POLICY IF EXISTS ${policyName} ON ${table};`);
      await pool.query(`DROP POLICY IF EXISTS tenant_isolation_policy ON ${table};`);
      
      await pool.query(`ALTER TABLE ${table} ALTER COLUMN tenant_id TYPE VARCHAR(50);`);
      await pool.query(`ALTER TABLE ${table} ALTER COLUMN tenant_id SET DEFAULT current_setting('app.current_tenant_id', true);`);
      await pool.query(`CREATE POLICY ${policyName} ON ${table} USING (tenant_id::text = current_setting('app.current_tenant_id', true));`);
      
      console.log(`Successfully fixed tenant_id for ${table}`);
    } catch (err) {
      console.log(`Error fixing ${table}:`, err.message);
    }
  }
}
run();
