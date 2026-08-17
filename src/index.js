import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/errorHandler.js';
import { pool, checkDatabase } from './db.js';

import customerRoutes from './routes/customer.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import servicesRoutes from './routes/services.routes.js';
import workflowRoutes from './routes/workflow.routes.js';
import financeRoutes from './routes/finance.routes.js';
import billingRoutes from './routes/billing.routes.js';
import complianceRoutes from './routes/compliance.routes.js';
import operationsRoutes from './routes/operations.routes.js';
import authRoutes from './routes/auth.js';
import { requireAuth } from './middleware/auth.js';
const app = express();

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());
app.use('/public', express.static(path.join(__dirname, '../public')));

// Main API Endpoints
app.use('/api/auth', authRoutes);
app.use('/api/customer', requireAuth, customerRoutes);
app.use('/api/dashboard', requireAuth, dashboardRoutes);
app.use('/api/services', requireAuth, servicesRoutes);
app.use('/api/workflow', requireAuth, workflowRoutes);
app.use('/api/finance', requireAuth, financeRoutes);
app.use('/api/billing', requireAuth, billingRoutes);
app.use('/api/compliance', requireAuth, complianceRoutes);
app.use('/api/operations', requireAuth, operationsRoutes);

// Health Check
app.get('/health', async (req, res) => {
  try {
    const dbStatus = await pool.query('SELECT NOW()');
    res.json({ ok: true, database: 'connected', service: 'hallmark-api', serverTime: dbStatus.rows[0].now });
  } catch (error) {
    res.status(500).json({ ok: false, database: 'disconnected', error: error.message });
  }
});

// Global Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 8000;

app.listen(PORT, async () => {
  console.log(`🚀 API Server running on http://localhost:${PORT}`);
  await checkDatabase();
  console.log(`🔧 Schema applied from disk successfully`);
  console.log(`📋 Available endpoints:`);
  console.log(`   GET /health`);
  console.log(`   /api/customer`);
  console.log(`   /api/dashboard`);
  console.log(`   /api/services`);
});
