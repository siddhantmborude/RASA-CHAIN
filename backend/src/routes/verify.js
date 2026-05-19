const express = require('express');
const router = express.Router();
const Batch = require('../models/Batch');
const BlockchainLog = require('../models/BlockchainLog');
const QualityReport = require('../models/QualityReport');
const { optionalAuth } = require('../middleware/auth');
const blockchainService = require('../services/blockchainService');

/**
 * @swagger
 * /api/verify/{batchId}:
 *   get:
 *     tags: [Verify]
 *     summary: Public batch verification endpoint (consumer-facing)
 *     security: []
 */
router.get('/:batchId', optionalAuth, async (req, res) => {
  try {
    const batchId = req.params.batchId.toUpperCase();

    const batch = await Batch.findOne({ batchId })
      .populate('supplier', 'name organization phone address')
      .populate('manufacturer', 'name organization')
      .populate('createdBy', 'name role');

    if (!batch) {
      return res.status(404).json({
        success: false,
        error: 'Batch not found',
        message: 'This QR code or Batch ID does not correspond to a registered product.',
      });
    }

    // Get blockchain history
    const blockchainHistory = await blockchainService.getBatchHistory(batchId);
    const chainIntegrity = await blockchainService.verifyChainIntegrity(batchId);

    // Get quality reports (public ones only)
    const qualityReports = await QualityReport.find({ batchId, isPublic: true });

    // Log verification event on blockchain
    await blockchainService.recordEvent({
      eventType: 'verification',
      batchId: batch.batchId,
      batchRef: batch._id,
      userId: req.user?._id,
      userRole: req.user?.role || 'consumer',
      userName: req.user?.name || 'Anonymous',
      payload: { verifiedAt: new Date(), source: 'qr_scan' },
    });

    // Build response - sanitized for public consumption
    const response = {
      success: true,
      verified: batch.isVerified,
      tamperStatus: {
        isTampered: !chainIntegrity,
        chainIntegrity,
        message: chainIntegrity ? '✅ Blockchain records are intact' : '⚠️ Potential data tampering detected',
      },
      batch: {
        batchId: batch.batchId,
        herbName: batch.herbName,
        scientificName: batch.scientificName,
        productName: batch.productName,
        productCategory: batch.productCategory,
        currentStage: batch.currentStage,
        status: batch.status,
        qualityGrade: batch.qualityGrade,
        isVerified: batch.isVerified,
        regulatoryApproval: batch.regulatoryApproval,
        certifications: batch.certifications,
        harvestDate: batch.harvestDate,
        harvestLocation: batch.harvestLocation,
        expiryDate: batch.expiryDate,
        manufacturingDate: batch.manufacturingDate,
        storageConditions: batch.storageConditions,
        supplier: batch.supplier
          ? { name: batch.supplier.name, organization: batch.supplier.organization }
          : { name: batch.supplierName, organization: batch.supplierOrganization },
        manufacturer: batch.manufacturer
          ? { name: batch.manufacturer.name, organization: batch.manufacturer.organization }
          : { name: batch.manufacturerName, organization: batch.manufacturerOrganization },
        blockchainTxHash: batch.blockchainTxHash,
        blockchainNetwork: batch.blockchainNetwork,
        createdAt: batch.createdAt,
      },
      supplyChainTimeline: batch.supplyChainEvents,
      blockchainRecords: blockchainHistory.map((log) => ({
        txHash: log.txHash,
        eventType: log.eventType,
        timestamp: log.timestamp,
        blockNumber: log.blockNumber,
        performedBy: log.userName,
        status: log.status,
        isValid: log.isValid,
      })),
      qualityReports,
      verificationTimestamp: new Date(),
    };

    res.json(response);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/verify/search:
 *   post:
 *     tags: [Verify]
 *     summary: Search by batch ID or QR content
 *     security: []
 */
router.post('/search', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: 'Search query required' });

    // Try parsing as QR JSON
    let batchId = query.trim().toUpperCase();
    try {
      const parsed = JSON.parse(query);
      if (parsed.batchId) batchId = parsed.batchId.toUpperCase();
    } catch (e) { /* not JSON */ }

    const batch = await Batch.findOne({ batchId }).select('batchId herbName productName currentStage isVerified status blockchainTxHash');

    if (!batch) return res.status(404).json({ success: false, error: 'Batch not found' });
    res.json({ success: true, data: batch, redirectUrl: `/verify/${batchId}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
