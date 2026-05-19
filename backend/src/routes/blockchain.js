const express = require('express');
const router = express.Router();
const BlockchainLog = require('../models/BlockchainLog');
const Batch = require('../models/Batch');
const { protect, authorize } = require('../middleware/auth');
const blockchainService = require('../services/blockchainService');

/**
 * @swagger
 * /api/blockchain/explorer:
 *   get:
 *     tags: [Blockchain]
 *     summary: Get recent blockchain transactions (explorer)
 */
router.get('/explorer', protect, async (req, res) => {
  try {
    const { page = 1, limit = 20, network, eventType } = req.query;
    const query = {};
    if (network) query.network = network;
    if (eventType) query.eventType = eventType;

    const total = await BlockchainLog.countDocuments(query);
    const transactions = await BlockchainLog.find(query)
      .populate('userId', 'name role')
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      success: true,
      data: transactions,
      pagination: { total, page: Number(page), limit: Number(limit) },
      stats: {
        totalTx: total,
        network: process.env.BLOCKCHAIN_PROVIDER || 'simulated',
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/blockchain/tx/{hash}:
 *   get:
 *     tags: [Blockchain]
 *     summary: Get transaction by hash
 */
router.get('/tx/:hash', async (req, res) => {
  try {
    const result = await blockchainService.verifyTransaction(req.params.hash);
    if (!result.valid && !result.log) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/blockchain/batch/{batchId}:
 *   get:
 *     tags: [Blockchain]
 *     summary: Get all blockchain records for a batch
 */
router.get('/batch/:batchId', async (req, res) => {
  try {
    const logs = await blockchainService.getBatchHistory(req.params.batchId.toUpperCase());
    const isValid = await blockchainService.verifyChainIntegrity(req.params.batchId.toUpperCase());

    res.json({
      success: true,
      data: logs,
      chainIntegrity: { valid: isValid, message: isValid ? 'Chain is intact' : '⚠️ Tampering detected' },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/blockchain/verify/{txHash}:
 *   get:
 *     tags: [Blockchain]
 *     summary: Verify a transaction hash
 */
router.get('/verify/:txHash', async (req, res) => {
  try {
    const result = await blockchainService.verifyTransaction(req.params.txHash);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/blockchain/stats:
 *   get:
 *     tags: [Blockchain]
 *     summary: Get blockchain network statistics
 */
router.get('/stats', protect, async (req, res) => {
  try {
    const total = await BlockchainLog.countDocuments();
    const byEvent = await BlockchainLog.aggregate([
      { $group: { _id: '$eventType', count: { $sum: 1 } } },
    ]);
    const recent = await BlockchainLog.find().sort({ timestamp: -1 }).limit(5);

    res.json({
      success: true,
      data: {
        totalTransactions: total,
        network: process.env.BLOCKCHAIN_PROVIDER || 'simulated',
        byEventType: byEvent,
        recentBlocks: recent,
        lastBlock: recent[0]?.blockNumber,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
