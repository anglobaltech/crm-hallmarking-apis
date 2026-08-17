import { PGlite } from '@electric-sql/pglite';
const pool = new PGlite('./pglite-data');
pool.query('SELECT 1').then(console.log).catch(console.error);
