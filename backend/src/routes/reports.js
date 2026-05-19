const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const Batch = require('../models/Batch');
const QualityReport = require('../models/QualityReport');
const BlockchainLog = require('../models/BlockchainLog');
const { protect } = require('../middleware/auth');
const blockchainService = require('../services/blockchainService');

/**
 * @swagger
 * /api/reports/generate/{batchId}:
 *   get:
 *     tags: [Reports]
 *     summary: Generate PDF compliance report for a batch
 */
router.get('/generate/:batchId', protect, async (req, res) => {
  try {
    const batch = await Batch.findOne({ batchId: req.params.batchId.toUpperCase() })
      .populate('supplier', 'name organization')
      .populate('manufacturer', 'name organization');

    if (!batch) return res.status(404).json({ error: 'Batch not found' });

    const blockchainLogs = await blockchainService.getBatchHistory(batch.batchId);
    const qualityReports = await QualityReport.find({ batchId: batch.batchId });
    const chainValid = await blockchainService.verifyChainIntegrity(batch.batchId);

    // Generate PDF
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=RASA-CHAIN-Report-${batch.batchId}.pdf`);
    doc.pipe(res);

    // Header
    doc.fontSize(24).fillColor('#1a1a2e').text('RASA-CHAIN', { align: 'center' });
    doc.fontSize(14).fillColor('#16213e').text('Herbal Product Compliance Report', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor('#888').text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
    doc.moveDown();

    // Horizontal line
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#e2e8f0');
    doc.moveDown();

    // Batch Info
    doc.fontSize(16).fillColor('#1a1a2e').text('Batch Information');
    doc.moveDown(0.3);
    const batchInfo = [
      ['Batch ID', batch.batchId],
      ['Herb Name', batch.herbName],
      ['Scientific Name', batch.scientificName || 'N/A'],
      ['Product Name', batch.productName || batch.herbName],
      ['Category', batch.productCategory],
      ['Status', batch.status.toUpperCase()],
      ['Current Stage', batch.currentStage.replace(/_/g, ' ').toUpperCase()],
      ['Quality Grade', batch.qualityGrade || 'Pending'],
      ['Verified', batch.isVerified ? 'YES ✓' : 'NO'],
      ['Harvest Date', batch.harvestDate ? new Date(batch.harvestDate).toLocaleDateString() : 'N/A'],
      ['Manufacturing Date', batch.manufacturingDate ? new Date(batch.manufacturingDate).toLocaleDateString() : 'N/A'],
      ['Expiry Date', batch.expiryDate ? new Date(batch.expiryDate).toLocaleDateString() : 'N/A'],
    ];

    batchInfo.forEach(([key, value]) => {
      doc.fontSize(10).fillColor('#374151').text(`${key}: `, { continued: true }).fillColor('#6b7280').text(value || '');
    });

    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#e2e8f0');
    doc.moveDown();

    // Supplier Info
    doc.fontSize(16).fillColor('#1a1a2e').text('Supply Chain Details');
    doc.moveDown(0.3);
    doc.fontSize(10).fillColor('#374151').text(`Supplier: `, { continued: true }).fillColor('#6b7280').text(batch.supplierName || batch.supplier?.name || 'N/A');
    doc.fontSize(10).fillColor('#374151').text(`Supplier Org: `, { continued: true }).fillColor('#6b7280').text(batch.supplierOrganization || batch.supplier?.organization || 'N/A');
    doc.fontSize(10).fillColor('#374151').text(`Manufacturer: `, { continued: true }).fillColor('#6b7280').text(batch.manufacturerName || batch.manufacturer?.name || 'N/A');

    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#e2e8f0');
    doc.moveDown();

    // Blockchain Info
    doc.fontSize(16).fillColor('#1a1a2e').text('Blockchain Verification');
    doc.moveDown(0.3);
    doc.fontSize(10)
      .fillColor('#374151').text(`Transaction Hash: `, { continued: true })
      .fillColor('#7c3aed').text(batch.blockchainTxHash || 'N/A');
    doc.fontSize(10)
      .fillColor('#374151').text(`Network: `, { continued: true })
      .fillColor('#6b7280').text(batch.blockchainNetwork || 'simulated');
    doc.fontSize(10)
      .fillColor('#374151').text(`Chain Integrity: `, { continued: true })
      .fillColor(chainValid ? '#059669' : '#dc2626')
      .text(chainValid ? 'VERIFIED - No Tampering Detected' : 'WARNING - Integrity Check Failed');

    doc.moveDown();
    doc.fontSize(14).fillColor('#1a1a2e').text('Blockchain Event Log');
    doc.moveDown(0.3);
    blockchainLogs.forEach((log, i) => {
      doc.fontSize(9).fillColor('#374151')
        .text(`${i + 1}. [${log.eventType.toUpperCase()}] ${new Date(log.timestamp).toLocaleString()} | Block: ${log.blockNumber} | ${log.txHash.slice(0, 30)}...`);
    });

    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#e2e8f0');
    doc.moveDown();

    // Timeline
    doc.fontSize(16).fillColor('#1a1a2e').text('Supply Chain Timeline');
    doc.moveDown(0.3);
    batch.supplyChainEvents.forEach((event, i) => {
      doc.fontSize(9).fillColor('#374151')
        .text(`${i + 1}. ${event.eventType.toUpperCase().replace(/_/g, ' ')} - ${new Date(event.timestamp).toLocaleString()} by ${event.performedByName || 'System'}`);
      if (event.notes) doc.fontSize(8).fillColor('#9ca3af').text(`   ${event.notes}`);
    });

    // Footer
    doc.moveDown(2);
    doc.fontSize(8).fillColor('#9ca3af')
      .text('This report was automatically generated by RASA-CHAIN - Herbal Supply Chain Traceability Platform', { align: 'center' });
    doc.text('Powered by Blockchain Technology | www.rasa-chain.io', { align: 'center' });

    doc.end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/reports/quality:
 *   post:
 *     tags: [Reports]
 *     summary: Submit a quality lab report
 */
router.post('/quality', protect, async (req, res) => {
  try {
    const { batchId, ...reportData } = req.body;
    const batch = await Batch.findOne({ batchId: batchId.toUpperCase() });
    if (!batch) return res.status(404).json({ error: 'Batch not found' });

    const reportId = `QR-${Date.now().toString(36).toUpperCase()}`;
    const report = await QualityReport.create({
      ...reportData,
      batchId: batch.batchId,
      batchRef: batch._id,
      reportId,
      labId: req.user._id,
      labName: req.user.name || req.user.organization,
    });

    // Update batch quality grade
    batch.qualityGrade = reportData.grade;
    batch.labReportRef = reportId;
    if (reportData.overallResult === 'passed') {
      batch.currentStage = 'lab_testing';
    }
    await batch.save();

    const blockchainResult = await blockchainService.recordEvent({
      eventType: 'lab_testing',
      batchId: batch.batchId,
      batchRef: batch._id,
      userId: req.user._id,
      userRole: req.user.role,
      userName: req.user.name,
      payload: { reportId, grade: reportData.grade, result: reportData.overallResult },
    });

    res.status(201).json({ success: true, data: report, blockchain: blockchainResult });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/quality/batch/:batchId', protect, async (req, res) => {
  try {
    const reports = await QualityReport.find({ batchId: req.params.batchId.toUpperCase() })
      .populate('labId', 'name organization');
    res.json({ success: true, data: reports });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
