import { pool, tenantStorage } from './src/db.js';
async function test() {
  tenantStorage.run(1, async () => {
    try {
      // test insert
      await pool.query("SET LOCAL app.current_tenant_id = '1'");
      const res = await pool.query("INSERT INTO laser_jobs (jeweller_name, article_type, material) VALUES ('Test', 'Unknown', 'Gold') RETURNING id");
      console.log('Inserted:', res.rows[0]);
    } catch(e) { 
      console.error('Error:', e.message);
    }
  });
}
test();
