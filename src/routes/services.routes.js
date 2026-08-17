import { Router } from 'express';
import {
  getLaserJobs, getLaserStats, getLaserById, createLaserJob, updateLaserJob, deleteLaserJob
} from '../controllers/services/laserCutting.controller.js';
import {
  getXrfTests, getXrfStats, getXrfById, createXrfTest, updateXrfTest, deleteXrfTest
} from '../controllers/services/xrfTesting.controller.js';
import {
  getSolderingJobs, getSolderingStats, getSolderingById, createSolderingJob, updateSolderingJob, deleteSolderingJob
} from '../controllers/services/soldering.controller.js';
import {
  getFireAssays, getFireStats, getFireById, createFireAssay, updateFireAssay, deleteFireAssay
} from '../controllers/services/fireAssaying.controller.js';
import {
  getExchanges, getExchangeStats, getExchangeById, createExchange, updateExchange, deleteExchange
} from '../controllers/services/goldExchange.controller.js';

const router = Router();

// Laser
router.get('/laser', getLaserJobs);
router.get('/laser/meta/stats', getLaserStats);
router.get('/laser/:id', getLaserById);
router.post('/laser', createLaserJob);
router.put('/laser/:id', updateLaserJob);
router.delete('/laser/:id', deleteLaserJob);

// XRF
router.get('/xrf', getXrfTests);
router.get('/xrf/meta/stats', getXrfStats);
router.get('/xrf/:id', getXrfById);
router.post('/xrf', createXrfTest);
router.put('/xrf/:id', updateXrfTest);
router.delete('/xrf/:id', deleteXrfTest);

// Soldering
router.get('/soldering', getSolderingJobs);
router.get('/soldering/meta/stats', getSolderingStats);
router.get('/soldering/:id', getSolderingById);
router.post('/soldering', createSolderingJob);
router.put('/soldering/:id', updateSolderingJob);
router.delete('/soldering/:id', deleteSolderingJob);

// Fire Assay
router.get('/fire', getFireAssays);
router.get('/fire/meta/stats', getFireStats);
router.get('/fire/:id', getFireById);
router.post('/fire', createFireAssay);
router.put('/fire/:id', updateFireAssay);
router.delete('/fire/:id', deleteFireAssay);

// Gold Exchange
router.get('/exchange', getExchanges);
router.get('/exchange/meta/stats', getExchangeStats);
router.get('/exchange/:id', getExchangeById);
router.post('/exchange', createExchange);
router.put('/exchange/:id', updateExchange);
router.delete('/exchange/:id', deleteExchange);

export default router;
