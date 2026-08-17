import express from 'express';
import * as complianceCtrl from '../controllers/compliance.controller.js';

const router = express.Router();

router.get('/docs', complianceCtrl.getComplianceDocs);
router.get('/calibration', complianceCtrl.getCalibrationLogs);

export default router;
