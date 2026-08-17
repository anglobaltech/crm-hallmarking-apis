import { pool } from './src/db.js';
async function run() {
  try {
    const res = await pool.query('SELECT device_token FROM devices');
    console.log("Devices exist");
  } catch (e) {
    console.error("Error:", e.message);
  }
}
run();
