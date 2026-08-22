import { pool } from './src/db.js';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const tables = ['laser_jobs', 'soldering_jobs', 'fire_assays', 'gold_exchanges', 'xrf_tests', 'article_tracking'];
  
  for (const t of tables) {
    try {
      await pool.query(`ALTER TABLE ${t} ADD COLUMN IF NOT EXISTS priority VARCHAR(50)`);
      console.log(`Added priority to ${t}`);
      await pool.query(`UPDATE ${t} SET priority = 'Normal' WHERE priority IS NULL`);
      console.log(`Fixed NULL priorities in ${t}`);
    } catch(e) {
      console.log(`Error on ${t}: ${e.message}`);
    }
  }
  
  process.exit(0);
}

run();
