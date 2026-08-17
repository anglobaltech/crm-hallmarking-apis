import { pool } from './src/db.js';
async function run() {
  try {
    const res = await pool.query('SELECT bis_licence_expiry FROM tenants');
    console.log("Success");
  } catch (e) {
    console.error(e.message);
  }
}
run();
