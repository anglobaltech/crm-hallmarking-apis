import { pool } from '../db.js';
const db = (req) => pool;

export const getJewellers = async (req, res, next) => {
  try {
    const { search = '', status = 'All', page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (status !== 'All') {
      whereClause += ` AND status = $${paramIndex++}`;
      params.push(status);
    }

    if (search) {
      whereClause += ` AND (name ILIKE $${paramIndex} OR owner_name ILIKE $${paramIndex} OR bis_license ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    const countResult = await db(req).query(
      `SELECT COUNT(*) FROM jewellers ${whereClause}`,
      params
    );

    const result = await db(req).query(
      `SELECT * FROM jewellers ${whereClause} ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    res.json({
      data: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (err) { next(err); }
};

export const getJewellerById = async (req, res, next) => {
  try {
    const result = await db(req).query('SELECT * FROM jewellers WHERE id = $1', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Jeweller not found' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
};

export const createJeweller = async (req, res, next) => {
  try {
    const {
      name, owner_name, phone, email, address, city, state, pincode,
      bis_license, license_expiry, category, gstin, pan_number, aadhar,
      bank_name, account_number, ifsc, notes, status
    } = req.body;

    if (!name || !owner_name || !phone || !bis_license) {
      return res.status(400).json({ error: 'name, owner_name, phone and bis_license are required' });
    }

    const result = await db(req).query(
      `INSERT INTO jewellers 
        (name, owner_name, phone, email, address, city, state, pincode,
         bis_license, license_expiry, category, gstin, pan_number, aadhar,
         bank_name, account_number, ifsc, notes, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
       RETURNING *`,
      [name, owner_name, phone, email, address, city, state || 'Rajasthan', pincode,
       bis_license, license_expiry || null, category || 'Gold', gstin, pan_number, aadhar,
       bank_name, account_number, ifsc, notes, status || 'Active']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'BIS License number already exists' });
    next(err);
  }
};

export const updateJeweller = async (req, res, next) => {
  try {
    const {
      name, owner_name, phone, email, address, city, state, pincode,
      bis_license, license_expiry, category, gstin, pan_number, aadhar,
      bank_name, account_number, ifsc, notes, status
    } = req.body;

    const result = await db(req).query(
      `UPDATE jewellers SET
        name=$1, owner_name=$2, phone=$3, email=$4, address=$5, city=$6, state=$7, pincode=$8,
        bis_license=$9, license_expiry=$10, category=$11, gstin=$12, pan_number=$13, aadhar=$14,
        bank_name=$15, account_number=$16, ifsc=$17, notes=$18, status=$19, updated_at=NOW()
       WHERE id=$20 RETURNING *`,
      [name, owner_name, phone, email, address, city, state, pincode,
       bis_license, license_expiry || null, category, gstin, pan_number, aadhar,
       bank_name, account_number, ifsc, notes, status, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Jeweller not found' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
};

export const deleteJeweller = async (req, res, next) => {
  try {
    const result = await db(req).query('DELETE FROM jewellers WHERE id = $1 RETURNING id', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Jeweller not found' });
    res.json({ success: true, id: result.rows[0].id });
  } catch (err) { next(err); }
};

export const getJewellersStats = async (_req, res, next) => {
  try {
    const result = await db(req).query(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'Active') AS active,
        COUNT(*) FILTER (WHERE status = 'Expiring') AS expiring,
        COUNT(*) FILTER (WHERE status = 'Inactive') AS inactive,
        COUNT(*) AS total,
        SUM(huid_issued) AS total_huid
      FROM jewellers
    `);
    res.json(result.rows[0]);
  } catch (err) { next(err); }
};
