/**
 * RASA-CHAIN Database Seeder
 * Run: npm run seed
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const Batch = require('../models/Batch');
const BlockchainLog = require('../models/BlockchainLog');
const QualityReport = require('../models/QualityReport');
const AuditLog = require('../models/AuditLog');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rasa-chain';

const herbs = [
  { name: 'Ashwagandha', scientific: 'Withania somnifera', category: 'root' },
  { name: 'Turmeric', scientific: 'Curcuma longa', category: 'rhizome' },
  { name: 'Brahmi', scientific: 'Bacopa monnieri', category: 'leaf' },
  { name: 'Neem', scientific: 'Azadirachta indica', category: 'leaf' },
  { name: 'Shatavari', scientific: 'Asparagus racemosus', category: 'root' },
  { name: 'Giloy', scientific: 'Tinospora cordifolia', category: 'stem' },
  { name: 'Triphala', scientific: 'Various', category: 'fruit' },
  { name: 'Amla', scientific: 'Phyllanthus emblica', category: 'fruit' },
];

const generateTxHash = () => '0x' + crypto.createHash('sha256').update(`${uuidv4()}-${Date.now()}`).digest('hex');
const generateBatchId = () => `RC-${Date.now().toString(36).toUpperCase()}-${uuidv4().slice(0, 6).toUpperCase()}`;

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log('📦 Connected to MongoDB');

  // Clear existing data
  await Promise.all([
    User.deleteMany({}),
    Batch.deleteMany({}),
    BlockchainLog.deleteMany({}),
    QualityReport.deleteMany({}),
    AuditLog.deleteMany({}),
  ]);
  console.log('🧹 Cleared existing data');

  // Create Users
  const users = await User.create([
    {
      name: 'Admin User',
      email: 'admin@rasa-chain.io',
      password: 'Admin@123',
      role: 'admin',
      organization: 'RASA-CHAIN HQ',
      isVerified: true,
      phone: '+91-9876543210',
    },
    {
      name: 'Rajesh Kumar',
      email: 'farmer@rasa-chain.io',
      password: 'Farmer@123',
      role: 'farmer',
      organization: 'Green Valley Herbs Farm',
      isVerified: true,
      phone: '+91-9876543211',
      address: { city: 'Rishikesh', state: 'Uttarakhand', country: 'India' },
      licenseNumber: 'FARM-2024-001',
    },
    {
      name: 'Priya Sharma',
      email: 'manufacturer@rasa-chain.io',
      password: 'Mfg@123',
      role: 'manufacturer',
      organization: 'AyurVeda Pharmaceuticals Pvt. Ltd.',
      isVerified: true,
      phone: '+91-9876543212',
      licenseNumber: 'MFG-AYUR-2024-042',
    },
    {
      name: 'Dr. Anand Patel',
      email: 'lab@rasa-chain.io',
      password: 'Lab@123',
      role: 'lab',
      organization: 'National Herbal Testing Laboratory',
      isVerified: true,
      licenseNumber: 'LAB-NABL-2024-117',
    },
    {
      name: 'Commissioner Singh',
      email: 'regulator@rasa-chain.io',
      password: 'Reg@123',
      role: 'regulator',
      organization: 'AYUSH Ministry - Quality Control',
      isVerified: true,
    },
    {
      name: 'Consumer User',
      email: 'consumer@rasa-chain.io',
      password: 'Consumer@123',
      role: 'consumer',
      isVerified: true,
    },
  ]);
  console.log(`✅ Created ${users.length} users`);

  const [admin, farmer, manufacturer, lab, regulator] = users;

  // Create Batches
  const batches = [];
  for (let i = 0; i < herbs.length; i++) {
    const herb = herbs[i];
    const batchId = generateBatchId();
    const txHash = generateTxHash();
    const dataHash = crypto.createHash('sha256').update(JSON.stringify({ batchId, herb: herb.name })).digest('hex');

    const stages = ['harvested', 'lab_testing', 'manufacturing', 'packaging', 'distributed', 'verified'];
    const currentStageIndex = Math.min(i, stages.length - 1);
    const currentStage = stages[currentStageIndex];
    const isVerified = currentStage === 'verified';

    const batch = await Batch.create({
      batchId,
      herbName: herb.name,
      scientificName: herb.scientific,
      description: `Premium quality ${herb.name} sourced from certified organic farms in Uttarakhand`,
      harvestDate: new Date(Date.now() - (30 + i * 5) * 24 * 60 * 60 * 1000),
      harvestLocation: {
        lat: 30.0869 + i * 0.01,
        lng: 78.2676 + i * 0.01,
        address: 'Village Tapovan',
        city: 'Rishikesh',
        state: 'Uttarakhand',
        country: 'India',
      },
      harvestQuantity: { value: 500 + i * 100, unit: 'kg' },
      supplierName: farmer.name,
      supplierOrganization: farmer.organization,
      supplierContact: farmer.phone,
      supplierLicense: farmer.licenseNumber,
      supplier: farmer._id,
      manufacturer: manufacturer._id,
      manufacturerName: manufacturer.name,
      manufacturerOrganization: manufacturer.organization,
      manufacturingDate: new Date(Date.now() - (20 + i * 3) * 24 * 60 * 60 * 1000),
      expiryDate: new Date(Date.now() + (365 + i * 30) * 24 * 60 * 60 * 1000),
      productName: `Pure ${herb.name} Extract`,
      productCategory: i % 2 === 0 ? 'extract' : 'powder',
      batchSize: { value: 200 + i * 50, unit: 'kg' },
      storageConditions: 'Cool, dry place. Temperature: 15-25°C. Humidity < 60%',
      currentStage,
      status: 'active',
      qualityGrade: ['A+', 'A', 'A+', 'B', 'A', 'A+', 'A', 'A'][i],
      certifications: ['ISO 22000', 'GMP Certified', 'AYUSH Approved'],
      blockchainTxHash: txHash,
      blockNumber: 1000000 + i * 1234,
      blockchainNetwork: 'simulated',
      isVerified,
      dataHash,
      tags: [herb.name.toLowerCase(), 'ayurvedic', 'organic'],
      createdBy: manufacturer._id,
      regulatoryApproval: isVerified ? {
        status: 'approved',
        approvedBy: regulator._id,
        approvedAt: new Date(),
        comments: 'All quality parameters within acceptable range.',
      } : { status: currentStageIndex < 3 ? 'pending' : 'pending' },
      supplyChainEvents: [
        {
          eventType: 'harvest',
          performedBy: farmer._id,
          performedByName: farmer.name,
          txHash: generateTxHash(),
          notes: `Harvested ${herb.name} from organic certified farm`,
          timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
        ...(currentStageIndex >= 1 ? [{
          eventType: 'lab_testing',
          performedBy: lab._id,
          performedByName: lab.name,
          txHash: generateTxHash(),
          notes: 'Sample collected and sent to NABL certified lab',
          timestamp: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        }] : []),
        ...(currentStageIndex >= 2 ? [{
          eventType: 'manufacturing',
          performedBy: manufacturer._id,
          performedByName: manufacturer.name,
          txHash: generateTxHash(),
          notes: 'GMP-compliant processing and extraction',
          timestamp: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        }] : []),
        ...(currentStageIndex >= 3 ? [{
          eventType: 'packaging',
          performedBy: manufacturer._id,
          performedByName: manufacturer.name,
          txHash: generateTxHash(),
          notes: 'Tamper-proof packaging with QR verification seal',
          timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        }] : []),
        ...(currentStageIndex >= 4 ? [{
          eventType: 'distribution',
          performedBy: manufacturer._id,
          performedByName: manufacturer.name,
          txHash: generateTxHash(),
          notes: 'Dispatched to distribution network',
          timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        }] : []),
      ],
    });
    batches.push(batch);
  }
  console.log(`✅ Created ${batches.length} product batches`);

  // Create Blockchain Logs
  let blockchainLogs = [];
  for (const batch of batches) {
    const events = ['batch_created', 'harvest_entry', 'lab_testing', 'manufacturing', 'packaging'];
    let prevHash = '0x' + '0'.repeat(64);

    for (const event of events.slice(0, Math.floor(Math.random() * 4) + 2)) {
      const txHash = generateTxHash();
      const dataHash = crypto.createHash('sha256').update(`${prevHash}${event}${batch.batchId}`).digest('hex');

      const log = await BlockchainLog.create({
        txHash,
        blockNumber: Math.floor(Math.random() * 9000000) + 1000000,
        blockHash: generateTxHash(),
        eventType: event,
        batchId: batch.batchId,
        batchRef: batch._id,
        userId: manufacturer._id,
        userRole: 'manufacturer',
        userName: manufacturer.name,
        network: 'simulated',
        payload: { herbName: batch.herbName, stage: event },
        previousHash: prevHash,
        dataHash,
        timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        gasUsed: Math.floor(Math.random() * 50000) + 21000,
        confirmations: 12,
        status: 'confirmed',
        isValid: true,
      });

      prevHash = dataHash;
      blockchainLogs.push(log);
    }
  }
  console.log(`✅ Created ${blockchainLogs.length} blockchain records`);

  // Create Quality Reports
  for (let i = 0; i < Math.min(5, batches.length); i++) {
    const batch = batches[i];
    await QualityReport.create({
      batchId: batch.batchId,
      batchRef: batch._id,
      reportId: `QR-${Date.now().toString(36).toUpperCase()}-${i}`,
      labName: lab.organization,
      labId: lab._id,
      labLicense: lab.licenseNumber,
      testDate: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000),
      parameters: [
        { name: 'Moisture Content', value: '8.5', unit: '%', referenceRange: '<10%', status: 'pass' },
        { name: 'Ash Content', value: '4.2', unit: '%', referenceRange: '<5%', status: 'pass' },
        { name: 'Active Compounds', value: '2.5', unit: '%', referenceRange: '>1.5%', status: 'pass' },
      ],
      herbSpecificTests: {
        moistureContent: { value: 8.5, unit: '%', pass: true },
        ashContent: { value: 4.2, unit: '%', pass: true },
        heavyMetals: {
          lead: { value: 0.2, unit: 'ppm', pass: true },
          arsenic: { value: 0.1, unit: 'ppm', pass: true },
          mercury: { value: 0.05, unit: 'ppm', pass: true },
          cadmium: { value: 0.1, unit: 'ppm', pass: true },
        },
        pesticides: { detected: false, details: 'No pesticide residues detected' },
        microbial: {
          totalCount: { value: 1000, pass: true },
          ecoli: { detected: false, pass: true },
          salmonella: { detected: false, pass: true },
        },
        activeCompounds: [{ name: 'Withanolides', percentage: 2.5, pass: true }],
        adulteration: { detected: false, score: 5, details: 'No adulteration detected' },
      },
      overallResult: 'passed',
      grade: 'A+',
      remarks: 'Sample meets all quality specifications as per Ayurvedic Pharmacopoeia of India.',
      recommendations: 'Approved for manufacturing.',
      isPublic: true,
    });
  }
  console.log(`✅ Created quality reports`);

  console.log('\n🎉 Database seeded successfully!');
  console.log('\n📋 Test Credentials:');
  console.log('  Admin:        admin@rasa-chain.io / Admin@123');
  console.log('  Farmer:       farmer@rasa-chain.io / Farmer@123');
  console.log('  Manufacturer: manufacturer@rasa-chain.io / Mfg@123');
  console.log('  Lab:          lab@rasa-chain.io / Lab@123');
  console.log('  Regulator:    regulator@rasa-chain.io / Reg@123');
  console.log('  Consumer:     consumer@rasa-chain.io / Consumer@123');

  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed error:', err);
  process.exit(1);
});
