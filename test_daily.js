import { pool } from './src/db.js';

async function test() {
  try {
    const today = new Date().toISOString().split('T')[0];
    const res = await pool.query(`
        SELECT 
          (SELECT COUNT(*) FROM article_tracking WHERE DATE(created_at) = $1) as articles_received,
          (SELECT COUNT(*) FROM article_tracking WHERE DATE(created_at) = $1 AND (huid IS NOT NULL OR status = 'HUID Tagged')) as huid_tagged,
          (SELECT COALESCE(SUM(gross_weight), 0) FROM article_tracking WHERE DATE(created_at) = $1) as gold_received,
          (SELECT COALESCE(SUM(grand_total), 0) FROM invoices WHERE invoice_date = $1) as revenue,
          (SELECT COUNT(*) FROM jewellers WHERE DATE(created_at) = CURRENT_DATE - INTERVAL '1 day') as jewellers_yesterday,
          (SELECT COUNT(*) FROM laser_jobs WHERE status='Completed' AND DATE(job_date) = $1) as laser_completed,
          (SELECT COUNT(*) FROM xrf_tests WHERE DATE(test_date) = $1) as xrf_assaying,
          (SELECT COALESCE(SUM(net_weight), 0) FROM article_tracking WHERE DATE(created_at) = $1) as net_weight_today,
          (SELECT COUNT(*) FROM soldering_jobs WHERE DATE(job_date) = $1) as soldering_today
    `, [today]);
    console.log(res.rows);
  } catch (err) {
    console.error('SQL Error:', err);
  }
  process.exit(0);
}

test();
