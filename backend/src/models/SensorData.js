const mongoose = require('mongoose');

/**
 * SensorData Model - Future-ready for AI E-Tongue sensor integration
 * This model stores data from AI-powered herbal quality testing hardware.
 * Phase 1: Data structure defined but populated manually or via placeholder APIs.
 * Phase 2: Will receive real-time data from physical E-Tongue sensors.
 */
const sensorDataSchema = new mongoose.Schema(
  {
    batchId: {
      type: String,
      required: true,
      index: true,
    },
    batchRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Batch',
    },
    deviceId: {
      type: String,
      trim: true,
      default: 'MANUAL_ENTRY',
    },
    deviceType: {
      type: String,
      enum: ['e_tongue', 'spectrometer', 'hplc', 'manual', 'simulated'],
      default: 'manual',
    },
    sessionId: {
      type: String,
      unique: true,
    },
    // Core Sensor Readings (E-Tongue Parameters)
    readings: {
      pH: {
        value: Number,
        unit: { type: String, default: 'pH' },
        normalRange: { min: Number, max: Number },
        status: { type: String, enum: ['normal', 'abnormal', 'warning'] },
      },
      conductivity: {
        value: Number,
        unit: { type: String, default: 'μS/cm' },
        normalRange: { min: Number, max: Number },
        status: { type: String, enum: ['normal', 'abnormal', 'warning'] },
      },
      moisture: {
        value: Number,
        unit: { type: String, default: '%' },
        normalRange: { min: Number, max: Number },
        status: { type: String, enum: ['normal', 'abnormal', 'warning'] },
      },
      temperature: {
        value: Number,
        unit: { type: String, default: '°C' },
      },
      // Taste Profile (E-Tongue specific)
      tasteProfile: {
        sweetness: { type: Number, min: 0, max: 100 },
        bitterness: { type: Number, min: 0, max: 100 },
        sourness: { type: Number, min: 0, max: 100 },
        saltiness: { type: Number, min: 0, max: 100 },
        umami: { type: Number, min: 0, max: 100 },
        astringency: { type: Number, min: 0, max: 100 },
        pungency: { type: Number, min: 0, max: 100 },
      },
      // Optical / Spectral
      turbidity: { value: Number, unit: { type: String, default: 'NTU' } },
      colorIndex: { r: Number, g: Number, b: Number },
    },
    // ML/AI Analysis Results
    mlAnalysis: {
      adulterationScore: {
        type: Number,
        min: 0,
        max: 100,
        description: 'Probability of adulteration (0=pure, 100=adulterated)',
      },
      predictionConfidence: {
        type: Number,
        min: 0,
        max: 100,
      },
      herbIdentification: {
        predictedHerb: String,
        confidence: Number,
        alternativeMatches: [{ herb: String, confidence: Number }],
      },
      qualityScore: { type: Number, min: 0, max: 100 },
      recommendation: {
        type: String,
        enum: ['approve', 'reject', 're_test', 'manual_review'],
      },
      modelVersion: String,
      inferenceTime: Number, // ms
    },
    // Raw sensor data for future reprocessing
    rawData: {
      type: mongoose.Schema.Types.Mixed,
    },
    // Data quality metadata
    dataQuality: {
      isCalibrated: { type: Boolean, default: false },
      calibrationId: String,
      signalNoise: Number,
      dataCompleteness: { type: Number, min: 0, max: 100 },
    },
    // Status
    status: {
      type: String,
      enum: ['raw', 'processed', 'validated', 'flagged'],
      default: 'raw',
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    // Blockchain reference
    blockchainTxHash: String,
    // Linked Quality Report
    qualityReportRef: { type: mongoose.Schema.Types.ObjectId, ref: 'QualityReport' },
    notes: String,
  },
  {
    timestamps: true,
  }
);

sensorDataSchema.index({ batchId: 1 });
sensorDataSchema.index({ deviceId: 1 });
sensorDataSchema.index({ createdAt: -1 });

module.exports = mongoose.model('SensorData', sensorDataSchema);
