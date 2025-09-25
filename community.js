const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

// Mock community posts (in real app, this would be a separate model)
const communityPosts = [
  {
    id: 1,
    authorId: 'user1',
    author: 'Rajesh Kumar',
    avatar: '👨‍🌾',
    title: 'Success with Drip Irrigation System',
    content: 'Just completed the drip irrigation setup challenge! Water usage reduced by 40% and crop yield increased significantly. Highly recommend this sustainable practice!',
    category: 'success_story',
    likes: 24,
    comments: 8,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    image: '🌊',
  },
  {
    id: 2,
    authorId: 'user2',
    author: 'Priya Sharma',
    avatar: '👩‍🌾',
    title: 'Compost Making Tips',
    content: 'Looking for advice on making organic compost. What materials work best for vegetable farming? Any specific ratios you recommend?',
    category: 'question',
    likes: 12,
    comments: 15,
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    image: '🍂',
  },
];

// @desc    Get community posts
// @route   GET /api/community/posts
// @access  Private
router.get('/posts', authMiddleware, async (req, res) => {
  try {
    const { category, page = 1, limit = 10 } = req.query;
    
    let posts = [...communityPosts];
    
    // Filter by category if specified
    if (category && category !== 'all') {
      posts = posts.filter(post => post.category === category);
    }
    
    // Sort by creation date (newest first)
    posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedPosts = posts.slice(startIndex, endIndex);

    res.json({
      success: true,
      posts: paginatedPosts,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(posts.length / limit),
        total: posts.length
      }
    });
  } catch (error) {
    console.error('Get community posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Create community post
// @route   POST /api/community/posts
// @access  Private
router.post('/posts', authMiddleware, [
  body('title').notEmpty().withMessage('Title is required'),
  body('content').notEmpty().withMessage('Content is required'),
  body('category').isIn(['question', 'success_story', 'guide', 'tips']).withMessage('Invalid category'),
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

    const { title, content, category } = req.body;
    const user = await User.findById(req.user.id);

    const newPost = {
      id: communityPosts.length + 1,
      authorId: req.user.id,
      author: `${user.firstName} ${user.lastName}`,
      avatar: user.profileImage ? '📷' : '👤',
      title,
      content,
      category,
      likes: 0,
      comments: 0,
      createdAt: new Date(),
      image: '🌱',
    };

    communityPosts.unshift(newPost);

    res.json({
      success: true,
      message: 'Post created successfully',
      post: newPost
    });
  } catch (error) {
    console.error('Create community post error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Like a post
// @route   POST /api/community/posts/:id/like
// @access  Private
router.post('/posts/:id/like', authMiddleware, async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    const post = communityPosts.find(p => p.id === postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // In a real app, you'd track likes per user to prevent duplicate likes
    post.likes += 1;

    res.json({
      success: true,
      message: 'Post liked successfully',
      likes: post.likes
    });
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get community categories
// @route   GET /api/community/categories
// @access  Private
router.get('/categories', authMiddleware, async (req, res) => {
  try {
    const categories = [
      { value: 'all', label: 'All Posts', count: communityPosts.length },
      { value: 'question', label: 'Questions', count: communityPosts.filter(p => p.category === 'question').length },
      { value: 'success_story', label: 'Success Stories', count: communityPosts.filter(p => p.category === 'success_story').length },
      { value: 'guide', label: 'Guides', count: communityPosts.filter(p => p.category === 'guide').length },
      { value: 'tips', label: 'Tips & Tricks', count: communityPosts.filter(p => p.category === 'tips').length },
    ];

    res.json({
      success: true,
      categories
    });
  } catch (error) {
    console.error('Get community categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
