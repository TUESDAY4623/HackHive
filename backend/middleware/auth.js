const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes – requires valid JWT
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized – no token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Not authorized – invalid token' });
  }
};

// Optional auth – attaches user if token exists, doesn't fail if not
const optionalAuth = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
    } catch (_) {
      req.user = null;
    }
  }
  next();
};

const sendTokenResponse = (user, statusCode, res) => {
  const token = user.getSignedJwtToken();
  res.status(statusCode).json({
    success: true,
    token,
    user: {
      _id: user._id,
      name: user.name,
      handle: user.handle,
      email: user.email,
      avatar: user.avatar,
      role: user.role,
      level: user.level,
      location: user.location,
      bio: user.bio,
      githubUrl: user.githubUrl,
      techStack: user.techStack,
      verifiedSkills: user.verifiedSkills,
      stats: user.stats,
      availability: user.availability,
    },
  });
};

module.exports = { protect, optionalAuth, sendTokenResponse };
