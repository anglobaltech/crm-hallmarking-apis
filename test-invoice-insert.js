import { pool, tenantStorage } from './src/db.js';
async function test() {
  tenantStorage.run(1, async () => {
    try {
      const invResult = await pool.query(
        `INSERT INTO invoices (
          invoice_number, invoice_date, sale_type, customer_id, customer_name, customer_phone,
          billing_address, shipping_address, state_of_supply, subtotal, total_discount, total_tax,
          round_off, grand_total, status, image_url, description, linked_payment, payment_amount
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19) RETURNING id`,
        [
          "INV-123", new Date(), "Cash", "", "Customer", "123",
          "", "", "Delhi", 0, 0, 0,
          0, 0, "Paid", "", "", "Cash", 0
        ]
      );
      console.log('Success:', invResult.rows[0].id);
    } catch(e) {
      console.error('Insert Error:', e.message);
    }
  });
}
test();
