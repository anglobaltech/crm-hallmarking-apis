import express from 'express';
import * as billingController from '../controllers/billing.controller.js';

const router = express.Router();

router.get('/next-invoice-number', billingController.getNextInvoiceNumber);
router.get('/invoices', billingController.getInvoices);
router.get('/invoices/:id', billingController.getInvoiceById);
router.post('/invoices', billingController.createInvoice);
router.put('/invoices/:id', billingController.updateInvoice);
router.delete('/invoices/:id', billingController.deleteInvoice);

export default router;
