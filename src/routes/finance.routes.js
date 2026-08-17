import express from 'express';
import * as financeCtrl from '../controllers/finance.controller.js';

const router = express.Router();

router.get('/invoices', financeCtrl.getInvoices);
router.get('/gold-rates', financeCtrl.getGoldRates);
router.get('/expenses', financeCtrl.getExpenses);

export default router;
