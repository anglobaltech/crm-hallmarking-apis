import { pool } from './src/db.js';
async function test() {
  const o = await pool.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name='invoices'`);
  console.log('Invoices:', o.rows);
  const a = await pool.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name='invoice_items'`);
  console.log('Invoice Items:', a.rows);
}
test();
