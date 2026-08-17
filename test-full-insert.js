import { pool, tenantStorage } from './src/db.js';
async function test() {
  tenantStorage.run(1, async () => {
    try {
      const res = await pool.query(
        `INSERT INTO laser_jobs
          (job_date, jeweller_name, jeweller_id, phone, address, gst_number, article_type, material, purity,
           pieces, weight, huid, start_huid, end_huid, description, operator,
           charges, payment_mode, status, remarks)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
         RETURNING *`,
        ['NOW()', 'Demo', null, null, null, null,
         'Unknown', 'Gold', null, 1, 0,
         null, null, null, null, null,
         0, 'Cash', 'Pending', null]
      );
      console.log('Inserted laser job:', res.rows[0].id);
    } catch(e) { 
      console.error('Laser Job Insert Error:', e.message);
    }
  });
}
test();
