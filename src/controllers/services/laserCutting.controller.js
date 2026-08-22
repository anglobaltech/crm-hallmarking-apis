import { pool } from '../../db.js';
const db = (req) => pool;

export const getLaserJobs = async (req, res, next) => {
  try {
    const { search = '', status = 'All', date_from, date_to, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    const params = [];
    let idx = 1;
    let where = 'WHERE 1=1';

    if (status !== 'All') { where += ` AND status=$${idx++}`; params.push(status); }
    if (date_from) { where += ` AND job_date>=$${idx++}`; params.push(date_from); }
    if (date_to) { where += ` AND job_date<=$${idx++}`; params.push(date_to); }
    if (search) {
      where += ` AND (jeweller_name ILIKE $${idx} OR id::text ILIKE $${idx} OR huid ILIKE $${idx})`;
      params.push(`%${search}%`); idx++;
    }

    const countRes = await db(req).query(`SELECT COUNT(*) FROM laser_jobs ${where}`, params);
    const result = await db(req).query(
      `SELECT * FROM laser_jobs ${where} ORDER BY created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, limit, offset]
    );

    res.json({ data: result.rows, total: parseInt(countRes.rows[0].count) });
  } catch (err) { next(err); }
};

export const getLaserStats = async (_req, res, next) => {
  try {
    const result = await db(req).query(`
      SELECT
        COUNT(*) FILTER (WHERE job_date = CURRENT_DATE) AS today_jobs,
        SUM(pieces) FILTER (WHERE job_date = CURRENT_DATE) AS today_pieces,
        COUNT(*) FILTER (WHERE status = 'Pending') AS pending,
        COALESCE(SUM(charges) FILTER (WHERE job_date = CURRENT_DATE), 0) AS today_revenue
      FROM laser_jobs
    `);
    res.json(result.rows[0]);
  } catch (err) { next(err); }
};

export const getLaserById = async (req, res, next) => {
  try {
    const result = await db(req).query('SELECT * FROM laser_jobs WHERE id=$1', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Job not found' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
};

export const createLaserJob = async (req, res, next) => {
  try {
    const {
      job_date, jeweller_name, jeweller_id, phone, address, gst_number, article_type, material, purity,
      pieces, weight, huid, start_huid, end_huid, description, operator,
      charges, payment_mode, status, remarks, priority
    } = req.body;

    if (!jeweller_name || !article_type || !material) {
      return res.status(400).json({ error: 'jeweller_name, article_type and material are required' });
    }

    const result = await db(req).query(
      `INSERT INTO laser_jobs
        (job_date, jeweller_name, jeweller_id, phone, address, gst_number, article_type, material, purity,
         pieces, weight, huid, start_huid, end_huid, description, operator,
         charges, payment_mode, status, remarks, priority)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)
       RETURNING *`,
      [job_date || 'NOW()', jeweller_name, jeweller_id || null, phone || null, address || null, gst_number || null,
       article_type || 'Unknown', material || 'Gold', purity || null, pieces || 1, weight || null,
       huid || null, start_huid || null, end_huid || null, description || null, operator || null,
       charges || 0, payment_mode || 'Cash', status || 'Pending', remarks || null, priority || null]
    );

    // Update jeweller huid_issued count if linked
    if (jeweller_id) {
      await db(req).query(
        `UPDATE jewellers SET huid_issued = huid_issued + $1, updated_at=NOW() WHERE id=$2`,
        [parseInt(pieces) || 1, jeweller_id]
      );
    }

    res.status(201).json(result.rows[0]);
  } catch (err) { 
    import('fs').then(fs => fs.writeFileSync('laser_error.log', err.stack || err.message));
    next(err); 
  }
};

export const updateLaserJob = async (req, res, next) => {
  try {
    const {
      job_date, jeweller_name, jeweller_id, phone, address, gst_number, article_type, material, purity,
      pieces, weight, huid, start_huid, end_huid, description, operator,
      charges, payment_mode, status, remarks, priority
    } = req.body;

    const result = await db(req).query(
      `UPDATE laser_jobs SET
        job_date=$1, jeweller_name=$2, jeweller_id=$3, phone=$4, address=$5, gst_number=$6, article_type=$7, material=$8, purity=$9,
        pieces=$10, weight=$11, huid=$12, start_huid=$13, end_huid=$14, description=$15, operator=$16,
        charges=$17, payment_mode=$18, status=$19, remarks=$20, priority=$21, updated_at=NOW()
       WHERE id=$22 RETURNING *`,
      [job_date, jeweller_name, jeweller_id || null, phone || null, address || null, gst_number || null, article_type || 'Unknown', material || 'Gold', purity || null,
       pieces || 1, weight || null, huid || null, start_huid || null, end_huid || null, description || null, operator || null,
       charges || 0, payment_mode || 'Cash', status || 'Pending', remarks || null, priority || null, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Job not found' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
};

export const deleteLaserJob = async (req, res, next) => {
  try {
    const result = await db(req).query('DELETE FROM laser_jobs WHERE id=$1 RETURNING id', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Job not found' });
    res.json({ success: true });
  } catch (err) { next(err); }
};
