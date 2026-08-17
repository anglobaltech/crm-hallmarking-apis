import { pool } from './src/db.js';

async function test() {
  try {
    const res = await pool.query(`
      SELECT a.id, 'Article Intake' AS type, o.customer_name AS jeweller_name,
             CONCAT(a.article_code, ' · ', a.article_type, ' · ', a.metal, ' · ', COALESCE(a.declared_purity, 'N/A'), ' · ', COALESCE(a.gross_weight::TEXT, '?'), 'g') AS detail,
             a.created_at, a.status
      FROM article_tracking a
      LEFT JOIN orders o ON a.order_id = o.id
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
             CONCAT(article_type, ' · ', COALESCE(final_purity::TEXT, '?'), '% purity'), created_at, result AS status
      FROM fire_assays
      UNION ALL
      SELECT id, 'Gold Exchange', jeweller_name,
             CONCAT(exchange_type, ' · ', COALESCE(net_weight::TEXT, '?'), 'g · ₹', COALESCE(total_value::TEXT, '?')),
             created_at, status
      FROM gold_exchanges
      ORDER BY created_at DESC
      LIMIT 10
    `);
    console.log(res.rows);
  } catch (err) {
    console.error('SQL Error:', err);
  }
  process.exit(0);
}

test();
