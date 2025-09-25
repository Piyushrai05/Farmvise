const express = require('express');
const User = require('../models/User');
const Challenge = require('../models/Challenge');
const { authMiddleware, authorize } = require('../middleware/auth');
const router = express.Router();

// All admin routes require admin role
router.use(authMiddleware);
router.use(authorize('admin'));

// @desc    Get dashboard stats
// @route   GET /api/admin/analytics/dashboard
// @access  Private (Admin)
router.get('/analytics/dashboard', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ isActive: true });
    const totalChallenges = await Challenge.countDocuments({ isActive: true });
    const totalPointsAwarded = await User.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: null, total: { $sum: '$gamification.points' } } }
    ]);

    const stats = {
      totalUsers,
      totalChallenges,
      totalPointsAwarded: totalPointsAwarded[0]?.total || 0,
      systemHealth: '99.9%'
    };

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get users
// @route   GET /api/admin/users
// @access  Private (Admin)
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 20, role, search } = req.query;
    
    const filter = { isActive: true };
    if (role) filter.role = role;
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(filter);

    res.json({
      success: true,
      users,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get system health
// @route   GET /api/admin/health
// @access  Private (Admin)
router.get('/health', async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.version,
      environment: process.env.NODE_ENV || 'development'
    };

    res.json({
      success: true,
      health
    });
  } catch (error) {
    console.error('Get system health error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
