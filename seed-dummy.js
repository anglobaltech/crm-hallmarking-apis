import { pool } from './src/db.js';
import bcrypt from 'bcryptjs';

async function seedDummyUser() {
  try {
    console.log("Starting seed...");
    // Create tenant
    const tenantRes = await pool.query(
      'INSERT INTO tenants (name, bis_licence, address) VALUES ($1, $2, $3) RETURNING id',
      ['Demo Centre (Fallback)', 'HM/C-1234567', 'Delhi, India']
    );
    const tenantId = tenantRes.rows[0].id;
    console.log("Created tenant with ID:", tenantId);

    // Create user
    const pinHash = await bcrypt.hash('1234', 10);
    await pool.query(
      'INSERT INTO users (tenant_id, name, role, pin_hash) VALUES ($1, $2, $3, $4)',
      [tenantId, 'Admin Delhi', 'admin', pinHash]
    );
    console.log("Created dummy user 'Admin Delhi' with PIN '1234'");

  } catch (err) {
    console.error("Error seeding dummy user:", err.message);
  }
}

seedDummyUser();
