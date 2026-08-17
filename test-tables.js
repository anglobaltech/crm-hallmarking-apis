import { pool } from './src/db.js';
async function test() {
  const o = await pool.query(`SELECT table_name FROM information_schema.tables WHERE table_schema='public'`);
  console.log('Tables:', o.rows.map(r => r.table_name));
  process.exit(0);
}
test();
