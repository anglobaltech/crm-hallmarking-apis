import { pool } from './src/db.js';
async function run() {
  try {
    const res = await pool.query(`SELECT COUNT(*) FROM article_tracking`);
    console.log("article_tracking total:", res.rows[0].count);
    const res2 = await pool.query(`SELECT COUNT(*) FROM laser_jobs`);
    console.log("laser_jobs total:", res2.rows[0].count);
  } catch (e) {
    console.error(e.message);
  }
}
run();
