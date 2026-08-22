const fs = require('fs');
const path = require('path');

const controllers = [
  'src/controllers/services/laserCutting.controller.js',
  'src/controllers/services/soldering.controller.js',
  'src/controllers/services/fireAssaying.controller.js',
  'src/controllers/services/goldExchange.controller.js',
  'src/controllers/services/xrfTesting.controller.js'
];

for (const file of controllers) {
  const filePath = path.resolve(__dirname, file);
  let content = fs.readFileSync(filePath, 'utf-8');

  // Add priority to destructuring in create
  content = content.replace(
    /charges, payment_mode, status, remarks\s*}\s*=\s*req\.body;/,
    "charges, payment_mode, status, remarks, priority\n    } = req.body;"
  );

  // Add priority to INSERT query (columns)
  content = content.replace(
    /charges, payment_mode, status, remarks\)/,
    "charges, payment_mode, status, remarks, priority)"
  );

  // Add priority to INSERT query (VALUES)
  content = content.replace(
    /(\$18,\$19,\$20)\)/,
    "$1,$21)"
  );

  // Add priority to INSERT array
  content = content.replace(
    /charges\s*\|\|\s*0,\s*payment_mode\s*\|\|\s*'Cash',\s*status\s*\|\|\s*'Pending',\s*remarks\s*\|\|\s*null\s*\]/,
    "charges || 0, payment_mode || 'Cash', status || 'Pending', remarks || null, priority || null]"
  );

  // Add priority to update destructuring
  content = content.replace(
    /charges, payment_mode, status, remarks\s*}\s*=\s*req\.body;/g,
    "charges, payment_mode, status, remarks, priority\n    } = req.body;"
  );

  // Add priority to UPDATE SET
  content = content.replace(
    /status=\$19, remarks=\$20, updated_at=NOW\(\)/,
    "status=$19, remarks=$20, priority=$21, updated_at=NOW()"
  );

  // Add priority to UPDATE array
  content = content.replace(
    /charges\s*\|\|\s*0,\s*payment_mode\s*\|\|\s*'Cash',\s*status\s*\|\|\s*'Pending',\s*remarks\s*\|\|\s*null,\s*req\.params\.id\s*\]/,
    "charges || 0, payment_mode || 'Cash', status || 'Pending', remarks || null, priority || null, req.params.id]"
  );
  
  // Fix the parameter index for req.params.id in UPDATE
  content = content.replace(/WHERE id=\$21/, "WHERE id=$22");

  fs.writeFileSync(filePath, content);
}

// Fix workflow.controller.js (article_tracking)
const wfPath = path.resolve(__dirname, 'src/controllers/workflow.controller.js');
let wfContent = fs.readFileSync(wfPath, 'utf-8');

wfContent = wfContent.replace(
  /quantity, remarks, status, huid, priority\s*}\s*=\s*req\.body;/,
  "quantity, remarks, status, huid, priority\n    } = req.body;"
);

// update article tracking update query
wfContent = wfContent.replace(
  /huid=\$9, updated_at=NOW\(\)\s*WHERE id=\$10/,
  "huid=$9, priority=$10, updated_at=NOW() WHERE id=$11"
);
wfContent = wfContent.replace(
  /huid\s*\|\|\s*null,\s*req\.params\.id\s*\]/,
  "huid || null, priority || null, req.params.id]"
);

fs.writeFileSync(wfPath, wfContent);

// Fix db.js
const dbPath = path.resolve(__dirname, 'src/db.js');
let dbContent = fs.readFileSync(dbPath, 'utf-8');
dbContent = dbContent.replace(
  /await pool\.query\('ALTER TABLE fire_assays ADD COLUMN IF NOT EXISTS address TEXT, ADD COLUMN IF NOT EXISTS gst_number VARCHAR\(100\), ADD COLUMN IF NOT EXISTS purity VARCHAR\(50\)'\);/g,
  "await pool.query('ALTER TABLE fire_assays ADD COLUMN IF NOT EXISTS address TEXT, ADD COLUMN IF NOT EXISTS gst_number VARCHAR(100), ADD COLUMN IF NOT EXISTS purity VARCHAR(50), ADD COLUMN IF NOT EXISTS priority VARCHAR(50)');"
);
dbContent = dbContent.replace(
  /await pool\.query\('ALTER TABLE laser_jobs ADD COLUMN IF NOT EXISTS address TEXT, ADD COLUMN IF NOT EXISTS gst_number VARCHAR\(100\), ADD COLUMN IF NOT EXISTS purity VARCHAR\(50\)'\);/g,
  "await pool.query('ALTER TABLE laser_jobs ADD COLUMN IF NOT EXISTS address TEXT, ADD COLUMN IF NOT EXISTS gst_number VARCHAR(100), ADD COLUMN IF NOT EXISTS purity VARCHAR(50), ADD COLUMN IF NOT EXISTS priority VARCHAR(50)');"
);
dbContent = dbContent.replace(
  /await pool\.query\('ALTER TABLE soldering_jobs ADD COLUMN IF NOT EXISTS address TEXT, ADD COLUMN IF NOT EXISTS gst_number VARCHAR\(100\), ADD COLUMN IF NOT EXISTS purity VARCHAR\(50\)'\);/g,
  "await pool.query('ALTER TABLE soldering_jobs ADD COLUMN IF NOT EXISTS address TEXT, ADD COLUMN IF NOT EXISTS gst_number VARCHAR(100), ADD COLUMN IF NOT EXISTS purity VARCHAR(50), ADD COLUMN IF NOT EXISTS priority VARCHAR(50)');"
);
dbContent = dbContent.replace(
  /await pool\.query\('ALTER TABLE gold_exchanges ADD COLUMN IF NOT EXISTS address TEXT, ADD COLUMN IF NOT EXISTS gst_number VARCHAR\(100\), ADD COLUMN IF NOT EXISTS purity VARCHAR\(50\)'\);/g,
  "await pool.query('ALTER TABLE gold_exchanges ADD COLUMN IF NOT EXISTS address TEXT, ADD COLUMN IF NOT EXISTS gst_number VARCHAR(100), ADD COLUMN IF NOT EXISTS purity VARCHAR(50), ADD COLUMN IF NOT EXISTS priority VARCHAR(50)');"
);

// Add priority to article_tracking
dbContent = dbContent.replace(
  /await pool\.query\('ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_mobile VARCHAR\(50\)'\);/g,
  "await pool.query('ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_mobile VARCHAR(50)');\n    await pool.query('ALTER TABLE article_tracking ADD COLUMN IF NOT EXISTS priority VARCHAR(50)');\n    await pool.query('ALTER TABLE xrf_tests ADD COLUMN IF NOT EXISTS priority VARCHAR(50)');"
);
fs.writeFileSync(dbPath, dbContent);

console.log('Successfully updated controllers and db.js');
