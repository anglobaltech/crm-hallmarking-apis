import { pool } from './src/db.js';
async function fix() {
  try {
    await pool.query('ALTER TABLE invoices ADD COLUMN IF NOT EXISTS subtotal NUMERIC(10,2) DEFAULT 0');
    await pool.query('ALTER TABLE invoices ADD COLUMN IF NOT EXISTS sgst NUMERIC(10,2) DEFAULT 0');
    await pool.query('ALTER TABLE invoices ADD COLUMN IF NOT EXISTS cgst NUMERIC(10,2) DEFAULT 0');
    await pool.query('ALTER TABLE invoices ADD COLUMN IF NOT EXISTS igst NUMERIC(10,2) DEFAULT 0');
    console.log('Fixed invoices schema');
  } catch(e) {
    console.error(e.message);
  }
}
fix();
