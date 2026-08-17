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
      // Check if table exists
      const tableCheck = await pool.query(`SELECT to_regclass('${table}') as exists`);
      if (!tableCheck.rows[0].exists) continue;

      const policyName = `tenant_isolation_${table}`;
      await pool.query(`DROP POLICY IF EXISTS ${policyName} ON ${table};`);
      
      // Some old policies might just be named 'tenant_isolation_policy'
      await pool.query(`DROP POLICY IF EXISTS tenant_isolation_policy ON ${table};`);
      
      // If table doesn't have tenant_id column, skip
      const colCheck = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name = '${table}' AND column_name = 'tenant_id'`);
      if (colCheck.rows.length === 0) continue;

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
