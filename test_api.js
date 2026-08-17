import { pool, tenantStorage } from './src/db.js';
import * as dashboardController from './src/controllers/dashboard.controller.js';

// Mock request and response
const req = { params: {} };
const res = {
  json: (data) => console.log('SUCCESS:', JSON.stringify(data).substring(0, 200) + '...'),
  status: (code) => ({
    json: (data) => console.log(`STATUS ${code}:`, data)
  })
};
const next = (err) => console.error('ERROR (next called):', err);

async function test() {
  await tenantStorage.run(1, async () => {
    console.log("--- Testing getDashboardStats ---");
    await dashboardController.getDashboardStats(req, res, next);
    
    console.log("\n--- Testing getDailyReportStats ---");
    await dashboardController.getDailyReportStats(req, res, next);
    
    console.log("\n--- Testing getActivityFeed ---");
    await dashboardController.getActivityFeed(req, res, next);
  });
  process.exit(0);
}

test();
