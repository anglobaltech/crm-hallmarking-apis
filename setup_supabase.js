import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pool = new pg.Pool({
  connectionString: 'postgresql://postgres.htophcpqqswzjpellnls:Anglobalservices@249@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true'
});

async function run() {
  try {
    const migrationsDir = path.join(__dirname, 'migrations');
    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

    for (const file of files) {
      console.log(`Executing ${file}...`);
      const schemaSql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      await pool.query(schemaSql);
      console.log(`Successfully applied ${file}`);
    }
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
run();
