import { Router } from 'express';
import {
  getDashboardStats,
  getMonthlyRevenue,
  getActivityFeed,
  updateActivityStatus,
  getDailyReportStats,
  deleteActivity
} from '../controllers/dashboard.controller.js';

const router = Router();

router.get('/stats', getDashboardStats);
router.get('/monthly-revenue', getMonthlyRevenue);
router.get('/daily-report', getDailyReportStats);
router.get('/activity', getActivityFeed);
router.patch('/activity/:type/:id', updateActivityStatus);
router.delete('/activity/:type/:id', deleteActivity);

export default router;
