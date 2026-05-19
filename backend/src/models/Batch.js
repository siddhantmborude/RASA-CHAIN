const mongoose = require('mongoose');

const supplyChainEventSchema = new mongoose.Schema({
  eventType: {
    type: String,
    enum: ['harvest', 'lab_testing', 'manufacturing', 'packaging', 'distribution', 'verification', 'verified', 'custom'],
    required: true,
  },
  timestamp: { type: Date, default: Date.now },
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  performedByName: String,
  location: {
    lat: Number,
    lng: Number,
    address: String,
    city: String,
    state: String,
  },
  notes: String,
  attachments: [String],
  txHash: String,
  blockNumber: Number,
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'failed'],
    default: 'confirmed',
  },
});

const batchSchema = new mongoose.Schema(
  {
    batchId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    herbName: {
      type: String,
      required: [true, 'Herb name is required'],
      trim: true,
    },
    scientificName: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    // Harvest Details
    harvestDate: {
      type: Date,
      required: [true, 'Harvest date is required'],
    },
    harvestLocation: {
      lat: Number,
      lng: Number,
      address: String,
      city: String,
      state: String,
      country: { type: String, default: 'India' },
    },
    harvestQuantity: {
      value: Number,
      unit: { type: String, default: 'kg' },
    },

    // Supplier/Farmer Info
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    supplierName: String,
    supplierOrganization: String,
    supplierContact: String,
    supplierLicense: String,

    // Manufacturer Info
    manufacturer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    manufacturerName: String,
    manufacturerOrganization: String,
    manufacturingDate: Date,
    expiryDate: Date,

    // Product Details
    productName: String,
    productCategory: {
      type: String,
      enum: ['raw_herb', 'extract', 'powder', 'tablet', 'capsule', 'oil', 'syrup', 'other'],
      default: 'raw_herb',
    },
    batchSize: {
      value: Number,
      unit: String,
    },
    storageConditions: String,

    // Processing Stage
    currentStage: {
      type: String,
      enum: ['harvested', 'collected', 'lab_testing', 'manufacturing', 'packaging', 'distributed', 'verified', 'rejected'],
      default: 'harvested',
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'rejected', 'recalled'],
      default: 'active',
    },

    // Quality
    qualityGrade: {
      type: String,
      enum: ['A+', 'A', 'B', 'C', 'rejected'],
    },
    certifications: [String],
    labReportRef: String,

    // Blockchain
    blockchainTxHash: {
      type: String,
      unique: true,
      sparse: true,
    },
    blockNumber: Number,
    blockchainNetwork: {
      type: String,
      default: 'simulated',
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isTampered: {
      type: Boolean,
      default: false,
    },
    dataHash: String, // SHA-256 hash of batch data for tamper detection

    // QR Code
    qrCode: String, // Base64 QR code image
    qrCodeUrl: String,

    // Files/Documents
    documents: [
      {
        name: String,
        url: String,
        type: { type: String, enum: ['lab_report', 'certificate', 'image', 'other'] },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],

    // Supply Chain Events Timeline
    supplyChainEvents: [supplyChainEventSchema],

    // Created By
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Linked Sensor Data
    sensorDataRefs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'SensorData' }],

    // Regulatory
    regulatoryApproval: {
      status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
      },
      approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      approvedAt: Date,
      comments: String,
    },

    // Additional metadata
    tags: [String],
    customFields: mongoose.Schema.Types.Mixed,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
batchSchema.index({ batchId: 1 });
batchSchema.index({ herbName: 'text', productName: 'text' });
batchSchema.index({ currentStage: 1 });
batchSchema.index({ status: 1 });
batchSchema.index({ manufacturer: 1 });
batchSchema.index({ supplier: 1 });
batchSchema.index({ blockchainTxHash: 1 });
batchSchema.index({ createdAt: -1 });

// Virtual for verification URL
batchSchema.virtual('verificationUrl').get(function () {
  return `${process.env.CLIENT_URL || 'http://localhost:3000'}/verify/${this.batchId}`;
});

module.exports = mongoose.model('Batch', batchSchema);
