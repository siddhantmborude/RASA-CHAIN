const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { protect } = require('../middleware/auth');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password, role]
 *             properties:
 *               name: { type: string }
 *               email: { type: string }
 *               password: { type: string, minLength: 6 }
 *               role: { type: string, enum: [admin, farmer, manufacturer, lab, regulator, consumer] }
 *               organization: { type: string }
 */
router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').isIn(['admin', 'farmer', 'manufacturer', 'lab', 'regulator', 'consumer']).withMessage('Invalid role'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { name, email, password, role, organization, phone, address, licenseNumber } = req.body;

      const existing = await User.findOne({ email });
      if (existing) {
        return res.status(409).json({ error: 'Email already registered' });
      }

      // Auto-verify admins, others need approval in production
      const isVerified = role === 'consumer' || role === 'admin';

      const user = await User.create({
        name, email, password, role, organization, phone, address, licenseNumber, isVerified,
      });

      await AuditLog.create({
        action: 'User registered',
        category: 'auth',
        userId: user._id,
        userName: user.name,
        userRole: user.role,
        status: 'success',
        severity: 'low',
        timestamp: new Date(),
      });

      const token = signToken(user._id);
      const userObj = user.toObject();
      delete userObj.password;

      res.status(201).json({ success: true, token, user: userObj });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login and get JWT token
 *     security: []
 */
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email }).select('+password');

      if (!user || !(await user.comparePassword(password))) {
        await AuditLog.create({
          action: 'Failed login attempt',
          category: 'auth',
          severity: 'medium',
          details: { email },
          status: 'failure',
          timestamp: new Date(),
        });
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      if (!user.isActive) {
        return res.status(403).json({ error: 'Account deactivated' });
      }

      user.lastLogin = new Date();
      await user.save({ validateBeforeSave: false });

      await AuditLog.create({
        action: 'User logged in',
        category: 'auth',
        userId: user._id,
        userName: user.name,
        userRole: user.role,
        status: 'success',
        severity: 'low',
        timestamp: new Date(),
      });

      const token = signToken(user._id);
      const userObj = user.toObject();
      delete userObj.password;

      res.json({ success: true, token, user: userObj });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get current logged-in user
 */
router.get('/me', protect, async (req, res) => {
  res.json({ success: true, user: req.user });
});

router.put('/update-profile', protect, async (req, res) => {
  try {
    const { name, phone, organization, address } = req.body;
    const updated = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone, organization, address },
      { new: true, runValidators: true }
    );
    res.json({ success: true, user: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/change-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    if (!(await user.comparePassword(currentPassword))) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
