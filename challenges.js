const express = require('express');
const { body, validationResult } = require('express-validator');
const Challenge = require('../models/Challenge');
const User = require('../models/User');
const { authMiddleware, authorize } = require('../middleware/auth');
const router = express.Router();

// @desc    Get all challenges
// @route   GET /api/challenges
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { category, difficulty, type, page = 1, limit = 10 } = req.query;
    
    const filter = { isActive: true };
    if (category && category !== 'all') filter.category = category;
    if (difficulty) filter.difficulty = difficulty;
    if (type) filter.type = type;

    const challenges = await Challenge.find(filter)
      .populate('createdBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Challenge.countDocuments(filter);

    res.json({
      success: true,
      challenges,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get challenges error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get single challenge
// @route   GET /api/challenges/:id
// @access  Private
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id)
      .populate('createdBy', 'firstName lastName')
      .populate('participants.userId', 'firstName lastName profileImage');

    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: 'Challenge not found'
      });
    }

    // Check if user is already participating
    const userParticipant = challenge.participants.find(
      p => p.userId._id.toString() === req.user.id
    );

    res.json({
      success: true,
      challenge: {
        ...challenge.toObject(),
        userParticipant
      }
    });
  } catch (error) {
    console.error('Get challenge error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Join challenge
// @route   POST /api/challenges/:id/join
// @access  Private
router.post('/:id/join', authMiddleware, async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id);
    
    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: 'Challenge not found'
      });
    }

    if (!challenge.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Challenge is not active'
      });
    }

    // Check if user is already participating
    const existingParticipant = challenge.participants.find(
      p => p.userId.toString() === req.user.id
    );

    if (existingParticipant) {
      return res.status(400).json({
        success: false,
        message: 'You are already participating in this challenge'
      });
    }

    // Get user to check eligibility
    const user = await User.findById(req.user.id);
    if (!challenge.isEligible(user)) {
      return res.status(400).json({
        success: false,
        message: 'You are not eligible for this challenge'
      });
    }

    // Add participant
    await challenge.addParticipant(req.user.id);

    res.json({
      success: true,
      message: 'Successfully joined the challenge'
    });
  } catch (error) {
    console.error('Join challenge error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Submit challenge
// @route   POST /api/challenges/:id/submit
// @access  Private
router.post('/:id/submit', authMiddleware, [
  body('submissions').isArray().withMessage('Submissions must be an array'),
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

    const { submissions } = req.body;
    const challenge = await Challenge.findById(req.params.id);
    
    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: 'Challenge not found'
      });
    }

    // Check if user is participating
    const participant = challenge.participants.find(
      p => p.userId.toString() === req.user.id
    );

    if (!participant) {
      return res.status(400).json({
        success: false,
        message: 'You are not participating in this challenge'
      });
    }

    if (participant.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Challenge already completed'
      });
    }

    // Update participant status
    await challenge.updateParticipantStatus(req.user.id, 'completed', submissions);

    // Award points to user
    const user = await User.findById(req.user.id);
    await user.addPoints(challenge.points, `Completed challenge: ${challenge.title}`);

    res.json({
      success: true,
      message: 'Challenge submitted successfully',
      pointsEarned: challenge.points
    });
  } catch (error) {
    console.error('Submit challenge error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get user challenges
// @route   GET /api/challenges/user
// @access  Private
router.get('/user', authMiddleware, async (req, res) => {
  try {
    const challenges = await Challenge.find({
      'participants.userId': req.user.id,
      isActive: true
    })
    .populate('createdBy', 'firstName lastName')
    .sort({ createdAt: -1 });

    // Filter challenges where user is participating
    const userChallenges = challenges.map(challenge => {
      const participant = challenge.participants.find(
        p => p.userId.toString() === req.user.id
      );
      return {
        ...challenge.toObject(),
        userParticipant: participant
      };
    });

    res.json({
      success: true,
      challenges: userChallenges
    });
  } catch (error) {
    console.error('Get user challenges error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get challenge leaderboard
// @route   GET /api/challenges/:id/leaderboard
// @access  Private
router.get('/:id/leaderboard', authMiddleware, async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id)
      .populate('participants.userId', 'firstName lastName profileImage gamification');

    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: 'Challenge not found'
      });
    }

    // Sort participants by completion time and points earned
    const leaderboard = challenge.participants
      .filter(p => p.status === 'completed')
      .sort((a, b) => {
        if (a.completedAt && b.completedAt) {
          return new Date(a.completedAt) - new Date(b.completedAt);
        }
        return b.pointsEarned - a.pointsEarned;
      })
      .map((participant, index) => ({
        rank: index + 1,
        user: participant.userId,
        pointsEarned: participant.pointsEarned,
        completedAt: participant.completedAt
      }));

    res.json({
      success: true,
      leaderboard
    });
  } catch (error) {
    console.error('Get challenge leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
