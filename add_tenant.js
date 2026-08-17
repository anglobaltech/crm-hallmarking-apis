import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsDir = path.join(__dirname, 'migrations');

const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));

for (const file of files) {
  let sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
  
  if (file === '001_initial_schema.sql') {
    // Add DROP POLICY IF EXISTS
    sql = sql.replace(/CREATE POLICY tenant_isolation_users/g, 'DROP POLICY IF EXISTS tenant_isolation_users ON users;\nCREATE POLICY tenant_isolation_users');
    sql = sql.replace(/CREATE POLICY tenant_isolation_articles/g, 'DROP POLICY IF EXISTS tenant_isolation_articles ON articles;\nCREATE POLICY tenant_isolation_articles');
    fs.writeFileSync(path.join(migrationsDir, file), sql);
    continue;
  }

  // Add tenant_id
  const tables = [];
  sql = sql.replace(/CREATE TABLE IF NOT EXISTS (\w+) \(\s*(id SERIAL PRIMARY KEY,)/g, (match, tableName, p2) => {
    tables.push(tableName);
    return `CREATE TABLE IF NOT EXISTS ${tableName} (\n    id SERIAL PRIMARY KEY,\n    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,`;
  });

  if (tables.length > 0) {
    let rlsContent = '\n\n-- ==========================================\n-- ROW-LEVEL SECURITY (RLS) SETUP\n-- ==========================================\n\n';
    for (const table of tables) {
      rlsContent += `ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;\n`;
      rlsContent += `DROP POLICY IF EXISTS tenant_isolation_${table} ON ${table};\n`;
      rlsContent += `CREATE POLICY tenant_isolation_${table} ON ${table} FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', true)::INTEGER);\n`;
      rlsContent += `ALTER TABLE ${table} FORCE ROW LEVEL SECURITY;\n\n`;
    }
    
    if (!sql.includes('ROW-LEVEL SECURITY (RLS) SETUP')) {
      sql += rlsContent;
    }
    fs.writeFileSync(path.join(migrationsDir, file), sql);
    console.log(`Updated ${file} with ${tables.length} tables`);
  }
}
