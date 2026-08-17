import { pool } from './src/db.js';

async function test() {
  try {
    const today = new Date().toISOString().split('T')[0];
    const res = await pool.query(`
        SELECT
          COUNT(*) FILTER (WHERE status='In Progress') AS active,
          COUNT(*) FILTER (WHERE status='Pending') AS pending,
          COALESCE(SUM(charges) FILTER (WHERE job_date=$1), 0) AS today_revenue
        FROM soldering_jobs
      `, [today]);
      
    const r2 = await pool.query(`
        SELECT
          (SELECT COUNT(*) FROM article_tracking) as intake_today,
          (SELECT COUNT(*) FROM xrf_tests) as xrf_today,
          (SELECT COUNT(*) FROM laser_jobs) as laser_today,
          (SELECT COUNT(*) FROM soldering_jobs) as soldering_today,
          (SELECT COUNT(*) FROM fire_assays) as fire_today,
          (SELECT COUNT(*) FROM gold_exchanges) as exchange_today,
          
          (SELECT COUNT(*) FROM article_tracking WHERE status = 'HUID Tagged' OR status = 'Delivered') as huid_completed,
          (SELECT COUNT(*) FROM article_tracking WHERE status = 'Rejected') as huid_rejected,
          (SELECT COUNT(*) FROM xrf_tests WHERE result = 'Pass') as xrf_completed,
          (SELECT COUNT(*) FROM laser_jobs WHERE status = 'Completed') as laser_completed,
          (SELECT COUNT(*) FROM soldering_jobs WHERE status = 'Completed') as soldering_completed,
          (SELECT COUNT(*) FROM fire_assays WHERE status = 'Completed') as fire_completed,
          (SELECT COUNT(*) FROM gold_exchanges WHERE status = 'Completed') as exchange_completed
    `);
    
    console.log("Soldering:", res.rows);
    console.log("Master Command:", r2.rows);
  } catch (err) {
    console.error('SQL Error:', err);
  }
  process.exit(0);
}

test();
