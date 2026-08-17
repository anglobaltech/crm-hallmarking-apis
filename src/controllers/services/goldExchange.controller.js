import { pool } from '../../db.js';
const db = (req) => pool;

export const getExchanges = async (req, res, next) => {
  try {
    const { search = '', txn_type = 'All', status = 'All', date_from, date_to, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    const params = [];
    let idx = 1;
    let where = 'WHERE 1=1';

    if (txn_type !== 'All') { where += ` AND txn_type=$${idx++}`; params.push(txn_type); }
    if (status !== 'All') { where += ` AND status=$${idx++}`; params.push(status); }
    if (date_from) { where += ` AND txn_date>=$${idx++}`; params.push(date_from); }
    if (date_to) { where += ` AND txn_date<=$${idx++}`; params.push(date_to); }
    if (search) {
      where += ` AND (jeweller_name ILIKE $${idx} OR id::text ILIKE $${idx})`;
      params.push(`%${search}%`); idx++;
    }

    const countRes = await db(req).query(`SELECT COUNT(*) FROM gold_exchanges ${where}`, params);
    const dataRes = await db(req).query(
      `SELECT * FROM gold_exchanges ${where} ORDER BY created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, limit, offset]
    );

    res.json({ data: dataRes.rows, total: parseInt(countRes.rows[0].count) });
  } catch (err) { next(err); }
};

export const getExchangeStats = async (_req, res, next) => {
  try {
    const r = await db(req).query(`
      SELECT
        COUNT(*) FILTER (WHERE txn_date = CURRENT_DATE) AS today_txns,
        COALESCE(SUM(final_amount) FILTER (WHERE txn_type='Buy' AND txn_date=CURRENT_DATE), 0) AS today_buy,
        COALESCE(SUM(final_amount) FILTER (WHERE txn_type='Sell' AND txn_date=CURRENT_DATE), 0) AS today_sell,
        COALESCE(SUM(final_amount) FILTER (WHERE txn_type='Buy'), 0) AS total_buy,
        COALESCE(SUM(final_amount) FILTER (WHERE txn_type='Sell'), 0) AS total_sell,
        COUNT(*) FILTER (WHERE status='Pending') AS pending
      FROM gold_exchanges
    `);
    res.json(r.rows[0]);
  } catch (err) { next(err); }
};

export const getExchangeById = async (req, res, next) => {
  try {
    const r = await db(req).query('SELECT * FROM gold_exchanges WHERE id=$1', [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Transaction not found' });
    res.json(r.rows[0]);
  } catch (err) { next(err); }
};

export const createExchange = async (req, res, next) => {
  try {
    const {
      job_date, txn_date, txn_type, exchange_type, jeweller_name, jeweller_id, phone, address, gst_number, gstin,
      article_type, pieces, weight, gross_weight, net_weight, purity,
      fine_gold_weight, gold_rate, total_value, final_amount, status, operator, remarks
    } = req.body;

    if (!jeweller_name) {
      return res.status(400).json({ error: 'jeweller_name is required' });
    }

    const r = await db(req).query(
      `INSERT INTO gold_exchanges
        (exchange_date, jeweller_name, jeweller_id, phone, address, gst_number,
         article_type, pieces, gross_weight, net_weight, purity,
         fine_gold_weight, gold_rate, total_value, exchange_type, status, operator, remarks)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
       RETURNING *`,
      [job_date || txn_date || new Date().toISOString().split('T')[0],
       jeweller_name, 
       jeweller_id || null, 
       phone || null, 
       address || null, 
       gst_number || gstin || null,
       article_type || 'Unknown', 
       pieces || 1,
       gross_weight || weight || null, 
       net_weight || null, 
       purity || null, 
       fine_gold_weight || null,
       gold_rate || null, 
       total_value || final_amount || null, 
       exchange_type || txn_type || 'Buy',
       status || 'Pending', 
       operator || null, 
       remarks || null]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) { next(err); }
};

export const updateExchange = async (req, res, next) => {
  try {
    const {
      job_date, txn_date, txn_type, exchange_type, jeweller_name, jeweller_id, phone, address, gst_number, gstin,
      article_type, pieces, weight, gross_weight, net_weight, purity,
      fine_gold_weight, gold_rate, total_value, final_amount, status, operator, remarks
    } = req.body;

    const r = await db(req).query(
      `UPDATE gold_exchanges SET
        exchange_date=$1, jeweller_name=$2, jeweller_id=$3, phone=$4, address=$5, gst_number=$6,
        article_type=$7, pieces=$8, gross_weight=$9, net_weight=$10, purity=$11,
        fine_gold_weight=$12, gold_rate=$13, total_value=$14, exchange_type=$15, status=$16, operator=$17, remarks=$18, updated_at=NOW()
       WHERE id=$19 RETURNING *`,
      [job_date || txn_date || null, 
       jeweller_name, 
       jeweller_id || null, 
       phone || null, 
       address || null, 
       gst_number || gstin || null,
       article_type || 'Unknown', 
       pieces || null, 
       gross_weight || weight || null, 
       net_weight || null, 
       purity || null,
       fine_gold_weight || null, 
       gold_rate || null, 
       total_value || final_amount || null, 
       exchange_type || txn_type || null, 
       status || null, 
       operator || null, 
       remarks || null, 
       req.params.id]
    );
    if (!r.rows.length) return res.status(404).json({ error: 'Transaction not found' });
    res.json(r.rows[0]);
  } catch (err) { next(err); }
};

export const deleteExchange = async (req, res, next) => {
  try {
    const r = await db(req).query('DELETE FROM gold_exchanges WHERE id=$1 RETURNING id', [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Transaction not found' });
    res.json({ success: true });
  } catch (err) { next(err); }
};
