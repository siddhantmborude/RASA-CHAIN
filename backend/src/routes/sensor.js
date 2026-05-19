const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const SensorData = require('../models/SensorData');
const Batch = require('../models/Batch');
const { protect, authorize } = require('../middleware/auth');
const blockchainService = require('../services/blockchainService');

// Multer for sensor data files
const sensorStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(process.cwd(), 'uploads', 'sensor');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => cb(null, `sensor-${Date.now()}-${file.originalname}`),
});
const sensorUpload = multer({ storage: sensorStorage });

/**
 * @swagger
 * /api/sensor/upload:
 *   post:
 *     tags: [Sensor]
 *     summary: Upload sensor data for a batch (future AI E-Tongue integration)
 *     description: |
 *       Phase 1: Manual data entry. 
 *       Phase 2: This endpoint will receive real-time data from physical E-Tongue sensor devices.
 *       Expected sensor payload includes pH, conductivity, taste profile, moisture, adulteration score, and ML confidence.
 */
router.post('/upload', protect, authorize('lab', 'manufacturer', 'admin'), sensorUpload.single('rawDataFile'), async (req, res) => {
  try {
    const {
      batchId,
      deviceId,
      deviceType,
      pH,
      conductivity,
      moisture,
      temperature,
      tasteProfile,
      adulterationScore,
      predictionConfidence,
      herbIdentification,
      qualityScore,
      notes,
    } = req.body;

    // Validate batch exists
    const batch = await Batch.findOne({ batchId: batchId.toUpperCase() });
    if (!batch) return res.status(404).json({ error: 'Batch not found' });

    const sessionId = uuidv4();

    // Build sensor data document
    const sensorDoc = {
      batchId: batchId.toUpperCase(),
      batchRef: batch._id,
      deviceId: deviceId || 'MANUAL_ENTRY',
      deviceType: deviceType || 'manual',
      sessionId,
      readings: {
        pH: pH ? { value: Number(pH), unit: 'pH' } : undefined,
        conductivity: conductivity ? { value: Number(conductivity), unit: 'μS/cm' } : undefined,
        moisture: moisture ? { value: Number(moisture), unit: '%' } : undefined,
        temperature: temperature ? { value: Number(temperature), unit: '°C' } : undefined,
        tasteProfile: tasteProfile ? JSON.parse(tasteProfile) : undefined,
      },
      mlAnalysis: {
        adulterationScore: adulterationScore ? Number(adulterationScore) : undefined,
        predictionConfidence: predictionConfidence ? Number(predictionConfidence) : undefined,
        herbIdentification: herbIdentification ? JSON.parse(herbIdentification) : undefined,
        qualityScore: qualityScore ? Number(qualityScore) : undefined,
        recommendation: adulterationScore > 60 ? 'reject' : adulterationScore > 30 ? 're_test' : 'approve',
      },
      rawData: req.file ? { filePath: `/uploads/sensor/${req.file.filename}` } : undefined,
      uploadedBy: req.user._id,
      notes,
      status: 'raw',
    };

    const sensorData = await SensorData.create(sensorDoc);

    // Link sensor data to batch
    batch.sensorDataRefs.push(sensorData._id);
    await batch.save();

    // Record on blockchain
    const blockchainResult = await blockchainService.recordEvent({
      eventType: 'sensor_upload',
      batchId: batch.batchId,
      batchRef: batch._id,
      userId: req.user._id,
      userRole: req.user.role,
      userName: req.user.name,
      payload: {
        sessionId,
        deviceId,
        adulterationScore,
        predictionConfidence,
        qualityScore,
      },
    });

    sensorData.blockchainTxHash = blockchainResult.txHash;
    await sensorData.save();

    res.status(201).json({
      success: true,
      data: sensorData,
      blockchain: { txHash: blockchainResult.txHash },
      message: 'Sensor data uploaded and recorded on blockchain',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/sensor/analyze:
 *   post:
 *     tags: [Sensor]
 *     summary: Trigger ML analysis on sensor data (future AI integration)
 *     description: |
 *       Phase 1: Returns simulated analysis results.
 *       Phase 2: Will call actual ML model inference endpoint.
 */
router.post('/analyze', protect, authorize('lab', 'manufacturer', 'admin'), async (req, res) => {
  try {
    const { sessionId, batchId } = req.body;

    let sensorData = sessionId
      ? await SensorData.findOne({ sessionId })
      : await SensorData.findOne({ batchId: batchId?.toUpperCase() }).sort({ createdAt: -1 });

    if (!sensorData) return res.status(404).json({ error: 'Sensor data not found' });

    // === PHASE 1: Simulated ML Analysis ===
    // Phase 2: Replace this block with real ML API call
    // e.g., const mlResult = await axios.post(process.env.ML_API_URL, sensorData.readings);

    const simulatedAnalysis = {
      adulterationScore: sensorData.readings?.pH
        ? Math.max(0, Math.min(100, Math.abs((sensorData.readings.pH.value - 6.5) * 20)))
        : Math.random() * 30,
      predictionConfidence: 85 + Math.random() * 10,
      qualityScore: 70 + Math.random() * 25,
      herbIdentification: {
        predictedHerb: 'Ashwagandha (Withania somnifera)',
        confidence: 91.3,
        alternativeMatches: [
          { herb: 'Shatavari', confidence: 5.2 },
          { herb: 'Brahmi', confidence: 3.5 },
        ],
      },
      recommendation: 'approve',
      modelVersion: 'RASA-ML-v1.0-phase1-simulated',
      inferenceTime: 127,
      analysis: {
        purity: 'High purity detected',
        contamination: 'No heavy metal contamination',
        moisture: 'Within acceptable range',
        activeCompounds: 'Withanolide content: 2.5% (within standard)',
      },
    };

    sensorData.mlAnalysis = simulatedAnalysis;
    sensorData.status = 'processed';
    await sensorData.save();

    res.json({
      success: true,
      data: sensorData,
      analysis: simulatedAnalysis,
      phase: 1,
      note: 'Phase 1: Simulated ML analysis. Real ML inference will be integrated in Phase 2.',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/sensor/batch/{batchId}:
 *   get:
 *     tags: [Sensor]
 *     summary: Get all sensor readings for a batch
 */
router.get('/batch/:batchId', protect, async (req, res) => {
  try {
    const readings = await SensorData.find({ batchId: req.params.batchId.toUpperCase() })
      .populate('uploadedBy', 'name role')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: readings, count: readings.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
