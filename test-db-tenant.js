import { pool } from './src/db.js';
async function test() {
  try {
    const res = await pool.query("SELECT data_type FROM information_schema.columns WHERE table_name = 'laser_jobs' AND column_name = 'tenant_id'");
    console.log('tenant_id type:', res.rows[0].data_type);
  } catch(e) { 
    console.error('Error:', e.message);
  }
}
test();
