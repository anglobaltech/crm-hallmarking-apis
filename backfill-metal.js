import { pool } from './src/db.js';

async function backfillMetal() {
  try {
    await pool.query("UPDATE fire_assays SET metal = 'Gold' WHERE metal IS NULL");
    await pool.query("UPDATE gold_exchanges SET metal = 'Gold' WHERE metal IS NULL");
    console.log("Successfully backfilled metal to Gold for all old entries.");
    process.exit(0);
  } catch (err) {
    console.error("Error backfilling:", err);
    process.exit(1);
  }
}

backfillMetal();
