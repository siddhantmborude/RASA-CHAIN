const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Batch = require('../models/Batch');
const QualityReport = require('../models/QualityReport');
const { protect, authorize, auditLog } = require('../middleware/auth');
const blockchainService = require('../services/blockchainService');
const qrService = require('../services/qrService');

// Multer config for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(process.cwd(), 'uploads', 'batches');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname.replace(/\s/g, '_')}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

/**
 * @swagger
 * /api/batches:
 *   get:
 *     tags: [Batches]
 *     summary: Get all batches (filtered by role)
 */
router.get('/', protect, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, stage, herb, search } = req.query;
    const query = {};

    // Role-based filtering
    if (req.user.role === 'farmer') query.supplier = req.user._id;
    else if (req.user.role === 'manufacturer') query.manufacturer = req.user._id;

    if (status) query.status = status;
    if (stage) query.currentStage = stage;
    if (herb) query.herbName = new RegExp(herb, 'i');
    if (search) query.$text = { $search: search };

    const total = await Batch.countDocuments(query);
    const batches = await Batch.find(query)
      .populate('supplier', 'name organization')
      .populate('manufacturer', 'name organization')
      .populate('createdBy', 'name role')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      success: true,
      data: batches,
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/batches:
 *   post:
 *     tags: [Batches]
 *     summary: Create a new product batch
 */
router.post(
  '/',
  protect,
  authorize('manufacturer', 'farmer', 'admin'),
  auditLog('create_batch', 'batch', 'medium'),
  upload.array('documents', 5),
  async (req, res) => {
    try {
      const {
        herbName, scientificName, description, harvestDate, harvestLocation,
        harvestQuantity, supplierName, supplierOrganization, supplierContact,
        supplierLicense, productName, productCategory, batchSize, storageConditions,
        expiryDate, manufacturingDate, certifications, tags,
      } = req.body;

      // Generate unique Batch ID
      const batchId = `RC-${Date.now().toString(36).toUpperCase()}-${uuidv4().slice(0, 6).toUpperCase()}`;

      // Handle uploaded documents
      const documents = (req.files || []).map((f) => ({
        name: f.originalname,
        url: `/uploads/batches/${f.filename}`,
        type: 'other',
        uploadedAt: new Date(),
      }));

      // Generate data hash for tamper detection
      const batchData = { batchId, herbName, harvestDate, supplierName, createdBy: req.user._id };
      const dataHash = crypto.createHash('sha256').update(JSON.stringify(batchData)).digest('hex');

      // Record on blockchain
      const blockchainResult = await blockchainService.recordEvent({
        eventType: 'batch_created',
        batchId,
        userId: req.user._id,
        userRole: req.user.role,
        userName: req.user.name,
        payload: { herbName, harvestDate, supplierName, productCategory },
      });

      // Generate QR code
      const { base64: qrCode, verificationUrl } = await qrService.generateBatchQR(batchId);
      const qrCodeUrl = await qrService.saveQRToFile(batchId);

      // Create batch
      const batch = await Batch.create({
        batchId,
        herbName,
        scientificName,
        description,
        harvestDate,
        harvestLocation: harvestLocation ? JSON.parse(harvestLocation) : undefined,
        harvestQuantity: harvestQuantity ? JSON.parse(harvestQuantity) : undefined,
        supplierName,
        supplierOrganization,
        supplierContact,
        supplierLicense,
        supplier: req.user.role === 'farmer' ? req.user._id : undefined,
        manufacturer: req.user.role === 'manufacturer' ? req.user._id : undefined,
        manufacturerName: req.user.role === 'manufacturer' ? req.user.name : undefined,
        manufacturerOrganization: req.user.organization,
        productName: productName || herbName,
        productCategory,
        batchSize: batchSize ? JSON.parse(batchSize) : undefined,
        storageConditions,
        expiryDate,
        manufacturingDate,
        certifications: certifications ? JSON.parse(certifications) : [],
        tags: tags ? JSON.parse(tags) : [],
        documents,
        dataHash,
        blockchainTxHash: blockchainResult.txHash,
        blockNumber: blockchainResult.blockNumber,
        blockchainNetwork: blockchainResult.network,
        qrCode,
        qrCodeUrl,
        createdBy: req.user._id,
        supplyChainEvents: [{
          eventType: 'harvest',
          performedBy: req.user._id,
          performedByName: req.user.name,
          txHash: blockchainResult.txHash,
          blockNumber: blockchainResult.blockNumber,
          notes: `Batch created - ${herbName}`,
        }],
      });

      // Emit real-time notification
      const io = req.app.get('io');
      io.emit('batch:created', { batchId, herbName, createdBy: req.user.name });

      res.status(201).json({ success: true, data: batch });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

/**
 * @swagger
 * /api/batches/{id}:
 *   get:
 *     tags: [Batches]
 *     summary: Get single batch by ID or batchId
 */
router.get('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const batch = await Batch.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { batchId: id.toUpperCase() }],
    })
      .populate('supplier', 'name organization phone')
      .populate('manufacturer', 'name organization')
      .populate('createdBy', 'name role')
      .populate('regulatoryApproval.approvedBy', 'name role')
      .populate('sensorDataRefs');

    if (!batch) return res.status(404).json({ error: 'Batch not found' });
    res.json({ success: true, data: batch });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/batches/{id}/stage:
 *   patch:
 *     tags: [Batches]
 *     summary: Update processing stage
 */
router.patch(
  '/:id/stage',
  protect,
  authorize('manufacturer', 'lab', 'admin'),
  async (req, res) => {
    try {
      const { stage, notes, location } = req.body;
      const batch = await Batch.findOne({ batchId: req.params.id.toUpperCase() });
      if (!batch) return res.status(404).json({ error: 'Batch not found' });

      const stageToEvent = {
        lab_testing: 'lab_testing',
        manufacturing: 'manufacturing',
        packaging: 'packaging',
        distributed: 'distribution',
        verified: 'verification',
      };

      const eventType = stageToEvent[stage] || 'custom';

      // Record on blockchain
      const blockchainResult = await blockchainService.recordEvent({
        eventType,
        batchId: batch.batchId,
        batchRef: batch._id,
        userId: req.user._id,
        userRole: req.user.role,
        userName: req.user.name,
        payload: { stage, notes, previousStage: batch.currentStage },
      });

      batch.currentStage = stage;
      batch.supplyChainEvents.push({
        eventType,
        performedBy: req.user._id,
        performedByName: req.user.name,
        location,
        notes,
        txHash: blockchainResult.txHash,
        blockNumber: blockchainResult.blockNumber,
      });

      if (stage === 'verified') batch.isVerified = true;
      await batch.save();

      // Emit real-time update
      const io = req.app.get('io');
      io.emit('batch:updated', { batchId: batch.batchId, stage, txHash: blockchainResult.txHash });

      res.json({ success: true, data: batch, blockchain: blockchainResult });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

/**
 * @swagger
 * /api/batches/{id}/approve:
 *   patch:
 *     tags: [Batches]
 *     summary: Regulatory approval of a batch
 */
router.patch(
  '/:id/approve',
  protect,
  authorize('regulator', 'admin'),
  async (req, res) => {
    try {
      const { status, comments } = req.body;
      const batch = await Batch.findOne({ batchId: req.params.id.toUpperCase() });
      if (!batch) return res.status(404).json({ error: 'Batch not found' });

      batch.regulatoryApproval = {
        status,
        approvedBy: req.user._id,
        approvedAt: new Date(),
        comments,
      };

      if (status === 'approved') {
        batch.isVerified = true;
        batch.currentStage = 'verified';
      } else if (status === 'rejected') {
        batch.status = 'rejected';
        batch.currentStage = 'rejected';
      }

      const blockchainResult = await blockchainService.recordEvent({
        eventType: 'regulatory_approval',
        batchId: batch.batchId,
        batchRef: batch._id,
        userId: req.user._id,
        userRole: req.user.role,
        userName: req.user.name,
        payload: { status, comments },
      });

      batch.supplyChainEvents.push({
        eventType: 'verification',
        performedBy: req.user._id,
        performedByName: req.user.name,
        notes: `Regulatory ${status}: ${comments}`,
        txHash: blockchainResult.txHash,
      });

      await batch.save();
      res.json({ success: true, data: batch, blockchain: blockchainResult });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

module.exports = router;
