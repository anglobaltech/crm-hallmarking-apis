import { pool } from './src/db.js';
async function run() {
  const tables = ['users', 'jewellers', 'orders', 'article_tracking', 'reminders'];
  for (const table of tables) {
    try {
      await pool.query(`ALTER TABLE ${table} ALTER COLUMN tenant_id TYPE VARCHAR(50);`);
      await pool.query(`ALTER TABLE ${table} ALTER COLUMN tenant_id SET DEFAULT current_setting('app.current_tenant_id', true);`);
      console.log(`Fixed tenant_id for ${table}`);
    } catch (err) {
      console.log(`Error fixing ${table}:`, err.message);
    }
  }
}
run();
