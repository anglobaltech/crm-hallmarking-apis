import { pool, tenantStorage } from './src/db.js';
async function test() {
  tenantStorage.run('BHC-001', async () => {
    try {
      const orderCode = 'ORD-2024-' + Math.floor(1000 + Math.random() * 9000);
      const customer_name = 'Demo';
      const customer_mobile = '9999999999';
      const customer_id = '123455666';
      
      const orderRes = await pool.query(
        `INSERT INTO orders (order_code, customer_name, customer_mobile, customer_id, receipt_date, total_articles) 
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [orderCode, customer_name, customer_mobile, customer_id, new Date(), 1]
      );
      const order = orderRes.rows[0];
      console.log('Order:', order.id);

      const artCode = 'ART-2024-' + Math.floor(1000 + Math.random() * 9000);
      await pool.query(
        `INSERT INTO article_tracking (article_code, order_id, article_type, metal, declared_purity, gross_weight, net_weight, quantity, remarks, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'Intake')`,
        [artCode, order.id, 'Ring', 'Gold', '916 (22K)', 0.006, null, 1, 'Demo']
      );
      console.log('Article inserted');
    } catch(e) { console.error('Error:', e) }
  });
}
test();
