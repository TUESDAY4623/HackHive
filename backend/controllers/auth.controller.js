const User = require('../models/User');
const { sendTokenResponse } = require('../middleware/auth');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  const { name, handle, email, password } = req.body;

  if (!name || !handle || !email || !password) {
    return res.status(400).json({ success: false, message: 'Please provide all required fields' });
  }

  const existingHandle = await User.findOne({ handle: handle.toLowerCase() });
  if (existingHandle) {
    return res.status(400).json({ success: false, message: 'Handle already taken' });
  }

  const user = await User.create({ name, handle: handle.toLowerCase(), email, password });
  sendTokenResponse(user, 201, res);
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Please provide email and password' });
  }

  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  if (!user.password) {
    return res.status(400).json({ success: false, message: 'This account uses OAuth. Please login with GitHub or Google.' });
  }

  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  sendTokenResponse(user, 200, res);
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  const user = await User.findById(req.user.id).populate('hackathonsJoined', 'title status emoji accentColor');
  res.status(200).json({ success: true, user });
};

// @desc    Logout
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
  res.status(200).json({ success: true, message: 'Logged out successfully' });
};

// @desc    GitHub OAuth callback handler
// @route   GET /api/auth/github/callback
// @access  Public (Passport handles)
exports.githubCallback = async (req, res) => {
  const token = req.user.getSignedJwtToken();
  res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
};

// @desc    Google OAuth callback handler
// @route   GET /api/auth/google/callback
// @access  Public (Passport handles)
exports.googleCallback = async (req, res) => {
  const token = req.user.getSignedJwtToken();
  res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
};
