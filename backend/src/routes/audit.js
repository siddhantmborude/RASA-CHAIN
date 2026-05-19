const express = require('express');
const router = express.Router();
const AuditLog = require('../models/AuditLog');
const { protect, authorize } = require('../middleware/auth');

/**
 * @swagger
 * /api/audit:
 *   get:
 *     tags: [Audit]
 *     summary: Get audit logs (admin/regulator only)
 */
router.get('/', protect, authorize('admin', 'regulator'), async (req, res) => {
  try {
    const { page = 1, limit = 20, category, status, severity, userId } = req.query;
    const query = {};
    if (category) query.category = category;
    if (status) query.status = status;
    if (severity) query.severity = severity;
    if (userId) query.userId = userId;

    const total = await AuditLog.countDocuments(query);
    const logs = await AuditLog.find(query)
      .populate('userId', 'name email role')
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      success: true,
      data: logs,
      pagination: { total, page: Number(page), limit: Number(limit) },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
