const express = require('express');
const router = express.Router();
const Batch = require('../models/Batch');
const User = require('../models/User');
const BlockchainLog = require('../models/BlockchainLog');
const QualityReport = require('../models/QualityReport');
const AuditLog = require('../models/AuditLog');
const { protect, authorize } = require('../middleware/auth');

/**
 * @swagger
 * /api/dashboard/stats:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get dashboard statistics for the current user role
 */
router.get('/stats', protect, async (req, res) => {
  try {
    const { role, _id } = req.user;
    const batchFilter = role === 'farmer' ? { supplier: _id } : role === 'manufacturer' ? { manufacturer: _id } : {};

    const [
      totalBatches,
      verifiedBatches,
      pendingApproval,
      rejectedBatches,
      totalBlockchainTx,
      totalUsers,
      recentBatches,
      recentTx,
      batchesByStage,
      batchesByMonth,
    ] = await Promise.all([
      Batch.countDocuments(batchFilter),
      Batch.countDocuments({ ...batchFilter, isVerified: true }),
      Batch.countDocuments({ ...batchFilter, 'regulatoryApproval.status': 'pending' }),
      Batch.countDocuments({ ...batchFilter, status: 'rejected' }),
      BlockchainLog.countDocuments(),
      User.countDocuments(),
      Batch.find(batchFilter).sort({ createdAt: -1 }).limit(5)
        .populate('createdBy', 'name role').select('batchId herbName currentStage status isVerified createdAt blockchainTxHash'),
      BlockchainLog.find().sort({ timestamp: -1 }).limit(8)
        .populate('userId', 'name role').select('txHash eventType batchId timestamp status blockNumber'),
      Batch.aggregate([
        { $match: batchFilter },
        { $group: { _id: '$currentStage', count: { $sum: 1 } } },
      ]),
      Batch.aggregate([
        { $match: batchFilter },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        { $limit: 12 },
      ]),
    ]);

    // Top herbs
    const topHerbs = await Batch.aggregate([
      { $match: batchFilter },
      { $group: { _id: '$herbName', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalBatches,
          verifiedBatches,
          pendingApproval,
          rejectedBatches,
          verificationRate: totalBatches > 0 ? ((verifiedBatches / totalBatches) * 100).toFixed(1) : 0,
          totalBlockchainTx,
          totalUsers: role === 'admin' ? totalUsers : undefined,
        },
        charts: {
          batchesByStage,
          batchesByMonth,
          topHerbs,
        },
        recentActivity: {
          batches: recentBatches,
          transactions: recentTx,
        },
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/dashboard/analytics:
 *   get:
 *     tags: [Dashboard]
 *     summary: Advanced analytics (admin/regulator only)
 */
router.get('/analytics', protect, authorize('admin', 'regulator'), async (req, res) => {
  try {
    const [
      usersByRole,
      batchesByCategory,
      qualityDistribution,
      monthlyGrowth,
    ] = await Promise.all([
      User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
      Batch.aggregate([{ $group: { _id: '$productCategory', count: { $sum: 1 } } }]),
      Batch.aggregate([{ $group: { _id: '$qualityGrade', count: { $sum: 1 } } }]),
      Batch.aggregate([
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
            total: { $sum: 1 },
            verified: { $sum: { $cond: ['$isVerified', 1, 0] } },
          },
        },
        { $sort: { _id: 1 } },
        { $limit: 12 },
      ]),
    ]);

    res.json({
      success: true,
      data: { usersByRole, batchesByCategory, qualityDistribution, monthlyGrowth },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
