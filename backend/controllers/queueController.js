const Queue = require('../models/Queue');
const QueueEntry = require('../models/QueueEntry');

// @desc    Create a new queue
// @route   POST /api/queues
// @access  Private (Vendor)
const createQueue = async (req, res, next) => {
  try {
    const { name, serviceTime, maxCapacity, workingHours } = req.body;

    const queue = await Queue.create({
      vendorId: req.user._id,
      name,
      serviceTime,
      maxCapacity,
      workingHours,
      counters: [{ name: 'Counter 1', currentToken: 0 }]
    });

    res.status(201).json(queue);
  } catch (error) {
    next(error);
  }
};

// @desc    Get vendor's queues with stats
// @route   GET /api/queues/vendor
// @access  Private (Vendor)
const getVendorQueues = async (req, res, next) => {
  try {
    const queues = await Queue.find({ vendorId: req.user._id }).lean();
    
    // Calculate stats for each queue
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const queuesWithStats = await Promise.all(queues.map(async (queue) => {
      const completedToday = await QueueEntry.countDocuments({
        queueId: queue._id,
        status: 'completed',
        updatedAt: { $gte: today }
      });

      const totalToday = await QueueEntry.countDocuments({
        queueId: queue._id,
        createdAt: { $gte: today }
      });

      return {
        ...queue,
        stats: {
          todayServed: completedToday,
          completionRate: totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0
        }
      };
    }));

    res.json(queuesWithStats);
  } catch (error) {
    next(error);
  }
};

// @desc    Start/Resume queue
// @route   PATCH /api/queues/:id/start
// @access  Private (Vendor)
const startQueue = async (req, res, next) => {
  try {
    const queue = await Queue.findById(req.params.id);
    if (!queue) {
      res.status(404);
      throw new Error('Queue not found');
    }

    queue.status = 'active';
    await queue.save();

    res.json(queue);
  } catch (error) {
    next(error);
  }
};

// @desc    Pause queue
// @route   PATCH /api/queues/:id/pause
// @access  Private (Vendor)
const pauseQueue = async (req, res, next) => {
  try {
    const queue = await Queue.findById(req.params.id);
    if (!queue) {
      res.status(404);
      throw new Error('Queue not found');
    }

    queue.status = 'paused';
    await queue.save();

    res.json(queue);
  } catch (error) {
    next(error);
  }
};

// @desc    Call next customer
// @route   PATCH /api/queues/:id/next
// @access  Private (Vendor)
const callNext = async (req, res, next) => {
  try {
    const { counterName = 'Counter 1' } = req.body;
    const queue = await Queue.findById(req.params.id);
    
    if (!queue) {
      res.status(404);
      throw new Error('Queue not found');
    }

    // Find the counter
    let counter = queue.counters.find(c => c.name === counterName);
    if (!counter) {
      // Create counter on the fly if it doesn't exist (safety)
      queue.counters.push({ name: counterName, currentToken: 0 });
      counter = queue.counters[queue.counters.length - 1];
    }

    // Complete current for THIS counter if any
    if (counter.currentToken > 0) {
      const currentEntry = await QueueEntry.findOne({
        queueId: queue._id,
        tokenNumber: counter.currentToken,
        calledByCounter: counterName,
        status: 'calling'
      });

      if (currentEntry && currentEntry.calledAt) {
        const completedAt = Date.now();
        const duration = Math.round((completedAt - currentEntry.calledAt) / 60000);
        
        if (duration > 0 && duration < 120) {
          queue.serviceTime = Math.round((queue.serviceTime * 0.7) + (duration * 0.3));
        }

        currentEntry.status = 'completed';
        currentEntry.completedAt = completedAt;
        await currentEntry.save();
      }
    }

    // Find next person in overall waiting list
    const nextEntry = await QueueEntry.findOne({
      queueId: queue._id,
      status: 'waiting'
    }).sort({ tokenNumber: 1 });

    if (nextEntry) {
      counter.currentToken = nextEntry.tokenNumber;
      // Also update overall currentToken for backward compatibility
      queue.currentToken = nextEntry.tokenNumber;
      
      nextEntry.calledAt = Date.now();
      nextEntry.calledByCounter = counterName;
      nextEntry.status = 'calling';
      
      await nextEntry.save();
      await queue.save();

      // Update positions
      await QueueEntry.updateMany(
        { queueId: queue._id, status: 'waiting', tokenNumber: { $gt: nextEntry.tokenNumber } },
        { $inc: { position: -1 } }
      );

      // Socket notification
      const io = req.app.get('socketio');
      io.to(queue._id.toString()).emit('queueUpdated');
      io.to(queue._id.toString()).emit('userCalled', {
        tokenNumber: nextEntry.tokenNumber,
        userId: nextEntry.userId,
        counterName: counterName
      });

      res.json({ message: `Token #${nextEntry.tokenNumber} called to ${counterName}`, currentToken: nextEntry.tokenNumber, nextEntry, counterName });
    } else {
      counter.currentToken = 0;
      await queue.save();

      const io = req.app.get('socketio');
      io.to(queue._id.toString()).emit('queueUpdated');

      res.json({ message: 'No more customers in queue', currentToken: 0, counterName });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Skip customer (Auto-Reschedule)
// @route   PATCH /api/vendor/:id/skip
// @access  Private (Vendor)
const skipCustomer = async (req, res, next) => {
  try {
    const { counterName = 'Counter 1' } = req.body;
    const queue = await Queue.findById(req.params.id);
    
    if (!queue) {
      res.status(404);
      throw new Error('Queue not found');
    }

    const counter = queue.counters.find(c => c.name === counterName);
    if (!counter || counter.currentToken === 0) {
      res.status(404);
      throw new Error(`No active customer at ${counterName} to skip`);
    }

    const entry = await QueueEntry.findOne({
      queueId: queue._id,
      tokenNumber: counter.currentToken,
      calledByCounter: counterName,
      status: 'calling'
    });

    if (entry) {
      entry.status = 'missed';
      await entry.save();

      const waitingCount = await QueueEntry.countDocuments({
        queueId: queue._id,
        status: 'waiting'
      });

      // Create new entry for re-insertion
      const lastEntry = await QueueEntry.findOne({ queueId: queue._id }).sort({ tokenNumber: -1 });
      const newTokenNumber = (lastEntry?.tokenNumber || 0) + 1;
      
      await QueueEntry.create({
        queueId: queue._id,
        userId: entry.userId,
        tokenNumber: newTokenNumber,
        position: waitingCount + 1,
        status: 'waiting'
      });

      // Automatically call next for THIS counter
      return callNext(req, res, next);
    }
    
    res.status(400).json({ message: 'Entry not found' });
  } catch (error) {
    next(error);
  }
};

const addCounter = async (req, res, next) => {
  try {
    const { counterName } = req.body;
    const queue = await Queue.findById(req.params.id);
    
    if (!queue) {
      res.status(404);
      throw new Error('Queue not found');
    }

    const exists = queue.counters.find(c => c.name === counterName);
    if (exists) {
      res.status(400);
      throw new Error('Counter name already exists');
    }

    queue.counters.push({ name: counterName, currentToken: 0 });
    await queue.save();

    res.json(queue);
  } catch (error) {
    next(error);
  }
};

const removeCounter = async (req, res, next) => {
  try {
    const { counterName } = req.body;
    const queue = await Queue.findById(req.params.id);
    
    if (!queue) {
      res.status(404);
      throw new Error('Queue not found');
    }

    queue.counters = queue.counters.filter(c => c.name !== counterName);
    await queue.save();

    res.json(queue);
  } catch (error) {
    next(error);
  }
};

const getQueueReviews = async (req, res, next) => {
  try {
    const reviews = await QueueEntry.find({
      queueId: req.params.id,
      rating: { $exists: true }
    })
    .populate('userId', 'name')
    .sort({ updatedAt: -1 });

    res.json(reviews);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createQueue,
  getVendorQueues,
  startQueue,
  pauseQueue,
  callNext,
  skipCustomer,
  addCounter,
  removeCounter,
  getQueueReviews
};
