import { pool } from '../db.js';

// --- Orders / Intake ---
export const createOrder = async (req, res, next) => {
  try {
    const { customer_name, customer_mobile, date_of_receipt, articles } = req.body;
    
    // Create order
    const orderCode = 'ORD-2024-' + Math.floor(1000 + Math.random() * 9000);
    const tenantId = req.user?.tenantId || 1; // Fallback to 1 if not provided by auth middleware
    const orderRes = await pool.query(
      `INSERT INTO orders (tenant_id, order_code, customer_name, customer_mobile, customer_id, receipt_date, total_articles) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [tenantId, orderCode, customer_name, customer_mobile || null, req.body.customer_id || null, date_of_receipt || new Date(), articles ? articles.length : 1]
    );
    const order = orderRes.rows[0];

    // If articles array is provided, insert them
    if (articles && Array.isArray(articles)) {
      for (const art of articles) {
        const artCode = 'ART-2024-' + Math.floor(1000 + Math.random() * 9000);
        await pool.query(
          `INSERT INTO article_tracking (tenant_id, article_code, order_id, article_type, metal, declared_purity, gross_weight, net_weight, quantity, remarks, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'Intake')`,
          [
            tenantId,
            artCode, 
            order.id, 
            art.type || 'Unknown', 
            art.metal || 'Gold', 
            art.purity || null, 
            art.gross_weight || null, 
            art.net_weight || null, 
            art.quantity || 1,
            art.remarks || null
          ]
        );
      }
    } else {
      // Create a default article
      const artCode = 'ART-2024-' + Math.floor(1000 + Math.random() * 9000);
      await pool.query(
        `INSERT INTO article_tracking (tenant_id, article_code, order_id, article_type, metal, status) VALUES ($1, $2, $3, 'Unknown', 'Gold', 'Intake')`,
        [tenantId, artCode, order.id]
      );
    }
    
    res.status(201).json({ success: true, order });
  } catch (err) { 
    import('fs').then(fs => fs.writeFileSync('error.log', err.stack || err.message));
    next(err); 
  }
};

export const getOrders = async (req, res, next) => {
  try {
    const result = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
    res.json({ data: result.rows });
  } catch (err) { next(err); }
};

// --- Article Tracking ---
export const getArticles = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';

    let whereClause = 'WHERE 1=1';
    const params = [];
    let idx = 1;

    if (search) {
      whereClause += ` AND (o.customer_name ILIKE $${idx} OR a.id::text ILIKE $${idx} OR a.huid ILIKE $${idx} OR a.article_code ILIKE $${idx})`;
      params.push(`%${search}%`);
      idx++;
    }

    if (req.query.huid_only === 'true') {
      whereClause += ` AND a.huid IS NOT NULL AND a.huid != ''`;
    }

    const countRes = await pool.query(`
      SELECT COUNT(*) FROM article_tracking a 
      LEFT JOIN orders o ON a.order_id = o.id 
      ${whereClause}
    `, params);

    const dataRes = await pool.query(`
      SELECT a.*, o.customer_name 
      FROM article_tracking a 
      LEFT JOIN orders o ON a.order_id = o.id 
      ${whereClause} 
      ORDER BY a.created_at DESC 
      LIMIT $${idx} OFFSET $${idx + 1}
    `, [...params, limit, offset]);

    res.json({ data: dataRes.rows, total: parseInt(countRes.rows[0].count) });
  } catch (err) { next(err); }
};

export const updateArticleStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, current_desk, gross_weight, huid, article_type, metal, declared_purity } = req.body;

    const updates = [];
    const params = [];
    let idx = 1;

    if (status) { updates.push(`status = $${idx++}`); params.push(status); }
    if (current_desk) { updates.push(`current_desk = $${idx++}`); params.push(current_desk); }
    if (gross_weight !== undefined) { updates.push(`gross_weight = $${idx++}`); params.push(gross_weight); }
    if (huid) { updates.push(`huid = $${idx++}`); params.push(huid); }
    if (article_type) { updates.push(`article_type = $${idx++}`); params.push(article_type); }
    if (metal) { updates.push(`metal = $${idx++}`); params.push(metal); }
    if (declared_purity) { updates.push(`declared_purity = $${idx++}`); params.push(declared_purity); }

    updates.push(`updated_at = NOW()`);
    params.push(id);

    const result = await pool.query(
      `UPDATE article_tracking SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
      params
    );
    res.json({ success: true, article: result.rows[0] });
  } catch (err) { next(err); }
};

export const updateArticle = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      customer_name, phone, gst_number, bis_license, gstin, receipt_date, job_date, test_date,
      article_type, metal, declared_purity, gross_weight, net_weight,
      quantity, remarks, status, huid, priority
    } = req.body;

    const artRes = await pool.query('SELECT order_id FROM article_tracking WHERE id = $1', [id]);
    if (!artRes.rows.length) {
      return res.status(404).json({ error: 'Article not found' });
    }
    const orderId = artRes.rows[0].order_id;

    // Update order level fields
    const oUpdates = [];
    const oParams = [];
    let oIdx = 1;
    if (customer_name !== undefined) { oUpdates.push(`customer_name = $${oIdx++}`); oParams.push(customer_name); }
    if (phone !== undefined) { oUpdates.push(`customer_mobile = $${oIdx++}`); oParams.push(phone); }
    
    const finalGst = gst_number || bis_license || gstin;
    if (finalGst !== undefined) { oUpdates.push(`customer_id = $${oIdx++}`); oParams.push(finalGst); }
    
    const finalDate = receipt_date || job_date || test_date;
    if (finalDate !== undefined) { oUpdates.push(`receipt_date = $${oIdx++}`); oParams.push(finalDate); }

    if (oUpdates.length > 0 && orderId) {
      oParams.push(orderId);
      await pool.query(`UPDATE orders SET ${oUpdates.join(', ')} WHERE id = $${oIdx}`, oParams);
    }

    const updates = [];
    const params = [];
    let idx = 1;

    if (article_type !== undefined) { updates.push(`article_type = $${idx++}`); params.push(article_type); }
    if (metal !== undefined) { updates.push(`metal = $${idx++}`); params.push(metal); }
    if (declared_purity !== undefined) { updates.push(`declared_purity = $${idx++}`); params.push(declared_purity); }
    if (gross_weight !== undefined) { updates.push(`gross_weight = $${idx++}`); params.push(gross_weight); }
    if (net_weight !== undefined) { updates.push(`net_weight = $${idx++}`); params.push(net_weight); }
    if (quantity !== undefined) { updates.push(`quantity = $${idx++}`); params.push(quantity); }
    if (remarks !== undefined) { updates.push(`remarks = $${idx++}`); params.push(remarks); }
    if (status !== undefined) { updates.push(`status = $${idx++}`); params.push(status); }
    if (huid !== undefined) { updates.push(`huid = $${idx++}`); params.push(huid); }
    // Add priority to updates if it exists in schema? priority doesn't exist in article_tracking currently based on createOrder, so skip updating it to DB for article_tracking.

    if (updates.length === 0) {
      const updatedArticleRes = await pool.query('SELECT * FROM article_tracking WHERE id = $1', [id]);
      return res.json({ success: true, article: updatedArticleRes.rows[0], message: 'Order fields updated' });
    }

    updates.push(`updated_at = NOW()`);
    params.push(id);

    const result = await pool.query(
      `UPDATE article_tracking SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
      params
    );

    res.json({ success: true, article: result.rows[0] });
  } catch (err) { next(err); }
};

export const deleteArticle = async (req, res, next) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM article_tracking WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) { next(err); }
};

// --- Billing & Discounts ---
export const createBill = async (req, res, next) => {
  try {
    const { order_id, customer_name, hm_charges, test_charges, qty, discount_pct } = req.body;
    
    const invoiceNo = 'INV-' + Math.floor(1000 + Math.random() * 9000);
    const subtotal = (parseFloat(hm_charges) * parseInt(qty)) + (parseFloat(test_charges) * parseInt(qty));
    const discountAmt = subtotal * (parseFloat(discount_pct) / 100);
    const taxable = subtotal - discountAmt;
    const gst = taxable * 0.18;
    const total = taxable + gst;

    const result = await pool.query(
      `INSERT INTO billing (invoice_no, order_id, customer_name, hallmarking_charges, testing_charges, quantity, discount_pct, discount_amt, subtotal, taxable_amount, gst_amount, total_amount)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [invoiceNo, order_id || null, customer_name, hm_charges, test_charges, qty, discount_pct, discountAmt, subtotal, taxable, gst, total]
    );
    res.status(201).json({ success: true, bill: result.rows[0] });
  } catch (err) { next(err); }
};

export const getBills = async (req, res, next) => {
  try {
    const result = await pool.query('SELECT * FROM billing ORDER BY created_at DESC');
    res.json({ data: result.rows });
  } catch (err) { next(err); }
};

// --- Reminders ---
export const getReminders = async (req, res, next) => {
  try {
    const result = await pool.query('SELECT * FROM reminders ORDER BY due_date ASC');
    const calibrations = result.rows.filter(r => r.equipment !== null);
    const reminders = result.rows;
    res.json({ calibrations, reminders });
  } catch (err) { next(err); }
};

export const createReminder = async (req, res, next) => {
  try {
    const {
      title, description, due_date, priority,
      reminder_type, alert_before, alert_unit,
      repeat_type, assigned_to, notes
    } = req.body;

    if (!title || !due_date) {
      return res.status(400).json({ error: 'Title and Due Date are required' });
    }

    const tenantId = req.user?.tenantId || 1;

    const result = await pool.query(
      `INSERT INTO reminders (tenant_id, title, description, due_date, priority, reminder_type, alert_before, alert_unit, repeat_type, assigned_to, notes, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'Pending') RETURNING *`,
      [
        tenantId,
        title,
        description || null,
        due_date,
        priority || 'Normal',
        reminder_type || 'General',
        alert_before !== undefined ? parseInt(alert_before) : 3,
        alert_unit || 'Days',
        repeat_type || 'None',
        assigned_to || null,
        notes || null
      ]
    );

    res.status(201).json({ success: true, reminder: result.rows[0] });
  } catch (err) { next(err); }
};

export const updateReminder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      title, description, due_date, priority, status,
      reminder_type, alert_before, alert_unit,
      repeat_type, assigned_to, notes
    } = req.body;

    const result = await pool.query(
      `UPDATE reminders SET
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        due_date = COALESCE($3, due_date),
        priority = COALESCE($4, priority),
        status = COALESCE($5, status),
        reminder_type = COALESCE($6, reminder_type),
        alert_before = COALESCE($7, alert_before),
        alert_unit = COALESCE($8, alert_unit),
        repeat_type = COALESCE($9, repeat_type),
        assigned_to = COALESCE($10, assigned_to),
        notes = COALESCE($11, notes),
        updated_at = NOW()
       WHERE id = $12 RETURNING *`,
      [title, description, due_date, priority, status, reminder_type,
       alert_before !== undefined ? parseInt(alert_before) : null,
       alert_unit, repeat_type, assigned_to, notes, id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Reminder not found' });
    }
    res.json({ success: true, reminder: result.rows[0] });
  } catch (err) { next(err); }
};

export const deleteReminder = async (req, res, next) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM reminders WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) { next(err); }
};

// --- Stats ---
export const getStats = async (req, res, next) => {
  try {
    const ordersRes = await pool.query('SELECT count(*) FROM orders');
    const articlesRes = await pool.query('SELECT count(*) FROM article_tracking');
    
    res.json({
      success: true,
      stats: {
        total_orders: parseInt(ordersRes.rows[0].count),
        total_articles: parseInt(articlesRes.rows[0].count)
      }
    });
  } catch (err) { next(err); }
};
