const express = require('express');
const router = express.Router();
const {
  getAllQueues,
  joinQueue,
  getMyStatus,
  getQueueDetails,
  leaveQueue,
  submitReview
} = require('../controllers/customerController');
const { protect } = require('../middleware/authMiddleware');

router.get('/queues', getAllQueues);
router.get('/queues/:id', getQueueDetails);
router.use(protect);
router.post('/queues/:id/join', joinQueue);
router.get('/status', getMyStatus);
router.delete('/queues/:id/leave', leaveQueue);
router.patch('/entries/:id/review', submitReview);

module.exports = router;
