import { pool } from './src/db.js';
async function test() {
  const o = await pool.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name='articles'`);
  console.log('Articles columns:', o.rows.map(r => r.column_name));
  process.exit(0);
}
test();
