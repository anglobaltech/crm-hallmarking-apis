import { pool } from './src/db.js';
async function test() {
  try {
    const r = await pool.query(`
      SELECT id, 'Article Intake' AS type, customer_name AS jeweller_name,
             CONCAT(total_articles, ' articles · ', COALESCE(gross_weight::TEXT, '?'), 'g') AS detail,
             created_at, status
      FROM orders
      UNION ALL
      SELECT id, 'Laser Cutting' AS type, jeweller_name, 
             CONCAT(article_type, ' · ', material, ' · ', pieces, ' pcs') AS detail,
             created_at, status
      FROM laser_jobs
      UNION ALL
      SELECT id, 'XRF Test', jeweller_name,
             CONCAT(article_type, ' · ', tested_purity, '% purity') AS detail,
             created_at, result AS status
      FROM xrf_tests
      UNION ALL
      SELECT id, 'Soldering', jeweller_name,
             CONCAT(article_type, ' · ', COALESCE(issue, 'repair')), created_at, status
      FROM soldering_jobs
      UNION ALL
      SELECT id, 'Fire Assay', jeweller_name,
             CONCAT(article_type, ' · ', COALESCE(purity::TEXT, '?'), '% purity'), created_at, result AS status
      FROM fire_assays
      UNION ALL
      SELECT id, 'Gold Exchange', jeweller_name,
             CONCAT(txn_type, ' · ', COALESCE(net_weight::TEXT, '?'), 'g · ₹', COALESCE(final_amount::TEXT, '?')),
             created_at, status
      FROM gold_exchanges
      ORDER BY created_at DESC
      LIMIT 1000
    `);
    console.log("Success! Returned rows: ", r.rows.length);
  } catch (err) {
    console.error("ERROR:", err.message);
  }
}
test();
