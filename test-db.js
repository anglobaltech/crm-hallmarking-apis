import { checkDatabase } from './src/db.js';
checkDatabase().then(() => console.log('OK')).catch(console.error);
