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
          "INV-68892", new Date(), "Cash", null, "demo", "9999898989",
          "demo", "Dmeo", "Delhi", 1600, 0, 288,
          0, 1888, "Paid", "", "Deno", "Cash", 0
        ]
      );
      console.log('Invoice Success:', invResult.rows[0].id);
      
      const newInvoiceId = invResult.rows[0].id;
      
      await pool.query(
        `INSERT INTO invoice_items (
          invoice_id, item_name, quantity, unit, price_per_unit, is_tax_inclusive,
          discount_pct, discount_amt, tax_rate, tax_amt, amount
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          newInvoiceId, "Dmeo", 16, "GM", 100, false,
          0, 0, "GST@18%", 288, 1888
        ]
      );
      console.log('Items Success!');
    } catch(e) {
      console.error('Insert Error:', e.message);
    }
  });
}
test();
