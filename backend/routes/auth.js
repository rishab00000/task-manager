const express = require('express');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const {
  signupValidator,
  loginValidator,
} = require('../validators/auth');

const router = express.Router();

const handleValidation = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors.array()[0].msg,
      errors: errors.array(),
    });
  }
  return null;
};

router.post('/signup', signupValidator, async (req, res) => {
  try {
    const validationError = handleValidation(req, res);
    if (validationError) return;

    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    const user = await User.create({ name, email, password });
    const token = user.generateToken();

    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      data: { user, token },
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during signup.',
    });
  }
});

router.post('/login', loginValidator, async (req, res) => {
  try {
    const validationError = handleValidation(req, res);
    if (validationError) return;

    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const token = user.generateToken();

    res.json({
      success: true,
      message: 'Login successful.',
      data: { user, token },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login.',
    });
  }
});

router.get('/me', protect, async (req, res) => {
  try {
    res.json({
      success: true,
      data: { user: req.user },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error.',
    });
  }
});

module.exports = router;
