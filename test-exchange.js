import { pool } from './src/db.js';
async function test() {
  const o = await pool.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name='gold_exchanges'`);
  console.log('Exchange columns:', o.rows.map(r => r.column_name));
}
test();
