const User = require('../models/User');
const Project = require('../models/Project');
const Team = require('../models/Team');

// @desc    Get all users (team builder)
// @route   GET /api/users
// @access  Public
exports.getUsers = async (req, res) => {
  const { skill, availability, verified, search, page = 1, limit = 12 } = req.query;

  let query = {};

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { handle: { $regex: search, $options: 'i' } },
      { role: { $regex: search, $options: 'i' } },
    ];
  }

  if (skill) {
    query.techStack = { $in: [new RegExp(skill, 'i')] };
  }

  if (availability && availability !== 'All') {
    query.availability = availability;
  }

  if (verified === 'true') {
    query['verifiedSkills.0'] = { $exists: true };
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const total = await User.countDocuments(query);
  const users = await User.find(query)
    .select('-password')
    .sort({ 'stats.hackathons': -1, createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  res.status(200).json({
    success: true,
    count: users.length,
    total,
    pages: Math.ceil(total / parseInt(limit)),
    users,
  });
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Public
exports.getUser = async (req, res) => {
  const user = await User.findById(req.params.id)
    .select('-password')
    .populate('hackathonsJoined', 'title status emoji accentColor');

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  res.status(200).json({ success: true, user });
};

// @desc    Get user by handle
// @route   GET /api/users/handle/:handle
// @access  Public
exports.getUserByHandle = async (req, res) => {
  const user = await User.findOne({ handle: req.params.handle.toLowerCase() })
    .select('-password')
    .populate('hackathonsJoined', 'title status emoji accentColor');

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  res.status(200).json({ success: true, user });
};

// @desc    Get projects owned by or participating in for a user
// @route   GET /api/users/:id/projects
// @access  Public
exports.getUserProjects = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const query = {
    $or: [
      { owner: req.params.id },
      { 'teamMembers.user': req.params.id },
    ],
  };

  const total = await Project.countDocuments(query);
  const projects = await Project.find(query)
    .populate('owner', 'name handle avatar role level')
    .populate('hackathon', 'title status emoji accentColor')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  res.status(200).json({
    success: true,
    count: projects.length,
    total,
    pages: Math.ceil(total / parseInt(limit)),
    projects,
  });
};

// @desc    Get teams a user belongs to or leads
// @route   GET /api/users/:id/teams
// @access  Public
exports.getUserTeams = async (req, res) => {
  const teams = await Team.find({
    $or: [
      { leader: req.params.id },
      { 'members.user': req.params.id },
    ],
  })
    .populate('leader', 'name handle avatar')
    .populate('members.user', 'name handle avatar')
    .populate('hackathon', 'title emoji accentColor status')
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, count: teams.length, teams });
};

// @desc    Update current user profile
// @route   PUT /api/users/me
// @access  Private
exports.updateProfile = async (req, res) => {
  const allowedFields = [
    'name', 'bio', 'role', 'level', 'location',
    'githubUrl', 'techStack', 'availability', 'lookingFor', 'avatar',
  ];

  const updateData = {};
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) updateData[field] = req.body[field];
  });

  const user = await User.findByIdAndUpdate(req.user.id, updateData, {
    new: true,
    runValidators: true,
  }).select('-password');

  res.status(200).json({ success: true, user });
};

// @desc    Update verified skills
// @route   PUT /api/users/me/skills
// @access  Private
exports.updateSkills = async (req, res) => {
  const { skills } = req.body; // array of { name, level, score }

  const user = await User.findByIdAndUpdate(
    req.user.id,
    { verifiedSkills: skills },
    { new: true, runValidators: true }
  ).select('-password');

  res.status(200).json({ success: true, user });
};

// @desc    Delete account
// @route   DELETE /api/users/me
// @access  Private
exports.deleteAccount = async (req, res) => {
  await User.findByIdAndDelete(req.user.id);
  res.status(200).json({ success: true, message: 'Account deleted successfully' });
};
