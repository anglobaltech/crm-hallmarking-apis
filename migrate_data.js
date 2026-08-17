import { PGlite } from '@electric-sql/pglite';
import pg from 'pg';

const pglite = new PGlite('./pglite-data');
const pool = new pg.Pool({
  connectionString: 'postgresql://postgres.htophcpqqswzjpellnls:Anglobalservices@249@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true'
});

const tables = [
  'tenants',
  'users',
  'customers',
  'orders',
  'article_tracking',
  'billing',
  'reminders',
  'invoices',
  'invoice_items',
  'laser_jobs',
  'soldering_jobs',
  'fire_assays',
  'gold_exchanges',
  'xrf_tests',
  'gold_rates',
  'expenses',
  'staff',
  'compliance_docs',
  'devices'
];

async function migrate() {
  console.log('Starting data migration...');
  for (const table of tables) {
    try {
      console.log(`Migrating table: ${table}...`);
      let dataRes;
      try { dataRes = await pglite.query(`SELECT * FROM ${table}`); } 
      catch (err) { console.log(`Skipping ${table}`); continue; }
      
      const rows = dataRes.rows;
      if (rows.length === 0) continue;
      const columns = Object.keys(rows[0]);
      for (const row of rows) {
        const values = columns.map(c => row[c]);
        const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
        try {
          await pool.query(
            `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`,
            values
          );
        } catch (insertErr) {
          if (insertErr.code !== '23505') console.error(`Error inserting into ${table}:`, insertErr.message);
        }
      }
      try { await pool.query(`SELECT setval(pg_get_serial_sequence('${table}', 'id'), COALESCE(MAX(id), 1) + 1) FROM ${table}`); } catch(e) {}
    } catch (err) { console.error(`Error migrating ${table}:`, err); }
  }
  console.log('Migration complete!');
  process.exit(0);
}
migrate();
