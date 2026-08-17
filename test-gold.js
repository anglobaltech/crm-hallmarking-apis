import { pool } from './src/db.js';
async function run() {
  try {
    const res = await pool.query(`
      SELECT column_name
      FROM information_schema.columns 
      WHERE table_name = 'gold_exchanges'
    `);
    console.log("gold_exchanges:", res.rows.map(r => r.column_name));
  } catch (e) {
    console.error(e.message);
  }
}
run();
