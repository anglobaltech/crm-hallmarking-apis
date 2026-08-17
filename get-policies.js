import { pool } from './src/db.js';
async function run() {
  const result = await pool.query(`
    SELECT pol.polname, cls.relname 
    FROM pg_policy pol 
    JOIN pg_class cls ON pol.polrelid = cls.oid;
  `);
  console.log(result.rows);
}
run();
