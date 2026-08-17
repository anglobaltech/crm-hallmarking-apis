import { pool } from './src/db.js';
async function test() {
  const o = await pool.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name='orders'`);
  console.log('Orders columns:', o.rows.map(r => r.column_name));
}
test();
