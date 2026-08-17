import { pool } from './src/db.js';
async function test() {
  const o = await pool.query(`SELECT status, COUNT(*) FROM articles GROUP BY status`);
  console.log('Statuses:', o.rows);
  process.exit(0);
}
test();
