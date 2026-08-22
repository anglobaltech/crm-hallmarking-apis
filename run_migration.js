import { checkDatabase, pool } from './src/db.js';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  console.log('Running checkDatabase manually...');
  await checkDatabase();
  console.log('Done migrating.');
  
  const tables = ['laser_jobs', 'soldering_jobs', 'fire_assays', 'gold_exchanges', 'xrf_tests', 'article_tracking'];
  for (const t of tables) {
    try {
      await pool.query(`UPDATE ${t} SET priority = 'Normal' WHERE priority IS NULL`);
      console.log(`Fixed NULL priorities in ${t}`);
    } catch(e) {
      console.log(`Skipped ${t}: ${e.message}`);
    }
  }
  
  process.exit(0);
}

run();
