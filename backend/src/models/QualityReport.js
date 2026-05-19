const mongoose = require('mongoose');

const qualityReportSchema = new mongoose.Schema(
  {
    batchId: {
      type: String,
      required: true,
      index: true,
    },
    batchRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Batch',
      required: true,
    },
    reportId: {
      type: String,
      unique: true,
      required: true,
    },
    labName: {
      type: String,
      required: true,
    },
    labId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    labLicense: String,
    testDate: {
      type: Date,
      required: true,
    },
    reportDate: {
      type: Date,
      default: Date.now,
    },
    // Test Parameters
    parameters: [
      {
        name: String,
        value: String,
        unit: String,
        referenceRange: String,
        status: { type: String, enum: ['pass', 'fail', 'warning'] },
      },
    ],
    // Specific Herbal Tests
    herbSpecificTests: {
      moistureContent: { value: Number, unit: String, pass: Boolean },
      ashContent: { value: Number, unit: String, pass: Boolean },
      heavyMetals: {
        lead: { value: Number, unit: String, pass: Boolean },
        arsenic: { value: Number, unit: String, pass: Boolean },
        mercury: { value: Number, unit: String, pass: Boolean },
        cadmium: { value: Number, unit: String, pass: Boolean },
      },
      pesticides: { detected: Boolean, details: String },
      microbial: {
        totalCount: { value: Number, pass: Boolean },
        ecoli: { detected: Boolean, pass: Boolean },
        salmonella: { detected: Boolean, pass: Boolean },
      },
      activeCompounds: [{ name: String, percentage: Number, pass: Boolean }],
      adulteration: { detected: Boolean, score: Number, details: String },
    },
    overallResult: {
      type: String,
      enum: ['passed', 'failed', 'conditional'],
      required: true,
    },
    grade: {
      type: String,
      enum: ['A+', 'A', 'B', 'C', 'rejected'],
    },
    remarks: String,
    recommendations: String,
    attachmentUrl: String,
    // Blockchain record
    blockchainTxHash: String,
    // Sensor data link for future AI integration
    sensorDataRef: { type: mongoose.Schema.Types.ObjectId, ref: 'SensorData' },
    isPublic: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

qualityReportSchema.index({ batchId: 1 });
qualityReportSchema.index({ reportId: 1 });
qualityReportSchema.index({ overallResult: 1 });

module.exports = mongoose.model('QualityReport', qualityReportSchema);
