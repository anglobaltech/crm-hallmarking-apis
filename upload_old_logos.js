import 'dotenv/config';
import pg from 'pg';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  const res = await pool.query('SELECT id, logo_url FROM tenants WHERE logo_url IS NOT NULL AND logo_url LIKE \'/public/%\'');
  for (const row of res.rows) {
    // The logo_url is like '/public/uploads/file.jpg'
    // So if we are in backend/, we just prepend '.'
    const localPath = path.join(process.cwd(), row.logo_url);
    if (fs.existsSync(localPath)) {
      console.log(`Uploading ${localPath} to Cloudinary...`);
      try {
        const result = await cloudinary.uploader.upload(localPath, { folder: 'HallMarking CRM Software' });
        await pool.query('UPDATE tenants SET logo_url = $1 WHERE id = $2', [result.secure_url, row.id]);
        console.log(`Updated tenant ${row.id} with new URL: ${result.secure_url}`);
      } catch(e) { console.error('Upload failed', e); }
    } else {
      console.log(`File not found: ${localPath}`);
    }
  }
  process.exit(0);
}
run();
