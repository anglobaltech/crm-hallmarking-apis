import express from 'express';
import * as workflowCtrl from '../controllers/workflow.controller.js';

const router = express.Router();

router.post('/orders', workflowCtrl.createOrder);
router.get('/orders', workflowCtrl.getOrders);

router.get('/articles', workflowCtrl.getArticles);
router.get('/articles/:id', workflowCtrl.getArticleById);
router.patch('/articles/:id/status', workflowCtrl.updateArticleStatus);
router.put('/articles/:id', workflowCtrl.updateArticle);
router.delete('/articles/:id', workflowCtrl.deleteArticle);

router.post('/billing', workflowCtrl.createBill);
router.get('/billing', workflowCtrl.getBills);

router.get('/reminders', workflowCtrl.getReminders);
router.post('/reminders', workflowCtrl.createReminder);
router.patch('/reminders/:id', workflowCtrl.updateReminder);
router.delete('/reminders/:id', workflowCtrl.deleteReminder);

router.get('/stats', workflowCtrl.getStats);

export default router;
