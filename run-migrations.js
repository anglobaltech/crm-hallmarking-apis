import { pool } from './src/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigrations() {
  try {
    console.log('Running migrations...');
    const migrationsDir = path.join(__dirname, 'migrations');
    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

    for (const file of files) {
      console.log(`Executing ${file}...`);
      const schemaSql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      await pool.exec(schemaSql);
      console.log(`Successfully applied ${file}`);
    }

    // Insert dummy tenants if they don't exist
    const res = await pool.query('SELECT count(*) FROM tenants');
    if (parseInt(res.rows[0].count) === 0) {
      console.log('Inserting dummy data...');
      
      await pool.query(`
        INSERT INTO tenants (name, bis_licence) VALUES 
        ('Centre A (Delhi)', 'BHC/DEL/001'),
        ('Centre B (Mumbai)', 'BHC/MUM/002')
      `);

      await pool.query(`
        INSERT INTO users (tenant_id, name, role, pin_hash) VALUES 
        (1, 'Admin Delhi', 'admin', '1234'),
        (2, 'Admin Mumbai', 'admin', '5678')
      `);

      await pool.query(`
        INSERT INTO articles (tenant_id, article_code, customer_name, type, weight, status) VALUES 
        (1, 'ART-DEL-001', 'Rahul', 'Ring', 5.5, 'Intake'),
        (1, 'ART-DEL-002', 'Priya', 'Chain', 12.0, 'In XRF'),
        (2, 'ART-MUM-001', 'Vikram', 'Bangle', 45.0, 'Pending HUID')
      `);

      await pool.query(`
        INSERT INTO reminders (tenant_id, title, description, due_date, equipment, last_cal_date, status, priority) VALUES
        (1, 'XRF-002 Calibration Due', 'Bruker S1 · Schedule with calibration lab', CURRENT_DATE + INTERVAL '3 days', 'XRF-002 (Bruker)', CURRENT_DATE - INTERVAL '90 days', 'Pending', 'High'),
        (1, 'BIS Licence Renewal', 'BHC/2021/04872 · Renew on Manak Portal', CURRENT_DATE + INTERVAL '42 days', NULL, NULL, 'Pending', 'High'),
        (1, 'Balance-001 Calibration', 'Mettler Toledo ME204', CURRENT_DATE + INTERVAL '77 days', 'Balance-001 (Mettler)', CURRENT_DATE - INTERVAL '15 days', 'Pending', 'Normal'),
        (1, 'Balance-002 Calibration', 'Ohaus Pioneer', CURRENT_DATE + INTERVAL '81 days', 'Balance-002 (Ohaus)', CURRENT_DATE - INTERVAL '10 days', 'Pending', 'Normal'),
        (1, 'XRF-001 Calibration', 'Olympus Vanta · Well within schedule', CURRENT_DATE + INTERVAL '88 days', 'XRF-001 (Olympus)', CURRENT_DATE - INTERVAL '2 days', 'Pending', 'Low')
        ON CONFLICT DO NOTHING;
      `);

      console.log('Dummy data inserted successfully.');
    } else {
      console.log('Data already exists, skipping seed.');
    }
  } catch (err) {
    console.error('Error running migrations:', err);
  } finally {
    process.exit(0);
  }
}

runMigrations();
