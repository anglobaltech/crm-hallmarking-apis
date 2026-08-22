import { pool } from './src/db.js';
async function run() {
  const result = await pool.query("SELECT polname, relname FROM pg_policy;");
  console.log(result.rows);
}
run();
//This is something new