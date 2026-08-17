import { PGlite } from '@electric-sql/pglite';

async function migrate() {
  const pool = new PGlite('./pglite-data');
  
  try {
    console.log('Migrating laser_jobs...');
    await pool.query(`ALTER TABLE laser_jobs ADD COLUMN IF NOT EXISTS address TEXT;`);
    await pool.query(`ALTER TABLE laser_jobs ADD COLUMN IF NOT EXISTS gst_number VARCHAR(100);`);
    await pool.query(`ALTER TABLE laser_jobs ADD COLUMN IF NOT EXISTS purity VARCHAR(50);`);

    console.log('Migrating soldering_jobs...');
    await pool.query(`ALTER TABLE soldering_jobs ADD COLUMN IF NOT EXISTS address TEXT;`);
    await pool.query(`ALTER TABLE soldering_jobs ADD COLUMN IF NOT EXISTS gst_number VARCHAR(100);`);
    await pool.query(`ALTER TABLE soldering_jobs ADD COLUMN IF NOT EXISTS purity VARCHAR(50);`);

    console.log('Migrating fire_assays...');
    await pool.query(`ALTER TABLE fire_assays ADD COLUMN IF NOT EXISTS address TEXT;`);
    await pool.query(`ALTER TABLE fire_assays ADD COLUMN IF NOT EXISTS gst_number VARCHAR(100);`);

    console.log('Migrating gold_exchanges...');
    await pool.query(`ALTER TABLE gold_exchanges ADD COLUMN IF NOT EXISTS address TEXT;`);
    await pool.query(`ALTER TABLE gold_exchanges ADD COLUMN IF NOT EXISTS gst_number VARCHAR(100);`);

    console.log('Migration successful.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await pool.close();
  }
}

migrate();
