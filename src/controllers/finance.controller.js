import { pool } from '../db.js';
const db = (req) => pool;

export const getInvoices = async (req, res, next) => {
  try {
    const result = await db(req).query('SELECT * FROM invoices ORDER BY created_at DESC');
    res.json({ data: result.rows });
  } catch (err) { next(err); }
};

export const getGoldRates = async (req, res, next) => {
  try {
    const result = await db(req).query('SELECT * FROM gold_rates ORDER BY created_at DESC LIMIT 10');
    res.json({ data: result.rows });
  } catch (err) { next(err); }
};

export const getExpenses = async (req, res, next) => {
  try {
    const result = await db(req).query('SELECT * FROM expenses ORDER BY created_at DESC');
    res.json({ data: result.rows });
  } catch (err) { next(err); }
};
