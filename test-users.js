import { pool } from './src/db.js';
async function run() {
  try {
    const res = await pool.query('SELECT * FROM users');
    console.log("users:", res.rows);
  } catch (e) {
    console.error(e.message);
  }
}
run();
