import { pool } from './src/db.js';
async function test() {
  const o = await pool.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name='orders'`);
  console.log('Orders:', o.rows);
  const a = await pool.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name='article_tracking'`);
  console.log('Article Tracking:', a.rows);
}
test();
