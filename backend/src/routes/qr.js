const express = require('express');
const router = express.Router();
const Batch = require('../models/Batch');
const qrService = require('../services/qrService');
const { protect } = require('../middleware/auth');

/**
 * @swagger
 * /api/qr/{batchId}:
 *   get:
 *     tags: [QR]
 *     summary: Get QR code for a batch (base64)
 */
router.get('/:batchId', protect, async (req, res) => {
  try {
    const batch = await Batch.findOne({ batchId: req.params.batchId.toUpperCase() }).select('batchId qrCode qrCodeUrl');
    if (!batch) return res.status(404).json({ error: 'Batch not found' });

    if (!batch.qrCode) {
      const { base64, verificationUrl } = await qrService.generateBatchQR(batch.batchId);
      batch.qrCode = base64;
      batch.qrCodeUrl = await qrService.saveQRToFile(batch.batchId);
      await batch.save();
    }

    res.json({ success: true, data: { batchId: batch.batchId, qrCode: batch.qrCode, qrCodeUrl: batch.qrCodeUrl } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/qr/regenerate/{batchId}:
 *   post:
 *     tags: [QR]
 *     summary: Regenerate QR code for a batch
 */
router.post('/regenerate/:batchId', protect, async (req, res) => {
  try {
    const batch = await Batch.findOne({ batchId: req.params.batchId.toUpperCase() });
    if (!batch) return res.status(404).json({ error: 'Batch not found' });

    const { base64, verificationUrl } = await qrService.generateBatchQR(batch.batchId);
    const qrCodeUrl = await qrService.saveQRToFile(batch.batchId);

    batch.qrCode = base64;
    batch.qrCodeUrl = qrCodeUrl;
    await batch.save();

    res.json({ success: true, data: { batchId: batch.batchId, qrCode: base64, qrCodeUrl, verificationUrl } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
