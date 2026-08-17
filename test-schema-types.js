import { pool } from './src/db.js';
async function run() {
  try {
    const res = await pool.query(`
      SELECT table_name, data_type 
      FROM information_schema.columns 
      WHERE column_name = 'tenant_id' AND table_schema = 'public'
    `);
    console.log(res.rows);
  } catch (e) {
    console.error(e.message);
  }
}
run();
