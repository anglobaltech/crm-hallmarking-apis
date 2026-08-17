import { pool } from './src/db.js';
async function fix() {
  try {
    const res = await pool.query(`
      SELECT table_name 
      FROM information_schema.columns 
      WHERE column_name = 'tenant_id' AND table_schema = 'public'
    `);
    
    for (const row of res.rows) {
      const table = row.table_name;
      console.log('Fixing table:', table);
      await pool.query(`ALTER TABLE ${table} ALTER COLUMN tenant_id SET DEFAULT current_setting('app.current_tenant_id', true)::INTEGER`);
    }
    console.log('Done fixing all tables.');
    process.exit(0);
  } catch(e) { 
    console.error('Error:', e);
    process.exit(1);
  }
}
fix();
