import { pool } from './src/db.js';
async function test() {
  const res = await pool.query(`SELECT column_default FROM information_schema.columns WHERE table_name='laser_jobs' AND column_name='tenant_id'`);
  console.log('Default:', res.rows[0]);
}
test();
