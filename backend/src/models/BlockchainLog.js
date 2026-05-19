const mongoose = require('mongoose');

const blockchainLogSchema = new mongoose.Schema(
  {
    txHash: {
      type: String,
      required: true,
      unique: true,
    },
    blockNumber: {
      type: Number,
    },
    blockHash: {
      type: String,
    },
    eventType: {
      type: String,
      enum: ['batch_created', 'harvest_entry', 'lab_testing', 'manufacturing', 'packaging', 'distribution', 'verification', 'verified', 'sensor_upload', 'tamper_detected', 'regulatory_approval', 'recall'],
      required: true,
    },
    batchId: {
      type: String,
      required: true,
      index: true,
    },
    batchRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Batch',
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    userRole: String,
    userName: String,
    network: {
      type: String,
      enum: ['simulated', 'polygon', 'hyperledger', 'ethereum'],
      default: 'simulated',
    },
    // The actual data that was recorded
    payload: {
      type: mongoose.Schema.Types.Mixed,
    },
    // Previous hash for chain integrity
    previousHash: String,
    // SHA-256 of (previousHash + payload + timestamp)
    dataHash: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      required: true,
    },
    gasUsed: Number,
    confirmations: {
      type: Number,
      default: 1,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'failed'],
      default: 'confirmed',
    },
    // For tamper detection
    isValid: {
      type: Boolean,
      default: true,
    },
    validatedAt: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

blockchainLogSchema.index({ txHash: 1 });
blockchainLogSchema.index({ batchId: 1 });
blockchainLogSchema.index({ eventType: 1 });
blockchainLogSchema.index({ timestamp: -1 });
blockchainLogSchema.index({ network: 1 });

module.exports = mongoose.model('BlockchainLog', blockchainLogSchema);
