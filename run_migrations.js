import { PGlite } from '@electric-sql/pglite';
import fs from 'fs';
import path from 'path';

async function migrate() {
  const db = new PGlite('./pglite-data');
  await db.waitReady;
  
  const files = [
    '001_initial_schema.sql',
    '002_services_schema.sql',
    '003_workflow_schema.sql',
    '004_finance_schema.sql',
    '005_compliance_schema.sql',
    '006_operations_schema.sql',
    '007_billing_upgrades.sql'
  ];

  for (const f of files) {
    const sql = fs.readFileSync(path.join('migrations', f), 'utf-8');
    console.log(`Running ${f}...`);
    await db.exec(sql); // Using exec for multiple statements
  }
  
  console.log('All migrations applied!');
}

migrate().catch(console.error);
