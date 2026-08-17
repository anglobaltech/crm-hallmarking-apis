const fs = require('fs');

let content = fs.readFileSync('src/controllers/dashboard.controller.js', 'utf8');

// Replace getDashboardStats
content = content.replace(
  /export const getDashboardStats = async \(_req, res, next\) => \{\n  try \{\n    const today = new Date\(\)\.toISOString\(\)\.split\('T'\)\[0\];/g,
  `export const getDashboardStats = async (req, res, next) => {
  try {
    const from = req.query.from;
    const to = req.query.to;
    const today = from || new Date().toISOString().split('T')[0];
    const toDate = to || today;`
);

content = content.replace(
  /job_date=\$1/g,
  "DATE(job_date) >= $1 AND DATE(job_date) <= $2"
);

content = content.replace(
  /test_date=\$1/g,
  "DATE(test_date) >= $1 AND DATE(test_date) <= $2"
);

content = content.replace(
  /assay_date=\$1/g,
  "DATE(assay_date) >= $1 AND DATE(assay_date) <= $2"
);

content = content.replace(
  /exchange_date=\$1/g,
  "DATE(exchange_date) >= $1 AND DATE(exchange_date) <= $2"
);

// We need to fix the params for queries in getDashboardStats
content = content.replace(/\[today\]\)/g, "[today, toDate])");

// Now fix the master_command in getDashboardStats
content = content.replace(
  /\(SELECT COUNT\(\*\) FROM article_tracking\)/g,
  "(SELECT COUNT(*) FROM article_tracking WHERE DATE(created_at) >= $1 AND DATE(created_at) <= $2)"
);
content = content.replace(
  /\(SELECT COUNT\(\*\) FROM xrf_tests\)/g,
  "(SELECT COUNT(*) FROM xrf_tests WHERE DATE(test_date) >= $1 AND DATE(test_date) <= $2)"
);
content = content.replace(
  /\(SELECT COUNT\(\*\) FROM laser_jobs\)/g,
  "(SELECT COUNT(*) FROM laser_jobs WHERE DATE(job_date) >= $1 AND DATE(job_date) <= $2)"
);
content = content.replace(
  /\(SELECT COUNT\(\*\) FROM soldering_jobs\)/g,
  "(SELECT COUNT(*) FROM soldering_jobs WHERE DATE(job_date) >= $1 AND DATE(job_date) <= $2)"
);
content = content.replace(
  /\(SELECT COUNT\(\*\) FROM fire_assays\)/g,
  "(SELECT COUNT(*) FROM fire_assays WHERE DATE(assay_date) >= $1 AND DATE(assay_date) <= $2)"
);
content = content.replace(
  /\(SELECT COUNT\(\*\) FROM gold_exchanges\)/g,
  "(SELECT COUNT(*) FROM gold_exchanges WHERE DATE(exchange_date) >= $1 AND DATE(exchange_date) <= $2)"
);

content = content.replace(
  /WHERE status = 'HUID Tagged' OR status = 'Delivered'/g,
  "WHERE (status = 'HUID Tagged' OR status = 'Delivered') AND DATE(created_at) >= $1 AND DATE(created_at) <= $2"
);
content = content.replace(
  /WHERE status = 'Rejected'/g,
  "WHERE status = 'Rejected' AND DATE(created_at) >= $1 AND DATE(created_at) <= $2"
);
content = content.replace(
  /WHERE result = 'Pass'/g,
  "WHERE result = 'Pass' AND DATE(test_date) >= $1 AND DATE(test_date) <= $2"
);
content = content.replace(
  /WHERE status = 'Completed'/g,
  "WHERE status = 'Completed' AND DATE(created_at) >= $1 AND DATE(created_at) <= $2" // Note: This might hit multiple tables, but for dashboard master_command they use created_at? No, master command uses the specific columns... actually wait, the script might be too fragile.
);

fs.writeFileSync('src/controllers/dashboard.controller.js.tmp', content);
