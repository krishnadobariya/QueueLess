const mongoose = require('mongoose');

const queueEntrySchema = new mongoose.Schema({
  queueId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Queue',
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  tokenNumber: {
    type: Number,
    required: true,
  },
  position: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['waiting', 'calling', 'completed', 'skipped', 'missed', 'left'],
    default: 'waiting',
  },
  joinedAt: {
    type: Date,
    default: Date.now,
  },
  calledAt: {
    type: Date,
  },
  completedAt: {
    type: Date,
  },
  calledByCounter: {
    type: String,
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
  },
  feedback: {
    type: String,
    maxLength: 500,
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('QueueEntry', queueEntrySchema);
