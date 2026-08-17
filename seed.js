import { PGlite } from '@electric-sql/pglite';
import bcrypt from 'bcryptjs';

async function seed() {
  const db = new PGlite('./pglite-data');
  await db.waitReady;
  
  // Create Demo Centre (Tenant 1)
  const tenantRes = await db.query(
    "INSERT INTO tenants (name, bis_licence, address) VALUES ($1, $2, $3) RETURNING id",
    ['Centre A (Delhi)', 'BHC/DEL/001', 'Demo Address Delhi']
  );
  const tenantId = tenantRes.rows[0].id;

  // Create Dummy User
  const pinHash = await bcrypt.hash('1234', 10);
  await db.query(
    "INSERT INTO users (tenant_id, name, role, pin_hash) VALUES ($1, $2, $3, $4)",
    [tenantId, 'Admin Delhi', 'admin', pinHash]
  );
  
  console.log('Seeded Dummy User and Centre!');
}

seed().catch(console.error);
