import { pool } from './src/db.js';
async function run() {
  const result = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'orders'");
  console.log('Orders:', result.rows);
  const result2 = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'article_tracking'");
  console.log('Article Tracking:', result2.rows);
}
run();
