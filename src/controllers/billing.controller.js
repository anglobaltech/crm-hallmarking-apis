import { pool } from '../db.js';

// GET /api/billing/invoices
export const getInvoices = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM invoices ORDER BY created_at DESC LIMIT 50`
    );
    
    // Calculate stats for dashboard
    let total_paid = 0;
    let total_unpaid = 0;
    let total_revenue = 0;
    
    result.rows.forEach(inv => {
      const amt = parseFloat(inv.grand_total) || parseFloat(inv.amount) || 0;
      total_revenue += amt;
      if (inv.status === 'Paid') {
        total_paid += amt;
      } else {
        total_unpaid += amt;
      }
    });

    res.json({
      data: result.rows,
      stats: {
        total_paid,
        total_unpaid,
        total_revenue
      }
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
};

// GET /api/billing/invoices/:id
export const getInvoiceById = async (req, res) => {
  try {
    const { id } = req.params;
    const invRes = await pool.query(`SELECT * FROM invoices WHERE id = $1`, [id]);
    
    if (invRes.rows.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    
    const invoice = invRes.rows[0];
    
    const itemsRes = await pool.query(`SELECT * FROM invoice_items WHERE invoice_id = $1`, [id]);
    invoice.items = itemsRes.rows;
    
    res.json(invoice);
  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({ error: 'Failed to fetch invoice' });
  }
};

// POST /api/billing/invoices
export const createInvoice = async (req, res) => {
  try {
    const {
      invoice_number,
      invoice_date,
      sale_type,
      customer_id,
      customer_name,
      customer_phone,
      billing_address,
      shipping_address,
      state_of_supply,
      subtotal,
      total_discount,
      total_tax,
      round_off,
      grand_total,
      status,
      items,
      image_url,
      description,
      linked_payment,
      payment_amount
    } = req.body;
    
    // Insert into invoices
    const invResult = await pool.query(
      `INSERT INTO invoices (
        invoice_number, invoice_date, sale_type, customer_id, customer_name, customer_phone,
        billing_address, shipping_address, state_of_supply, subtotal, total_discount, total_tax,
        round_off, grand_total, status, image_url, description, linked_payment, payment_amount, amount
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20) RETURNING id`,
      [
        invoice_number, invoice_date || new Date(), sale_type, customer_id || null, customer_name, customer_phone,
        billing_address, shipping_address, state_of_supply, subtotal, total_discount, total_tax,
        round_off, grand_total, status, image_url, description, linked_payment, payment_amount, grand_total
      ]
    );
    
    const newInvoiceId = invResult.rows[0].id;
    
    // Insert all items
    if (items && items.length > 0) {
      for (let item of items) {
        await pool.query(
          `INSERT INTO invoice_items (
            invoice_id, item_name, quantity, unit, price_per_unit, is_tax_inclusive,
            discount_pct, discount_amt, tax_rate, tax_amt, amount
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [
            newInvoiceId, item.item_name, item.quantity, item.unit, item.price_per_unit, item.is_tax_inclusive,
            item.discount_pct, item.discount_amt, item.tax_rate, item.tax_amt, item.amount
          ]
        );
      }
    }
    
    res.status(201).json({ message: 'Invoice created successfully', invoice_id: newInvoiceId });
  } catch (error) {
    console.error('Error creating invoice:', error);
    res.status(500).json({ error: 'Failed to create invoice' });
  }
};

export const getNextInvoiceNumber = async (req, res) => {
  try {
    const result = await pool.query('SELECT COUNT(*) as count FROM invoices');
    const count = parseInt(result.rows[0].count, 10);
    const nextNum = `INV-${new Date().getFullYear()}-${(count + 1).toString().padStart(4, '0')}`;
    res.json({ invoice_number: nextNum });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate invoice number' });
  }
};

export const updateInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const { customer_name, customer_phone, sale_type, status, payment_amount, balance_due } = req.body;
    
    const result = await pool.query(
      `UPDATE invoices 
       SET customer_name = $1, 
           customer_phone = $2, 
           sale_type = $3, 
           status = $4, 
           payment_amount = $5, 
           balance_due = $6
       WHERE id = $7 RETURNING *`,
      [customer_name, customer_phone, sale_type, status, payment_amount, balance_due, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    res.json({ message: 'Invoice updated successfully', invoice: result.rows[0] });
  } catch (error) {
    console.error('Error updating invoice:', error);
    res.status(500).json({ error: 'Failed to update invoice' });
  }
};

export const deleteInvoice = async (req, res) => {
  res.status(501).json({ error: 'Not implemented' });
};
