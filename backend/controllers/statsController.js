const QueueEntry = require('../models/QueueEntry');
const mongoose = require('mongoose');

// @desc    Get analytics for a specific queue
// @route   GET /api/vendor/:id/stats
// @access  Private (Vendor)
const getQueueStats = async (req, res, next) => {
  try {
    const queueId = new mongoose.Types.ObjectId(req.params.id);

    // 1. Hourly Joins (Peak Hours) - Last 24 hours
    const yesterday = new Date();
    yesterday.setHours(yesterday.getHours() - 24);

    const hourlyJoins = await QueueEntry.aggregate([
      { 
        $match: { 
          queueId,
          joinedAt: { $gte: yesterday }
        } 
      },
      {
        $group: {
          _id: { $hour: "$joinedAt" },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    // 2. Average Wait & Service Time
    const timeStats = await QueueEntry.aggregate([
      { 
        $match: { 
          queueId,
          status: 'completed',
          calledAt: { $exists: true },
          completedAt: { $exists: true }
        } 
      },
      {
        $group: {
          _id: null,
          avgWaitTime: { $avg: { $subtract: ["$calledAt", "$joinedAt"] } },
          avgServiceTime: { $avg: { $subtract: ["$completedAt", "$calledAt"] } },
          totalServed: { $sum: 1 }
        }
      }
    ]);

    // 3. Counter Performance
    const counterPerformance = await QueueEntry.aggregate([
      { 
        $match: { 
          queueId,
          status: 'completed',
          calledByCounter: { $exists: true }
        } 
      },
      {
        $group: {
          _id: "$calledByCounter",
          count: { $sum: 1 },
          avgServiceTime: { $avg: { $subtract: ["$completedAt", "$calledAt"] } }
        }
      }
    ]);

    res.json({
      hourlyJoins: hourlyJoins.map(h => ({ hour: `${h._id}:00`, count: h.count })),
      averages: timeStats[0] ? {
        wait: Math.round(timeStats[0].avgWaitTime / 60000), // convert ms to min
        service: Math.round(timeStats[0].avgServiceTime / 60000),
        total: timeStats[0].totalServed
      } : { wait: 0, service: 0, total: 0 },
      counterPerformance: counterPerformance.map(c => ({
        name: c._id,
        count: c.count,
        avgMinutes: Math.round(c.avgServiceTime / 60000)
      }))
    });
  } catch (error) {
    next(error);
  }
};

const ExcelJS = require('exceljs');

// ... (previous getQueueStats remains the same)

// @desc    Export queue entries to Excel format
// @route   GET /api/vendor/:id/export
// @access  Private (Vendor)
const exportQueueData = async (req, res, next) => {
  try {
    const entries = await QueueEntry.find({ queueId: req.params.id })
      .populate('userId', 'name')
      .sort({ tokenNumber: 1 });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Queue Report');

    // Define columns
    worksheet.columns = [
      { header: 'Token #', key: 'token', width: 10 },
      { header: 'Customer Name', key: 'customer', width: 25 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Joined At', key: 'joined', width: 25 },
      { header: 'Called At', key: 'called', width: 25 },
      { header: 'Completed At', key: 'completed', width: 25 },
      { header: 'Counter', key: 'counter', width: 20 },
      { header: 'Rating', key: 'rating', width: 10 },
      { header: 'Feedback', key: 'feedback', width: 40 }
    ];

    // Style the header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E7FF' } // Light indigo
    };

    // Add rows
    entries.forEach(entry => {
      worksheet.addRow({
        token: entry.tokenNumber,
        customer: entry.userId?.name || 'Anonymous',
        status: entry.status.toUpperCase(),
        joined: entry.joinedAt ? new Date(entry.joinedAt).toLocaleString() : '—',
        called: entry.calledAt ? new Date(entry.calledAt).toLocaleString() : '—',
        completed: entry.completedAt ? new Date(entry.completedAt).toLocaleString() : '—',
        counter: entry.calledByCounter || '—',
        rating: entry.rating || '—',
        feedback: entry.feedback || '—'
      });
    });

    res.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.attachment(`queue_report_${req.params.id}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getQueueStats,
  exportQueueData
};
