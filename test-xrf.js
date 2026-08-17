import { pool } from './src/db.js';
async function run() {
  try {
    const res = await pool.query(`
      SELECT column_name
      FROM information_schema.columns 
      WHERE table_name = 'xrf_tests'
    `);
    console.log("xrf_tests:", res.rows.map(r => r.column_name));
  } catch (e) {
    console.error(e.message);
  }
}
run();
