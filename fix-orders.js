import { pool } from './src/db.js';
async function fix() {
  try {
    await pool.query('ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255)');
    await pool.query('ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_mobile VARCHAR(50)');
    console.log('Fixed orders schema');
  } catch(e) { console.error(e.message); }
}
fix();
