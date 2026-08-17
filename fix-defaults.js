import { pool } from './src/db.js';
async function run() {
  const tables = ['users', 'jewellers', 'equipment', 'calibrations', 'orders', 'article_tracking', 'reminders'];
  for (const table of tables) {
    try {
      await pool.query(`ALTER TABLE ${table} ALTER COLUMN tenant_id SET DEFAULT current_setting('app.current_tenant_id', true);`);
      console.log(`Set default for ${table}`);
    } catch (err) {
      console.log(`Error setting default for ${table}:`, err.message);
    }
  }
}
run();
