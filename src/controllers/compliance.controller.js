import { pool } from '../db.js';
const db = (req) => pool;

export const getComplianceDocs = async (req, res, next) => {
  try {
    const result = await db(req).query('SELECT * FROM compliance_docs ORDER BY created_at DESC');
    res.json({ data: result.rows });
  } catch (err) { next(err); }
};

export const getCalibrationLogs = async (req, res, next) => {
  try {
    const result = await db(req).query('SELECT * FROM calibration_logs ORDER BY created_at DESC');
    res.json({ data: result.rows });
  } catch (err) { next(err); }
};
