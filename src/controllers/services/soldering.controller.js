import { pool } from '../../db.js';
const db = (req) => pool;

export const getSolderingJobs = async (req, res, next) => {
  try {
    const { search = '', status = 'All', page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    const params = [];
    let idx = 1;
    let where = 'WHERE 1=1';

    if (status !== 'All') { where += ` AND status=$${idx++}`; params.push(status); }
    if (search) {
      where += ` AND (jeweller_name ILIKE $${idx} OR id::text ILIKE $${idx})`;
      params.push(`%${search}%`); idx++;
    }

    const countRes = await db(req).query(`SELECT COUNT(*) FROM soldering_jobs ${where}`, params);
    const dataRes = await db(req).query(
      `SELECT * FROM soldering_jobs ${where} ORDER BY created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, limit, offset]
    );

    res.json({ data: dataRes.rows, total: parseInt(countRes.rows[0].count) });
  } catch (err) { next(err); }
};

export const getSolderingStats = async (_req, res, next) => {
  try {
    const r = await db(req).query(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'In Progress') AS active,
        COUNT(*) FILTER (WHERE status = 'Pending') AS pending,
        COUNT(*) FILTER (WHERE status = 'Completed' AND job_date = CURRENT_DATE) AS completed_today,
        COALESCE(SUM(charges) FILTER (WHERE job_date = CURRENT_DATE), 0) AS today_revenue
      FROM soldering_jobs
    `);
    res.json(r.rows[0]);
  } catch (err) { next(err); }
};

export const getSolderingById = async (req, res, next) => {
  try {
    const r = await db(req).query('SELECT * FROM soldering_jobs WHERE id=$1', [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Job not found' });
    res.json(r.rows[0]);
  } catch (err) { next(err); }
};

export const createSolderingJob = async (req, res, next) => {
  try {
    const {
      job_date, jeweller_name, jeweller_id, phone, address, gst_number, article_type, material, purity,
      weight, huid, pieces, issue, issue_desc, solder_type, solder_weight,
      estimated_time, operator, delivery_date, status, charges, payment_mode, remarks
    } = req.body;

    if (!jeweller_name || !article_type) {
      return res.status(400).json({ error: 'jeweller_name and article_type are required' });
    }

    const r = await db(req).query(
      `INSERT INTO soldering_jobs
        (job_date, jeweller_name, jeweller_id, phone, address, gst_number, article_type, material, purity,
         weight, huid, pieces, issue, issue_desc, solder_type, solder_weight,
         estimated_time, operator, delivery_date, status, charges, payment_mode, remarks)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23)
       RETURNING *`,
      [job_date || new Date().toISOString().split('T')[0],
       jeweller_name, jeweller_id || null, phone || null, address || null, gst_number || null, article_type || 'Unknown', material || 'Gold', purity || null,
       weight || null, huid || null, pieces || 1, issue || null, issue_desc || null, solder_type || 'Easy',
       solder_weight || null, estimated_time || null, operator || null, delivery_date || null,
       status || 'Pending', charges || 0, payment_mode || 'Cash', remarks || null]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) { next(err); }
};

export const updateSolderingJob = async (req, res, next) => {
  try {
    const {
      job_date, jeweller_name, jeweller_id, phone, address, gst_number, article_type, material, purity,
      weight, huid, pieces, issue, issue_desc, solder_type, solder_weight,
      estimated_time, operator, delivery_date, status, charges, payment_mode, remarks
    } = req.body;

    const r = await db(req).query(
      `UPDATE soldering_jobs SET
        job_date=$1, jeweller_name=$2, jeweller_id=$3, phone=$4, address=$5, gst_number=$6, article_type=$7, material=$8, purity=$9,
        weight=$10, huid=$11, pieces=$12, issue=$13, issue_desc=$14, solder_type=$15,
        solder_weight=$16, estimated_time=$17, operator=$18, delivery_date=$19,
        status=$20, charges=$21, payment_mode=$22, remarks=$23, updated_at=NOW()
       WHERE id=$24 RETURNING *`,
      [job_date, jeweller_name, jeweller_id || null, phone || null, address || null, gst_number || null, article_type || 'Unknown', material || 'Gold', purity || null,
       weight || null, huid || null, pieces || 1, issue || null, issue_desc || null, solder_type || 'Easy',
       solder_weight || null, estimated_time || null, operator || null, delivery_date || null,
       status || 'Pending', charges || 0, payment_mode || 'Cash', remarks || null, req.params.id]
    );
    if (!r.rows.length) return res.status(404).json({ error: 'Job not found' });
    res.json(r.rows[0]);
  } catch (err) { next(err); }
};

export const deleteSolderingJob = async (req, res, next) => {
  try {
    const r = await db(req).query('DELETE FROM soldering_jobs WHERE id=$1 RETURNING id', [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Job not found' });
    res.json({ success: true });
  } catch (err) { next(err); }
};
