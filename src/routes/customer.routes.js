import { Router } from 'express';
import {
  getJewellers,
  getJewellersStats,
  getJewellerById,
  createJeweller,
  updateJeweller,
  deleteJeweller
} from '../controllers/customer.controller.js';

const router = Router();

router.get('/', getJewellers);
router.get('/meta/stats', getJewellersStats);
router.get('/:id', getJewellerById);
router.post('/', createJeweller);
router.put('/:id', updateJeweller);
router.delete('/:id', deleteJeweller);

export default router;
