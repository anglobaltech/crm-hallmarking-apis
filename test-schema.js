import { pool } from './src/db.js';
async function test() {
  const tenants = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'tenants'");
  const users = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users'");
  console.log('Tenants Schema:', tenants.rows);
  console.log('Users Schema:', users.rows);
  process.exit(0);
}
test();
