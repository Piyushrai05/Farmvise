const express = require('express');
const User = require('../models/User');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

// @desc    Get global leaderboard
// @route   GET /api/leaderboard/global
// @access  Private
router.get('/global', authMiddleware, async (req, res) => {
  try {
    const { limit = 50, page = 1 } = req.query;
    
    const users = await User.find({ isActive: true })
      .select('firstName lastName profileImage gamification role')
      .sort({ 'gamification.points': -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments({ isActive: true });

    const leaderboard = users.map((user, index) => ({
      rank: (page - 1) * limit + index + 1,
      user: {
        id: user._id,
        name: `${user.firstName} ${user.lastName}`,
        profileImage: user.profileImage,
        role: user.role
      },
      points: user.gamification.points,
      level: user.gamification.level,
      badges: user.gamification.badges.length
    }));

    res.json({
      success: true,
      leaderboard,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get global leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get user rank
// @route   GET /api/leaderboard/user-rank
// @access  Private
router.get('/user-rank', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const userPoints = user.gamification.points;
    
    // Count users with more points
    const higherRankedUsers = await User.countDocuments({
      'gamification.points': { $gt: userPoints },
      isActive: true
    });

    const userRank = higherRankedUsers + 1;

    res.json({
      success: true,
      rank: userRank,
      points: userPoints,
      level: user.gamification.level,
      badges: user.gamification.badges.length
    });
  } catch (error) {
    console.error('Get user rank error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get top users
// @route   GET /api/leaderboard/top/:limit
// @access  Private
router.get('/top/:limit', authMiddleware, async (req, res) => {
  try {
    const limit = parseInt(req.params.limit) || 10;
    
    const users = await User.find({ isActive: true })
      .select('firstName lastName profileImage gamification role')
      .sort({ 'gamification.points': -1 })
      .limit(limit);

    const topUsers = users.map((user, index) => ({
      rank: index + 1,
      user: {
        id: user._id,
        name: `${user.firstName} ${user.lastName}`,
        profileImage: user.profileImage,
        role: user.role
      },
      points: user.gamification.points,
      level: user.gamification.level,
      badges: user.gamification.badges.length
    }));

    res.json({
      success: true,
      topUsers
    });
  } catch (error) {
    console.error('Get top users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
