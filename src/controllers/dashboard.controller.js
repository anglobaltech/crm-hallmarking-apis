import { pool } from '../db.js';

export const getDashboardStats = async (req, res, next) => {
  try {
    const from = req.query.from;
    const to = req.query.to;
    const today = from ? from : '2000-01-01';
    const toDate = to ? to : (from ? from : '2100-01-01');

    const [jewellers, laser, xrf, soldering, fire, exchange, workflow, master_command] = await Promise.all([
      pool.query(`
        SELECT
          COUNT(*) AS total,
          0 AS active,
          0 AS expiring
        FROM jewellers
      `),
      pool.query(`
        SELECT
          COUNT(*) FILTER (WHERE DATE(created_at) >= $1 AND DATE(created_at) <= $2) AS today_jobs,
          COALESCE(SUM(pieces) FILTER (WHERE DATE(created_at) >= $1 AND DATE(created_at) <= $2), 0) AS today_pieces,
          COUNT(*) FILTER (WHERE status='Pending') AS pending,
          COALESCE(SUM(charges) FILTER (WHERE DATE(created_at) >= $1 AND DATE(created_at) <= $2), 0) AS today_revenue
        FROM laser_jobs
      `, [today, toDate]),
      pool.query(`
        SELECT
          COUNT(*) FILTER (WHERE DATE(created_at) >= $1 AND DATE(created_at) <= $2) AS today_tests,
          COUNT(*) FILTER (WHERE result='Pass') AS pass_count,
          COUNT(*) FILTER (WHERE result='Fail') AS fail_count,
          COALESCE(SUM(charges) FILTER (WHERE DATE(created_at) >= $1 AND DATE(created_at) <= $2), 0) AS today_revenue
        FROM xrf_tests
      `, [today, toDate]),
      pool.query(`
        SELECT
          COUNT(*) FILTER (WHERE status='In Progress') AS active,
          COUNT(*) FILTER (WHERE status='Pending') AS pending,
          COALESCE(SUM(charges) FILTER (WHERE DATE(created_at) >= $1 AND DATE(created_at) <= $2), 0) AS today_revenue
        FROM soldering_jobs
      `, [today, toDate]),
      pool.query(`
        SELECT
          COUNT(*) FILTER (WHERE DATE(created_at) >= $1 AND DATE(created_at) <= $2) AS today_assays,
          COUNT(*) FILTER (WHERE result='Pass') AS pass_count,
          COALESCE(SUM(charges) FILTER (WHERE DATE(created_at) >= $1 AND DATE(created_at) <= $2), 0) AS today_revenue
        FROM fire_assays
      `, [today, toDate]),
      pool.query(`
        SELECT
          COUNT(*) FILTER (WHERE DATE(created_at) >= $1 AND DATE(created_at) <= $2) AS today_txns,
          COALESCE(SUM(total_value) FILTER (WHERE DATE(created_at) >= $1 AND DATE(created_at) <= $2), 0) AS today_value,
          COALESCE(SUM(total_value) FILTER (WHERE exchange_type='Buy'), 0) AS total_buy,
          COALESCE(SUM(total_value) FILTER (WHERE exchange_type='Sell'), 0) AS total_sell
        FROM gold_exchanges
      `, [today, toDate]),
      pool.query(`
        SELECT
          COUNT(*) FILTER (WHERE status='Intake') AS intake,
          COUNT(*) FILTER (WHERE status='Weighing') AS weighing,
          COUNT(*) FILTER (WHERE status='Imaging') AS imaging,
          COUNT(*) FILTER (WHERE status='In XRF') AS xrf,
          COUNT(*) FILTER (WHERE status='Pending HUID' OR status='HUID Tagged') AS huid,
          COUNT(*) FILTER (WHERE status='Delivered') AS delivery
        FROM article_tracking
      `),
      pool.query(`
        SELECT
          (SELECT COUNT(*) FROM article_tracking WHERE DATE(created_at) >= $1 AND DATE(created_at) <= $2) as intake_today,
          (SELECT COUNT(*) FROM xrf_tests WHERE DATE(created_at) >= $1 AND DATE(created_at) <= $2) as xrf_today,
          (SELECT COUNT(*) FROM laser_jobs WHERE DATE(created_at) >= $1 AND DATE(created_at) <= $2) as laser_today,
          (SELECT COUNT(*) FROM soldering_jobs WHERE DATE(created_at) >= $1 AND DATE(created_at) <= $2) as soldering_today,
          (SELECT COUNT(*) FROM fire_assays WHERE DATE(created_at) >= $1 AND DATE(created_at) <= $2) as fire_today,
          (SELECT COUNT(*) FROM gold_exchanges WHERE DATE(created_at) >= $1 AND DATE(created_at) <= $2) as exchange_today,
          
          (SELECT COUNT(*) FROM article_tracking WHERE status IN ('HUID Tagged', 'Delivered', 'Completed') AND DATE(updated_at) >= $1 AND DATE(updated_at) <= $2) as huid_completed,
          (SELECT COUNT(*) FROM article_tracking WHERE status = 'Rejected' AND DATE(updated_at) >= $1 AND DATE(updated_at) <= $2) as huid_rejected,
          (SELECT COUNT(*) FROM xrf_tests WHERE result = 'Pass' AND DATE(updated_at) >= $1 AND DATE(updated_at) <= $2) as xrf_completed,
          (SELECT COUNT(*) FROM laser_jobs WHERE status = 'Completed' AND DATE(updated_at) >= $1 AND DATE(updated_at) <= $2) as laser_completed,
          (SELECT COUNT(*) FROM soldering_jobs WHERE status = 'Completed' AND DATE(updated_at) >= $1 AND DATE(updated_at) <= $2) as soldering_completed,
          (SELECT COUNT(*) FROM fire_assays WHERE result = 'Pass' AND DATE(updated_at) >= $1 AND DATE(updated_at) <= $2) as fire_completed,
          (SELECT COUNT(*) FROM gold_exchanges WHERE status = 'Completed' AND DATE(updated_at) >= $1 AND DATE(updated_at) <= $2) as exchange_completed
      `, [today, toDate])
    ]);

    const totalRevenue =
      parseFloat(laser.rows[0].today_revenue) +
      parseFloat(xrf.rows[0].today_revenue) +
      parseFloat(soldering.rows[0].today_revenue) +
      parseFloat(fire.rows[0].today_revenue);

    res.json({
      jewellers: jewellers.rows[0],
      laser: laser.rows[0],
      xrf: xrf.rows[0],
      soldering: soldering.rows[0],
      fire: fire.rows[0],
      exchange: exchange.rows[0],
      workflow: workflow.rows[0],
      master_command: master_command.rows[0],
      today_revenue: totalRevenue,
    });
  } catch (err) { next(err); }
};

export const getMonthlyRevenue = async (_req, res, next) => {
  try {
    const r = await pool.query(`
      SELECT
        TO_CHAR(month_date, 'Mon') AS month,
        EXTRACT(MONTH FROM month_date) AS month_num,
        COALESCE(SUM(laser_rev + xrf_rev + sol_rev + fire_rev), 0) AS total
      FROM (
        SELECT generate_series(
          DATE_TRUNC('year', NOW()),
          DATE_TRUNC('month', NOW()),
          '1 month'::interval
        ) AS month_date
      ) months
      LEFT JOIN (
        SELECT
          DATE_TRUNC('month', job_date) AS m,
          SUM(charges) AS laser_rev,
          0 AS xrf_rev, 0 AS sol_rev, 0 AS fire_rev
        FROM laser_jobs GROUP BY m
        UNION ALL
        SELECT DATE_TRUNC('month', test_date), 0, SUM(charges), 0, 0 FROM xrf_tests GROUP BY 1
        UNION ALL
        SELECT DATE_TRUNC('month', job_date), 0, 0, SUM(charges), 0 FROM soldering_jobs GROUP BY 1
        UNION ALL
        SELECT DATE_TRUNC('month', assay_date), 0, 0, 0, SUM(charges) FROM fire_assays GROUP BY 1
      ) revenue ON revenue.m = month_date
      GROUP BY month_date
      ORDER BY month_date
    `);
    res.json(r.rows);
  } catch (err) { next(err); }
};

export const getActivityFeed = async (req, res, next) => {
  try {
    const from = req.query.from;
    const to = req.query.to;
    const today = from ? from : '2000-01-01';
    const toDate = to ? to : (from ? from : '2100-01-01');
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';

    let searchFilter = '';
    const params = [today, toDate];
    let countParams = [today, toDate];
    let idx = 3;

    if (search) {
      searchFilter = `AND (jeweller_name ILIKE $${idx} OR detail ILIKE $${idx} OR type ILIKE $${idx})`;
      params.push(`%${search}%`);
      countParams.push(`%${search}%`);
      idx++;
    }

    const baseQuery = `
      SELECT a.id, 'Article Intake' AS type, o.customer_name AS jeweller_name,
             CONCAT(a.article_code, ' · ', a.article_type, ' · ', a.metal, ' · ', COALESCE(a.declared_purity, 'N/A'), ' · ', COALESCE(a.gross_weight::TEXT, '?'), 'g') AS detail,
             a.created_at, a.status
      FROM article_tracking a
      LEFT JOIN orders o ON a.order_id = o.id
      WHERE DATE(a.created_at) >= $1 AND DATE(a.created_at) <= $2
      UNION ALL
      SELECT id, 'Laser Cutting' AS type, jeweller_name, 
             CONCAT(article_type, ' · ', material, ' · ', pieces, ' pcs') AS detail,
             created_at, status
      FROM laser_jobs
      WHERE DATE(created_at) >= $1 AND DATE(created_at) <= $2
      UNION ALL
      SELECT id, 'XRF Test', jeweller_name,
             CONCAT(article_type, ' · ', tested_purity, '% purity') AS detail,
             created_at, result AS status
      FROM xrf_tests
      WHERE DATE(created_at) >= $1 AND DATE(created_at) <= $2
      UNION ALL
      SELECT id, 'Soldering', jeweller_name,
             CONCAT(article_type, ' · ', COALESCE(issue, 'repair')), created_at, status
      FROM soldering_jobs
      WHERE DATE(created_at) >= $1 AND DATE(created_at) <= $2
      UNION ALL
      SELECT id, 'Fire Assay', jeweller_name,
             CONCAT(article_type, ' · ', COALESCE(final_purity::TEXT, '?'), '% purity'), created_at, result AS status
      FROM fire_assays
      WHERE DATE(created_at) >= $1 AND DATE(created_at) <= $2
      UNION ALL
      SELECT id, 'Gold Exchange', jeweller_name,
             CONCAT(exchange_type, ' · ', COALESCE(net_weight::TEXT, '?'), 'g · ₹', COALESCE(total_value::TEXT, '?')),
             created_at, status
      FROM gold_exchanges
      WHERE DATE(created_at) >= $1 AND DATE(created_at) <= $2
    `;

    const countQuery = `
      SELECT COUNT(*) FROM (${baseQuery}) AS combined 
      WHERE 1=1 ${searchFilter}
    `;

    const dataQuery = `
      SELECT * FROM (${baseQuery}) AS combined 
      WHERE 1=1 ${searchFilter}
      ORDER BY created_at DESC 
      LIMIT $${idx} OFFSET $${idx + 1}
    `;

    params.push(limit, offset);

    const countRes = await pool.query(countQuery, countParams);
    const r = await pool.query(dataQuery, params);

    res.json({ data: r.rows, total: parseInt(countRes.rows[0].count) });
  } catch (err) { 
    console.error('getActivityFeed error:', err);
    next(err); 
  }
};

export const deleteActivity = async (req, res, next) => {
  try {
    const { type, id } = req.params;
    
    let table;
    switch(type) {
      case 'Article Intake': table = 'article_tracking'; break;
      case 'Laser Cutting': table = 'laser_jobs'; break;
      case 'XRF Test': table = 'xrf_tests'; break;
      case 'Soldering': table = 'soldering_jobs'; break;
      case 'Fire Assay': table = 'fire_assays'; break;
      case 'Gold Exchange': table = 'gold_exchanges'; break;
      default: return res.status(400).json({ error: 'Invalid activity type' });
    }
    
    await pool.query(`DELETE FROM ${table} WHERE id = $1`, [id]);
    res.json({ success: true, message: 'Activity deleted successfully' });
  } catch (err) { next(err); }
};

export const getDailyReportStats = async (req, res, next) => {
  try {
    const from = req.query.from;
    const to = req.query.to;
    const today = from ? from : '2000-01-01';
    const toDate = to ? to : (from ? from : '2100-01-01');

    const [stats, weekly, purity] = await Promise.all([
      pool.query(`
        SELECT 
          (SELECT COUNT(*) FROM article_tracking WHERE DATE(created_at) >= $1 AND DATE(created_at) <= $2) as articles_received,
          (SELECT COUNT(*) FROM article_tracking WHERE DATE(created_at) >= $1 AND DATE(created_at) <= $2 AND (huid IS NOT NULL OR status = 'HUID Tagged')) as huid_tagged,
          (SELECT COALESCE(SUM(gross_weight), 0) FROM article_tracking WHERE metal ILIKE 'Gold' AND DATE(created_at) >= $1 AND DATE(created_at) <= $2) as gold_received,
          (SELECT COALESCE(SUM(gross_weight), 0) FROM article_tracking WHERE metal ILIKE 'Silver' AND DATE(created_at) >= $1 AND DATE(created_at) <= $2) as silver_received,
          (SELECT COALESCE(SUM(grand_total), 0) FROM invoices WHERE DATE(invoice_date) >= $1 AND DATE(invoice_date) <= $2) as revenue,
          (SELECT COUNT(*) FROM jewellers WHERE DATE(created_at) = CURRENT_DATE - INTERVAL '1 day') as jewellers_yesterday,
          (SELECT COUNT(*) FROM laser_jobs WHERE status='Completed' AND DATE(job_date) >= $1 AND DATE(job_date) <= $2) as laser_completed,
          (SELECT COUNT(*) FROM xrf_tests WHERE DATE(test_date) >= $1 AND DATE(test_date) <= $2) as xrf_assaying,
          (SELECT COALESCE(SUM(net_weight), 0) FROM article_tracking WHERE DATE(created_at) >= $1 AND DATE(created_at) <= $2) as net_weight_today,
          (SELECT COUNT(*) FROM soldering_jobs WHERE DATE(job_date) >= $1 AND DATE(job_date) <= $2) as soldering_today,
          (SELECT COALESCE(ROUND(EXTRACT(EPOCH FROM AVG(updated_at - created_at))/60), 24) FROM article_tracking WHERE status != 'Pending' AND updated_at IS NOT NULL AND DATE(created_at) >= $1 AND DATE(created_at) <= $2) as avg_turnaround
      `, [today, toDate]),
      
      pool.query(`
        SELECT 
          TO_CHAR(DATE(created_at), 'Dy') as day, 
          COALESCE(SUM(CASE WHEN metal ILIKE 'Gold' THEN gross_weight ELSE 0 END), 0) as gold_weight,
          COALESCE(SUM(CASE WHEN metal ILIKE 'Silver' THEN gross_weight ELSE 0 END), 0) as silver_weight
        FROM article_tracking 
        WHERE created_at >= CURRENT_DATE - INTERVAL '6 days' 
        GROUP BY DATE(created_at) 
        ORDER BY DATE(created_at)
      `),

      pool.query(`
        SELECT 
          COALESCE(declared_purity, 'Unknown') as label, 
          COUNT(*) as count 
        FROM article_tracking 
        WHERE DATE(created_at) >= $1 AND DATE(created_at) <= $2
        GROUP BY COALESCE(declared_purity, 'Unknown')
      `, [today, toDate])
    ]);

    const recentActivity = await pool.query(`
      SELECT a.id, 'Article Intake' as service, o.customer_name as customer, 
             CONCAT(a.article_code, ' - ', a.article_type, ' - ', a.metal, ' - ', COALESCE(a.declared_purity, 'N/A'), ' - ', COALESCE(a.gross_weight::TEXT, '0'), 'g') as details, 
             TO_CHAR(a.created_at, 'DD Mon, hh:mi am') as time, a.status, a.created_at 
      FROM article_tracking a
      LEFT JOIN orders o ON a.order_id = o.id
      WHERE DATE(a.created_at) >= $1 AND DATE(a.created_at) <= $2
      
      UNION ALL
      
      SELECT id, 'XRF Test' as service, jeweller_name as customer, 
             CONCAT(article_type, ' - ', tested_purity, '% purity') as details, 
             TO_CHAR(created_at, 'DD Mon, hh:mi am') as time, result as status, created_at 
      FROM xrf_tests
      WHERE DATE(created_at) >= $1 AND DATE(created_at) <= $2
      
      UNION ALL
      
      SELECT id, 'Laser Cutting' as service, jeweller_name as customer, 
             CONCAT(article_type, ' - ', material, ' - ', pieces, ' pcs') as details, 
             TO_CHAR(created_at, 'DD Mon, hh:mi am') as time, status, created_at 
      FROM laser_jobs
      WHERE DATE(created_at) >= $1 AND DATE(created_at) <= $2
      
      UNION ALL
      
      SELECT id, 'Soldering' as service, jeweller_name as customer, 
             CONCAT(article_type, ' - ', COALESCE(issue, 'repair')) as details, 
             TO_CHAR(created_at, 'DD Mon, hh:mi am') as time, status, created_at 
      FROM soldering_jobs
      WHERE DATE(created_at) >= $1 AND DATE(created_at) <= $2
      
      UNION ALL
      
      SELECT id, 'Fire Assay' as service, jeweller_name as customer, 
             CONCAT(article_type, ' - ', COALESCE(final_purity::TEXT, '?'), '% purity') as details, 
             TO_CHAR(created_at, 'DD Mon, hh:mi am') as time, result as status, created_at 
      FROM fire_assays
      WHERE DATE(created_at) >= $1 AND DATE(created_at) <= $2
      
      UNION ALL
      
      SELECT id, 'Gold Exchange' as service, jeweller_name as customer, 
             CONCAT(exchange_type, ' - ', COALESCE(net_weight::TEXT, '?'), 'g - ₹', COALESCE(total_value::TEXT, '?')) as details, 
             TO_CHAR(created_at, 'DD Mon, hh:mi am') as time, status, created_at 
      FROM gold_exchanges
      WHERE DATE(created_at) >= $1 AND DATE(created_at) <= $2
      
      ORDER BY created_at DESC
      LIMIT 15
    `, [today, toDate]);

    res.json({
      stats: stats.rows[0],
      weekly: weekly.rows,
      purity: purity.rows,
      recentActivity: recentActivity.rows
    });
  } catch (err) { next(err); }
};

export const updateActivityStatus = async (req, res, next) => {
  try {
    const { type, id } = req.params;
    const { status } = req.body;
    let table;
    let statusCol = 'status';
    switch(type) {
      case 'Article Intake': table = 'article_tracking'; break;
      case 'Laser Cutting': table = 'laser_jobs'; break;
      case 'XRF Test': table = 'xrf_tests'; statusCol = 'result'; break;
      case 'Soldering': table = 'soldering_jobs'; break;
      case 'Fire Assay': table = 'fire_assays'; statusCol = 'result'; break;
      case 'Gold Exchange': table = 'gold_exchanges'; break;
      default: return res.status(400).json({ error: 'Invalid type' });
    }
    await pool.query(`UPDATE ${table} SET ${statusCol} = $1, updated_at = NOW() WHERE id = $2`, [status, id]);
    res.json({ success: true });
  } catch (err) { next(err); }
};
