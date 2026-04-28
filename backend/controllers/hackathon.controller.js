const Hackathon = require('../models/Hackathon');
const Team = require('../models/Team');
const User = require('../models/User');

// @desc    Get all hackathons
// @route   GET /api/hackathons
// @access  Public
exports.getHackathons = async (req, res) => {
  const { status, tag, search, featured, source, page = 1, limit = 12 } = req.query;
  let query = {};

  if (status && status !== 'all') query.status = status;
  if (tag) query.tags = { $in: [new RegExp(tag, 'i')] };
  if (featured === 'true') query.featured = true;
  if (source) query.source = source;
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { organizer: { $regex: search, $options: 'i' } },
      { tags: { $in: [new RegExp(search, 'i')] } },
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const total = await Hackathon.countDocuments(query);

  const hackathons = await Hackathon.find(query)
    .populate('createdBy', 'name handle avatar')
    .sort({ featured: -1, startDate: 1 })
    .skip(skip)
    .limit(parseInt(limit));

  res.status(200).json({
    success: true,
    count: hackathons.length,
    total,
    pages: Math.ceil(total / parseInt(limit)),
    hackathons,
  });
};

// @desc    Get featured hackathons (for home stories row)
// @route   GET /api/hackathons/featured
// @access  Public
exports.getFeaturedHackathons = async (req, res) => {
  const limit = parseInt(req.query.limit) || 8;

  // First try truly featured ones, then fall back to most recent active/upcoming
  let hackathons = await Hackathon.find({ featured: true })
    .sort({ startDate: 1 })
    .limit(limit);

  if (hackathons.length < 3) {
    hackathons = await Hackathon.find({
      status: { $in: ['active', 'upcoming'] },
    })
      .sort({ startDate: 1 })
      .limit(limit);
  }

  res.status(200).json({ success: true, count: hackathons.length, hackathons });
};

// @desc    Get single hackathon
// @route   GET /api/hackathons/:id
// @access  Public
exports.getHackathon = async (req, res) => {
  const hackathon = await Hackathon.findById(req.params.id)
    .populate('createdBy', 'name handle avatar')
    .populate('participants', 'name handle avatar role level');

  if (!hackathon) {
    return res.status(404).json({ success: false, message: 'Hackathon not found' });
  }
  res.status(200).json({ success: true, hackathon });
};

// @desc    Get all teams for a hackathon
// @route   GET /api/hackathons/:id/teams
// @access  Public
exports.getHackathonTeams = async (req, res) => {
  const hackathon = await Hackathon.findById(req.params.id);
  if (!hackathon) return res.status(404).json({ success: false, message: 'Hackathon not found' });

  const { open, page = 1, limit = 12 } = req.query;
  const filter = { hackathon: req.params.id };
  if (open !== undefined) filter.isOpen = open !== 'false';

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const total = await Team.countDocuments(filter);

  const teams = await Team.find(filter)
    .populate('leader', 'name handle avatar level techStack')
    .populate('members.user', 'name handle avatar')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  res.status(200).json({
    success: true,
    count: teams.length,
    total,
    pages: Math.ceil(total / parseInt(limit)),
    teams,
  });
};

// @desc    Create hackathon
// @route   POST /api/hackathons
// @access  Private
exports.createHackathon = async (req, res) => {
  req.body.createdBy = req.user.id;
  const hackathon = await Hackathon.create(req.body);
  res.status(201).json({ success: true, hackathon });
};

// @desc    Update hackathon
// @route   PUT /api/hackathons/:id
// @access  Private (creator only)
exports.updateHackathon = async (req, res) => {
  let hackathon = await Hackathon.findById(req.params.id);
  if (!hackathon) return res.status(404).json({ success: false, message: 'Not found' });
  if (hackathon.createdBy.toString() !== req.user.id) {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }
  hackathon = await Hackathon.findByIdAndUpdate(req.params.id, req.body, {
    new: true, runValidators: true,
  });
  res.status(200).json({ success: true, hackathon });
};

// @desc    Delete hackathon
// @route   DELETE /api/hackathons/:id
// @access  Private (creator only)
exports.deleteHackathon = async (req, res) => {
  const hackathon = await Hackathon.findById(req.params.id);
  if (!hackathon) return res.status(404).json({ success: false, message: 'Not found' });
  if (hackathon.createdBy.toString() !== req.user.id) {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }
  await hackathon.deleteOne();
  res.status(200).json({ success: true, message: 'Hackathon deleted' });
};

// @desc    Register / unregister for hackathon (toggle)
// @route   PUT /api/hackathons/:id/register
// @access  Private
exports.registerForHackathon = async (req, res) => {
  const hackathon = await Hackathon.findById(req.params.id);
  if (!hackathon) return res.status(404).json({ success: false, message: 'Not found' });
  if (hackathon.status === 'ended') {
    return res.status(400).json({ success: false, message: 'Hackathon has ended' });
  }

  const alreadyRegistered = hackathon.participants.includes(req.user.id);
  if (alreadyRegistered) {
    // Unregister
    hackathon.participants = hackathon.participants.filter(
      (p) => p.toString() !== req.user.id
    );
    await User.findByIdAndUpdate(req.user.id, {
      $pull: { hackathonsJoined: hackathon._id },
      $inc: { 'stats.hackathons': -1 },
    });
    await hackathon.save();
    return res.status(200).json({ success: true, registered: false, message: 'Unregistered' });
  }

  hackathon.participants.push(req.user.id);
  await User.findByIdAndUpdate(req.user.id, {
    $push: { hackathonsJoined: hackathon._id },
    $inc: { 'stats.hackathons': 1 },
  });
  await hackathon.save();
  res.status(200).json({ success: true, registered: true, message: 'Registered successfully!' });
};
