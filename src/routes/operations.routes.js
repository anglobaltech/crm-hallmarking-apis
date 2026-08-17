import express from 'express';
import * as operationsCtrl from '../controllers/operations.controller.js';

const router = express.Router();

router.get('/staff', operationsCtrl.getStaff);
router.get('/notifications', operationsCtrl.getNotifications);
router.get('/daily-reports', operationsCtrl.getDailyReports);

export default router;
