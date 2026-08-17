import { checkDatabase, pool } from './src/db.js';

async function run() {
  await checkDatabase();
  console.log('checkDatabase completed');
  process.exit(0);
}
run();
