const express = require('express');
const router = express.Router();
const {
  createQueue,
  getVendorQueues,
  startQueue,
  pauseQueue,
  callNext,
  skipCustomer,
  addCounter,
  removeCounter,
  getQueueReviews
} = require('../controllers/queueController');
const { getQueueStats, exportQueueData } = require('../controllers/statsController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);
router.use(authorize('vendor'));

router.post('/', createQueue);
router.get('/vendor', getVendorQueues);
router.get('/:id/stats', getQueueStats);
router.get('/:id/export', exportQueueData);
router.patch('/:id/start', startQueue);
router.patch('/:id/pause', pauseQueue);
router.patch('/:id/next', callNext);
router.patch('/:id/skip', skipCustomer);
router.patch('/:id/counters/add', addCounter);
router.patch('/:id/counters/remove', removeCounter);
router.get('/:id/reviews', getQueueReviews);

module.exports = router;
