import { Pool } from 'pg';
const pool = new Pool({ connectionString: 'postgresql://postgres.htophcpqqswzjpellnls:Anglobalservices@249@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true' });
pool.query('SELECT 1').then(() => console.log('Connected!')).catch(console.error);
