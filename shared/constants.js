/**
 * RASA-CHAIN Shared Blockchain Types & Constants
 * Used by both frontend and backend
 */

const BLOCKCHAIN_EVENTS = {
  BATCH_CREATED: 'batch_created',
  HARVEST_ENTRY: 'harvest_entry',
  LAB_TESTING: 'lab_testing',
  MANUFACTURING: 'manufacturing',
  PACKAGING: 'packaging',
  DISTRIBUTION: 'distribution',
  VERIFICATION: 'verification',
  SENSOR_UPLOAD: 'sensor_upload',
  TAMPER_DETECTED: 'tamper_detected',
  REGULATORY_APPROVAL: 'regulatory_approval',
  RECALL: 'recall',
};

const USER_ROLES = {
  ADMIN: 'admin',
  FARMER: 'farmer',
  MANUFACTURER: 'manufacturer',
  LAB: 'lab',
  REGULATOR: 'regulator',
  CONSUMER: 'consumer',
};

const BATCH_STAGES = {
  HARVESTED: 'harvested',
  COLLECTED: 'collected',
  LAB_TESTING: 'lab_testing',
  MANUFACTURING: 'manufacturing',
  PACKAGING: 'packaging',
  DISTRIBUTED: 'distributed',
  VERIFIED: 'verified',
  REJECTED: 'rejected',
};

const BLOCKCHAIN_PROVIDERS = {
  SIMULATED: 'simulated',
  POLYGON: 'polygon',
  HYPERLEDGER: 'hyperledger',
  ETHEREUM: 'ethereum',
};

/**
 * Sensor data schema for E-Tongue hardware integration
 * Phase 2: This will be the actual payload from AI sensors
 */
const SENSOR_DATA_SCHEMA = {
  // Required fields from hardware
  deviceId: String,
  sessionId: String,
  batchId: String,
  timestamp: Date,

  // Core sensor readings
  pH: { value: Number, unit: 'pH' },
  conductivity: { value: Number, unit: 'μS/cm' },
  moisture: { value: Number, unit: '%' },
  temperature: { value: Number, unit: '°C' },

  // E-Tongue taste profile (0-100 scale)
  tasteProfile: {
    sweetness: Number,
    bitterness: Number,
    sourness: Number,
    saltiness: Number,
    umami: Number,
    astringency: Number,
    pungency: Number,
  },

  // ML Analysis outputs
  mlAnalysis: {
    adulterationScore: Number, // 0-100 (0=pure, 100=adulterated)
    predictionConfidence: Number, // 0-100%
    qualityScore: Number, // 0-100
    herbIdentification: {
      predictedHerb: String,
      confidence: Number,
    },
    recommendation: String, // 'approve' | 'reject' | 're_test' | 'manual_review'
    modelVersion: String,
    inferenceTime: Number, // milliseconds
  },
};

module.exports = {
  BLOCKCHAIN_EVENTS,
  USER_ROLES,
  BATCH_STAGES,
  BLOCKCHAIN_PROVIDERS,
  SENSOR_DATA_SCHEMA,
};
