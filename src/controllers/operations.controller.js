import { pool } from '../db.js';
const db = (req) => pool;

export const getStaff = async (req, res, next) => {
  try {
    const result = await db(req).query('SELECT * FROM staff ORDER BY created_at DESC');
    res.json({ data: result.rows });
  } catch (err) { next(err); }
};

export const getNotifications = async (req, res, next) => {
  try {
    const result = await db(req).query('SELECT * FROM notifications ORDER BY created_at DESC');
    res.json({ data: result.rows });
  } catch (err) { next(err); }
};

export const getDailyReports = async (req, res, next) => {
  try {
    const result = await db(req).query('SELECT * FROM daily_reports ORDER BY created_at DESC');
    res.json({ data: result.rows });
  } catch (err) { next(err); }
};
