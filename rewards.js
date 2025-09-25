const express = require('express');
const User = require('../models/User');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

// @desc    Get user wallet
// @route   GET /api/rewards/wallet
// @access  Private
router.get('/wallet', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    res.json({
      success: true,
      wallet: {
        balance: user.wallet.balance,
        totalEarned: user.wallet.transactions
          .filter(t => t.type === 'earned')
          .reduce((sum, t) => sum + t.amount, 0),
        totalSpent: user.wallet.transactions
          .filter(t => t.type === 'spent')
          .reduce((sum, t) => sum + t.amount, 0)
      }
    });
  } catch (error) {
    console.error('Get wallet error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get user transactions
// @route   GET /api/rewards/transactions
// @access  Private
router.get('/transactions', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const user = await User.findById(req.user.id);
    
    const transactions = user.wallet.transactions
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice((page - 1) * limit, page * limit);

    res.json({
      success: true,
      transactions,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(user.wallet.transactions.length / limit),
        total: user.wallet.transactions.length
      }
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get user rewards
// @route   GET /api/rewards/user
// @access  Private
router.get('/user', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    res.json({
      success: true,
      rewards: {
        badges: user.gamification.badges,
        points: user.gamification.points,
        level: user.gamification.level,
        wallet: user.wallet.balance
      }
    });
  } catch (error) {
    console.error('Get user rewards error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
