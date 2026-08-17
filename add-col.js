import { pool } from './src/db.js';
async function run() {
  try {
    await pool.query('ALTER TABLE tenants ADD COLUMN bis_licence_expiry DATE;');
    console.log("Added column successfully");
  } catch (e) {
    if (e.message.includes('already exists')) {
       console.log("Column already exists");
    } else {
       console.error("Error:", e.message);
    }
  }
}
run();
