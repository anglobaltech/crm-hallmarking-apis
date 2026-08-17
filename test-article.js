import { pool } from './src/db.js';
async function run() {
  try {
    const res = await pool.query(`SELECT created_at, status FROM article_tracking ORDER BY created_at DESC LIMIT 5`);
    console.log("Latest articles:", res.rows);
  } catch (e) {
    console.error(e.message);
  }
}
run();
