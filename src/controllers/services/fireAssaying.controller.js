import { pool } from '../../db.js';
const db = (req) => pool;

export const getFireAssays = async (req, res, next) => {
  try {
    const { search = '', result: filterResult = 'All', page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    const params = [];
    let idx = 1;
    let where = 'WHERE 1=1';

    if (filterResult !== 'All') { where += ` AND result=$${idx++}`; params.push(filterResult); }
    if (search) {
      where += ` AND (jeweller_name ILIKE $${idx} OR sample_id ILIKE $${idx} OR id::text ILIKE $${idx})`;
      params.push(`%${search}%`); idx++;
    }

    const countRes = await db(req).query(`SELECT COUNT(*) FROM fire_assays ${where}`, params);
    const dataRes = await db(req).query(
      `SELECT * FROM fire_assays ${where} ORDER BY created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, limit, offset]
    );

    res.json({ data: dataRes.rows, total: parseInt(countRes.rows[0].count) });
  } catch (err) { next(err); }
};

export const getFireStats = async (_req, res, next) => {
  try {
    const r = await db(req).query(`
      SELECT
        COUNT(*) FILTER (WHERE assay_date = CURRENT_DATE) AS today_assays,
        COUNT(*) FILTER (WHERE result = 'Pass') AS pass_count,
        COUNT(*) FILTER (WHERE result = 'Fail') AS fail_count,
        COUNT(*) AS total,
        COALESCE(AVG(final_purity),0)::NUMERIC(6,2) AS avg_purity,
        COALESCE(SUM(charges) FILTER (WHERE assay_date = CURRENT_DATE), 0) AS today_revenue
      FROM fire_assays
    `);
    res.json(r.rows[0]);
  } catch (err) { next(err); }
};

export const getFireById = async (req, res, next) => {
  try {
    const r = await db(req).query('SELECT * FROM fire_assays WHERE id=$1', [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Assay not found' });
    res.json(r.rows[0]);
  } catch (err) { next(err); }
};

export const createFireAssay = async (req, res, next) => {
  try {
    const {
      assay_date, batch_no, jeweller_name, jeweller_id, phone, address, gst_number,
      article_type, pieces, sample_weight, declared_purity,
      silver_added, lead_foil_weight, cupel_weight, cornet_weight,
      final_purity, result, operator, charges, payment_mode, remarks, status
    } = req.body;

    if (!jeweller_name || !article_type) {
      return res.status(400).json({ error: 'jeweller_name and article_type are required' });
    }

    const r = await db(req).query(
      `INSERT INTO fire_assays
        (assay_date, batch_no, jeweller_name, jeweller_id, phone, address, gst_number,
         article_type, pieces, sample_weight, declared_purity,
         silver_added, lead_foil_weight, cupel_weight, cornet_weight,
         final_purity, result, operator, charges, payment_mode, remarks, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)
       RETURNING *`,
      [assay_date || new Date().toISOString().split('T')[0],
       batch_no || 'FA-AUTO', jeweller_name, jeweller_id || null, phone || null, address || null, gst_number || null,
       article_type, pieces || 1, sample_weight || null, declared_purity || null,
       silver_added || null, lead_foil_weight || null, cupel_weight || null, cornet_weight || null,
       final_purity || null, result || 'Pass', operator || null, charges || 0, payment_mode || 'Cash', remarks || null, status || 'Pending']
    );
    res.status(201).json(r.rows[0]);
  } catch (err) { next(err); }
};

export const updateFireAssay = async (req, res, next) => {
  try {
    const {
      assay_date, batch_no, jeweller_name, jeweller_id, phone, address, gst_number,
      article_type, pieces, sample_weight, declared_purity,
      silver_added, lead_foil_weight, cupel_weight, cornet_weight,
      final_purity, result, operator, charges, payment_mode, remarks, status
    } = req.body;

    const r = await db(req).query(
      `UPDATE fire_assays SET
        assay_date=$1, batch_no=$2, jeweller_name=$3, jeweller_id=$4, phone=$5, address=$6, gst_number=$7,
        article_type=$8, pieces=$9, sample_weight=$10, declared_purity=$11,
        silver_added=$12, lead_foil_weight=$13, cupel_weight=$14, cornet_weight=$15,
        final_purity=$16, result=$17, operator=$18, charges=$19, payment_mode=$20, remarks=$21, status=$22, updated_at=NOW()
       WHERE id=$23 RETURNING *`,
      [assay_date, batch_no, jeweller_name, jeweller_id || null, phone || null, address || null, gst_number || null,
       article_type, pieces || 1, sample_weight || null, declared_purity || null,
       silver_added || null, lead_foil_weight || null, cupel_weight || null, cornet_weight || null,
       final_purity || null, result || 'Pass', operator || null, charges || 0, payment_mode || 'Cash', remarks || null, status || 'Pending', req.params.id]
    );
    if (!r.rows.length) return res.status(404).json({ error: 'Assay not found' });
    res.json(r.rows[0]);
  } catch (err) { next(err); }
};

export const deleteFireAssay = async (req, res, next) => {
  try {
    const r = await db(req).query('DELETE FROM fire_assays WHERE id=$1 RETURNING id', [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Assay not found' });
    res.json({ success: true });
  } catch (err) { next(err); }
};
