import { pool } from './src/db.js';
async function run() {
  const result = await pool.query("SELECT data_type FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'tenant_id'");
  console.log('Orders tenant_id type:', result.rows[0].data_type);
}
run();
