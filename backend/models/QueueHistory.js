const mongoose = require('mongoose');

const queueHistorySchema = new mongoose.Schema({
  queueId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Queue',
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  avgServiceTime: {
    type: Number,
    default: 0,
  },
  totalCustomers: {
    type: Number,
    default: 0,
  },
  completedCustomers: {
    type: Number,
    default: 0,
  },
  missedCustomers: {
    type: Number,
    default: 0,
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('QueueHistory', queueHistorySchema);
