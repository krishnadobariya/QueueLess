const Queue = require('../models/Queue');
const QueueEntry = require('../models/QueueEntry');

// @desc    Get all available queues
// @route   GET /api/customer/queues
// @access  Public
const getAllQueues = async (req, res, next) => {
  try {
    const queues = await Queue.find({ status: { $ne: 'closed' } }).populate('vendorId', 'name');
    res.json(queues);
  } catch (error) {
    next(error);
  }
};

// @desc    Join a queue
// @route   POST /api/customer/queues/:id/join
// @access  Private (Customer)
const joinQueue = async (req, res, next) => {
  try {
    const queue = await Queue.findById(req.params.id);
    if (!queue) {
      res.status(404);
      throw new Error('Queue not found');
    }

    if (queue.status === 'closed') {
      res.status(400);
      throw new Error('Queue is currently closed');
    }

    // Check if user already in this queue
    const alreadyJoined = await QueueEntry.findOne({
      queueId: queue._id,
      userId: req.user._id,
      status: { $in: ['waiting', 'calling'] }
    });

    if (alreadyJoined) {
      res.status(400);
      throw new Error('You are already in this queue');
    }

    // Calculate token and position
    const lastEntry = await QueueEntry.findOne({ queueId: queue._id }).sort({ tokenNumber: -1 });
    const tokenNumber = lastEntry ? lastEntry.tokenNumber + 1 : 1;
    
    // Position is number of people currently waiting
    const waitingCount = await QueueEntry.countDocuments({ queueId: queue._id, status: 'waiting' });
    const position = waitingCount + 1;

    const entry = await QueueEntry.create({
      queueId: queue._id,
      userId: req.user._id,
      tokenNumber,
      position
    });

    // Update queue last token
    queue.lastToken = tokenNumber;
    await queue.save();

    // Socket notification
    const io = req.app.get('socketio');
    io.to(queue._id.toString()).emit('queueUpdated');

    res.status(201).json(entry);
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's queue status
// @route   GET /api/customer/status
// @access  Private (Customer)
const getMyStatus = async (req, res, next) => {
  try {
    let entry = await QueueEntry.findOne({
      userId: req.user._id,
      status: { $in: ['waiting', 'calling'] }
    }).populate('queueId');

    if (!entry) {
      // Check for the most recent completed entry that hasn't been reviewed
      entry = await QueueEntry.findOne({
        userId: req.user._id,
        status: 'completed',
        rating: { $exists: false }
      }).populate('queueId').sort({ updatedAt: -1 });

      if (!entry) {
        return res.json({ joined: false });
      }
    }

    // Re-verify position just in case
    const waitingBefore = await QueueEntry.countDocuments({
      queueId: entry.queueId._id,
      status: 'waiting',
      tokenNumber: { $lt: entry.tokenNumber }
    });
    
    entry.position = waitingBefore + 1;
    await entry.save();

    if (entry.status === 'calling') {
      return res.json({
        joined: true,
        entry,
        isCalled: true,
        counterName: entry.calledByCounter
      });
    }

    res.json({
      joined: true,
      entry,
      isCalled: false,
      estimatedWaitTime: entry.position * (entry.queueId.serviceTime || 10)
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Leave queue
// @route   DELETE /api/customer/queues/:id/leave
// @access  Private (Customer)
const leaveQueue = async (req, res, next) => {
  try {
    const entry = await QueueEntry.findOneAndUpdate(
      { queueId: req.params.id, userId: req.user._id, status: 'waiting' },
      { status: 'left' }
    );

    if (!entry) {
      res.status(404);
      throw new Error('Active queue entry not found');
    }

    // Update positions for everyone behind
    await QueueEntry.updateMany(
      { queueId: req.params.id, status: 'waiting', tokenNumber: { $gt: entry.tokenNumber } },
      { $inc: { position: -1 } }
    );

    // Socket notification
    const io = req.app.get('socketio');
    io.to(req.params.id).emit('queueUpdated');

    res.json({ message: 'Left queue successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single queue details (Public)
// @route   GET /api/customer/queues/:id
// @access  Public
const getQueueDetails = async (req, res, next) => {
  try {
    const queue = await Queue.findById(req.params.id).populate('vendorId', 'name');
    if (!queue) {
      res.status(404);
      throw new Error('Queue not found');
    }
    res.json(queue);
  } catch (error) {
    next(error);
  }
};

// @desc    Submit review for a completed entry
// @route   PATCH /api/customer/entries/:id/review
// @access  Private (Customer)
const submitReview = async (req, res, next) => {
  try {
    const { rating, feedback } = req.body;
    const entry = await QueueEntry.findOne({
      _id: req.params.id,
      userId: req.user._id,
      status: 'completed'
    });

    if (!entry) {
      res.status(404);
      throw new Error('Completed entry not found');
    }

    if (entry.rating) {
      res.status(400);
      throw new Error('Review already submitted for this visit');
    }

    entry.rating = rating;
    entry.feedback = feedback;
    await entry.save();

    res.json({ message: 'Review submitted successfully', entry });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllQueues,
  getQueueDetails,
  joinQueue,
  getMyStatus,
  leaveQueue,
  submitReview
};
