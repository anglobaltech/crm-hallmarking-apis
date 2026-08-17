import { pool } from './src/db.js';
async function fix() {
  try {
    await pool.query('ALTER TABLE laser_jobs ADD COLUMN IF NOT EXISTS address TEXT, ADD COLUMN IF NOT EXISTS gst_number VARCHAR(100), ADD COLUMN IF NOT EXISTS purity VARCHAR(50)');
    await pool.query('ALTER TABLE soldering_jobs ADD COLUMN IF NOT EXISTS address TEXT, ADD COLUMN IF NOT EXISTS gst_number VARCHAR(100), ADD COLUMN IF NOT EXISTS purity VARCHAR(50)');
    await pool.query('ALTER TABLE fire_assays ADD COLUMN IF NOT EXISTS address TEXT, ADD COLUMN IF NOT EXISTS gst_number VARCHAR(100), ADD COLUMN IF NOT EXISTS purity VARCHAR(50)');
    await pool.query('ALTER TABLE gold_exchanges ADD COLUMN IF NOT EXISTS address TEXT, ADD COLUMN IF NOT EXISTS gst_number VARCHAR(100), ADD COLUMN IF NOT EXISTS purity VARCHAR(50)');
    
    // Also orders table since Intake was failing!
    // Wait, let's just run it for now.
    console.log('Fixed services tables schema');
  } catch(e) {
    console.error(e.message);
  }
}
fix();
