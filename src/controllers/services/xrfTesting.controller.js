import { pool } from '../../db.js';
const db = (req) => pool;

export const getXrfTests = async (req, res, next) => {
  try {
    const { search = '', result: filterResult = 'All', date_from, date_to, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    const params = [];
    let idx = 1;
    let where = 'WHERE 1=1';

    if (filterResult !== 'All') { where += ` AND result=$${idx++}`; params.push(filterResult); }
    if (date_from) { where += ` AND test_date>=$${idx++}`; params.push(date_from); }
    if (date_to) { where += ` AND test_date<=$${idx++}`; params.push(date_to); }
    if (search) {
      where += ` AND (jeweller_name ILIKE $${idx} OR sample_id ILIKE $${idx} OR id::text ILIKE $${idx})`;
      params.push(`%${search}%`); idx++;
    }

    const countRes = await db(req).query(`SELECT COUNT(*) FROM xrf_tests ${where}`, params);
    const dataRes = await db(req).query(
      `SELECT * FROM xrf_tests ${where} ORDER BY created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, limit, offset]
    );

    res.json({ data: dataRes.rows, total: parseInt(countRes.rows[0].count) });
  } catch (err) { next(err); }
};

export const getXrfStats = async (_req, res, next) => {
  try {
    const r = await db(req).query(`
      SELECT
        COUNT(*) FILTER (WHERE test_date = CURRENT_DATE) AS today_tests,
        COUNT(*) FILTER (WHERE result = 'Pass') AS pass_count,
        COUNT(*) FILTER (WHERE result = 'Fail') AS fail_count,
        COUNT(*) AS total,
        COALESCE(AVG(tested_purity),0)::NUMERIC(6,2) AS avg_purity,
        COALESCE(SUM(charges) FILTER (WHERE test_date = CURRENT_DATE), 0) AS today_revenue
      FROM xrf_tests
    `);
    res.json(r.rows[0]);
  } catch (err) { next(err); }
};

export const getXrfById = async (req, res, next) => {
  try {
    const r = await db(req).query('SELECT * FROM xrf_tests WHERE id=$1', [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Test not found' });
    res.json(r.rows[0]);
  } catch (err) { next(err); }
};

export const createXrfTest = async (req, res, next) => {
  try {
    const {
      test_date, sample_id, jeweller_name, jeweller_id, phone, bis_license, address,
      article_type, huid, pieces, weight, declared_purity, machine,
      gold_pct, silver_pct, copper_pct, zinc_pct, other_pct,
      tested_purity, result, operator, charges, payment_mode, remarks, priority
    } = req.body;

    if (!jeweller_name || !article_type) {
      return res.status(400).json({ error: 'jeweller_name and article_type are required' });
    }

    const r = await db(req).query(
      `INSERT INTO xrf_tests
        (test_date, sample_id, jeweller_name, jeweller_id, phone, bis_license, address,
         article_type, huid, pieces, weight, declared_purity, machine,
         gold_pct, silver_pct, copper_pct, zinc_pct, other_pct,
         tested_purity, result, operator, charges, payment_mode, remarks, priority)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25)
       RETURNING *`,
      [test_date || 'NOW()', sample_id, jeweller_name, jeweller_id || null, phone, bis_license, address,
       article_type, huid, pieces || 1, weight || null, declared_purity || null, machine || 'XRF Analyzer',
       gold_pct || 0, silver_pct || 0, copper_pct || 0, zinc_pct || 0, other_pct || 0,
       tested_purity || null, result || 'Pass', operator, charges || 0, payment_mode || 'Cash', remarks, priority || null]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) { next(err); }
};

export const updateXrfTest = async (req, res, next) => {
  try {
    const {
      test_date, sample_id, jeweller_name, jeweller_id, phone, bis_license, address,
      article_type, huid, pieces, weight, declared_purity, machine,
      gold_pct, silver_pct, copper_pct, zinc_pct, other_pct,
      tested_purity, result, operator, charges, payment_mode, remarks, priority
    } = req.body;

    const r = await db(req).query(
      `UPDATE xrf_tests SET
        test_date=$1, sample_id=$2, jeweller_name=$3, jeweller_id=$4, phone=$5, bis_license=$6, address=$7,
        article_type=$8, huid=$9, pieces=$10, weight=$11, declared_purity=$12, machine=$13,
        gold_pct=$14, silver_pct=$15, copper_pct=$16, zinc_pct=$17, other_pct=$18,
        tested_purity=$19, result=$20, operator=$21, charges=$22, payment_mode=$23, remarks=$24, priority=$25,
        updated_at=NOW()
       WHERE id=$26 RETURNING *`,
      [test_date, sample_id, jeweller_name, jeweller_id || null, phone, bis_license, address,
       article_type, huid, pieces, weight, declared_purity, machine,
       gold_pct, silver_pct, copper_pct, zinc_pct, other_pct,
       tested_purity, result, operator, charges, payment_mode, remarks, priority || null, req.params.id]
    );
    if (!r.rows.length) return res.status(404).json({ error: 'Test not found' });
    res.json(r.rows[0]);
  } catch (err) { next(err); }
};

export const deleteXrfTest = async (req, res, next) => {
  try {
    const r = await db(req).query('DELETE FROM xrf_tests WHERE id=$1 RETURNING id', [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Test not found' });
    res.json({ success: true });
  } catch (err) { next(err); }
};
