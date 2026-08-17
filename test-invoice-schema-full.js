import { pool } from './src/db.js';
async function test() {
  const o = await pool.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name='invoices'`);
  console.log('Invoices columns:');
  o.rows.forEach(r => console.log(r.column_name, r.data_type));
}
test();
