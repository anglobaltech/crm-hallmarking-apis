import { pool } from './src/db.js';
async function run() {
  try {
    const res = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'laser_jobs'
    `);
    console.log("laser_jobs:", res.rows);
  } catch (e) {
    console.error(e.message);
  }
}
run();
