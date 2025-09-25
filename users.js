const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { authMiddleware, authorize } = require('../middleware/auth');
const router = express.Router();

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    res.json({
      success: true,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        profileImage: user.profileImage,
        preferences: user.preferences,
        location: user.location,
        farmingProfile: user.farmingProfile,
        gamification: user.gamification,
        wallet: user.wallet,
        isEmailVerified: user.isEmailVerified,
        isPhoneVerified: user.isPhoneVerified,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
router.put('/profile', authMiddleware, [
  body('firstName').optional().trim().isLength({ min: 2 }).withMessage('First name must be at least 2 characters'),
  body('lastName').optional().trim().isLength({ min: 2 }).withMessage('Last name must be at least 2 characters'),
  body('phone').optional().isMobilePhone('en-IN').withMessage('Please enter a valid phone number'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { firstName, lastName, phone } = req.body;
    const updateData = {};
    
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (phone) updateData.phone = phone;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        profileImage: user.profileImage,
        preferences: user.preferences,
        location: user.location,
        farmingProfile: user.farmingProfile,
        gamification: user.gamification,
        wallet: user.wallet
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Update user preferences
// @route   PUT /api/users/preferences
// @access  Private
router.put('/preferences', authMiddleware, async (req, res) => {
  try {
    const { language, theme, notifications } = req.body;
    
    const updateData = {};
    if (language) updateData['preferences.language'] = language;
    if (theme) updateData['preferences.theme'] = theme;
    if (notifications) {
      if (notifications.email !== undefined) updateData['preferences.notifications.email'] = notifications.email;
      if (notifications.push !== undefined) updateData['preferences.notifications.push'] = notifications.push;
      if (notifications.sms !== undefined) updateData['preferences.notifications.sms'] = notifications.sms;
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Preferences updated successfully',
      preferences: user.preferences
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Update farming profile
// @route   PUT /api/users/farming-profile
// @access  Private
router.put('/farming-profile', authMiddleware, [
  body('experience').optional().isIn(['beginner', 'intermediate', 'expert']).withMessage('Invalid experience level'),
  body('farmSize').optional().isNumeric().withMessage('Farm size must be a number'),
  body('irrigationType').optional().isIn(['traditional', 'drip', 'sprinkler', 'mixed']).withMessage('Invalid irrigation type'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { experience, farmSize, irrigationType, crops, location } = req.body;
    
    const updateData = {};
    if (experience) updateData['farmingProfile.experience'] = experience;
    if (farmSize) updateData['farmingProfile.farmSize'] = farmSize;
    if (irrigationType) updateData['farmingProfile.irrigationType'] = irrigationType;
    if (crops) updateData['farmingProfile.crops'] = crops;
    if (location) {
      if (location.state) updateData['location.state'] = location.state;
      if (location.district) updateData['location.district'] = location.district;
      if (location.village) updateData['location.village'] = location.village;
      if (location.coordinates) updateData['location.coordinates'] = location.coordinates;
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Farming profile updated successfully',
      farmingProfile: user.farmingProfile,
      location: user.location
    });
  } catch (error) {
    console.error('Update farming profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get user stats
// @route   GET /api/users/stats
// @access  Private
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    const stats = {
      totalPoints: user.gamification.points,
      currentLevel: user.gamification.level,
      experience: user.gamification.experience,
      badgesEarned: user.gamification.badges.length,
      currentStreak: user.gamification.streak,
      walletBalance: user.wallet.balance,
      totalTransactions: user.wallet.transactions.length,
      memberSince: user.createdAt
    };

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get user activity history
// @route   GET /api/users/activity
// @access  Private
router.get('/activity', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    // Get recent wallet transactions as activity
    const recentTransactions = user.wallet.transactions
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 20);

    res.json({
      success: true,
      activities: recentTransactions
    });
  } catch (error) {
    console.error('Get user activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
