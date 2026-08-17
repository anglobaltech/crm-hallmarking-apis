import { pool } from './src/db.js';
async function run() {
  try {
    const res = await pool.query(`
      SELECT column_name
      FROM information_schema.columns 
      WHERE table_name = 'fire_assays'
    `);
    console.log("fire_assays:", res.rows.map(r => r.column_name));
  } catch (e) {
    console.error(e.message);
  }
}
run();
