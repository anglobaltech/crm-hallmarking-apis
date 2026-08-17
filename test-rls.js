import { checkDatabase, pool, tenantStorage } from './src/db.js';

async function test() {
  await checkDatabase();
  
  // Create tenants
  const t1 = await pool.query("INSERT INTO tenants (name) VALUES ('Test 1') RETURNING id");
  const t2 = await pool.query("INSERT INTO tenants (name) VALUES ('Test 2') RETURNING id");
  const id1 = t1.rows[0].id;
  const id2 = t2.rows[0].id;

  // Insert test rows for both tenants
  await pool.query(`INSERT INTO laser_jobs (tenant_id, jeweller_name, article_type, material) VALUES (${id1}, 'Jeweller 1', 'Ring', 'Gold')`);
  await pool.query(`INSERT INTO laser_jobs (tenant_id, jeweller_name, article_type, material) VALUES (${id2}, 'Jeweller 2', 'Chain', 'Gold')`);

  // Query as tenant 1
  await tenantStorage.run(id1, async () => {
    const res = await pool.query("SELECT * FROM laser_jobs");
    console.log(`Tenant ${id1} sees:`, res.rows.length, "rows (Should be 1)");
  });

  // Query as tenant 2
  await tenantStorage.run(id2, async () => {
    const res = await pool.query("SELECT * FROM laser_jobs");
    console.log(`Tenant ${id2} sees:`, res.rows.length, "rows (Should be 1)");
  });
}

test().catch(console.error);
