const Project = require('../models/Project');
const User = require('../models/User');

// @desc    Get all projects (feed)
// @route   GET /api/projects
// @access  Public
exports.getProjects = async (req, res) => {
  const { hackathon, tag, search, page = 1, limit = 10 } = req.query;
  let query = {};

  if (hackathon) query.hackathon = hackathon;
  if (tag) query.tags = { $in: [new RegExp(tag, 'i')] };
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { techStack: { $in: [new RegExp(search, 'i')] } },
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const total = await Project.countDocuments(query);

  const projects = await Project.find(query)
    .populate('owner', 'name handle avatar initials role level')
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

// @desc    Get single project
// @route   GET /api/projects/:id
// @access  Public
exports.getProject = async (req, res) => {
  const project = await Project.findById(req.params.id)
    .populate('owner', 'name handle avatar role level location')
    .populate('teamMembers.user', 'name handle avatar role')
    .populate('comments.user', 'name handle avatar')
    .populate('hackathon', 'title status emoji accentColor');

  if (!project) {
    return res.status(404).json({ success: false, message: 'Project not found' });
  }

  res.status(200).json({ success: true, project });
};

// @desc    Create project
// @route   POST /api/projects
// @access  Private
exports.createProject = async (req, res) => {
  req.body.owner = req.user.id;

  const project = await Project.create(req.body);

  // Update user stats
  await User.findByIdAndUpdate(req.user.id, { $inc: { 'stats.projects': 1 } });

  const populated = await project.populate('owner', 'name handle avatar role level');
  res.status(201).json({ success: true, project: populated });
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private
exports.updateProject = async (req, res) => {
  let project = await Project.findById(req.params.id);
  if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
  if (project.owner.toString() !== req.user.id) {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  const disallowed = ['owner', 'likes', 'comments', 'teamMembers', 'joinRequests'];
  disallowed.forEach((f) => delete req.body[f]);

  project = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    .populate('owner', 'name handle avatar role level');

  res.status(200).json({ success: true, project });
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private
exports.deleteProject = async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
  if (project.owner.toString() !== req.user.id) {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }
  await project.deleteOne();
  await User.findByIdAndUpdate(req.user.id, { $inc: { 'stats.projects': -1 } });
  res.status(200).json({ success: true, message: 'Project deleted' });
};

// @desc    Like / unlike project
// @route   PUT /api/projects/:id/like
// @access  Private
exports.likeProject = async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

  const idx = project.likes.indexOf(req.user.id);
  if (idx === -1) {
    project.likes.push(req.user.id);
  } else {
    project.likes.splice(idx, 1);
  }
  await project.save();

  res.status(200).json({ success: true, likes: project.likes.length, liked: idx === -1 });
};

// @desc    Add comment
// @route   POST /api/projects/:id/comments
// @access  Private
exports.addComment = async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

  project.comments.push({ user: req.user.id, text: req.body.text });
  await project.save();

  await project.populate('comments.user', 'name handle avatar');
  const lastComment = project.comments[project.comments.length - 1];
  res.status(201).json({ success: true, comment: lastComment });
};

// @desc    Request to join team
// @route   POST /api/projects/:id/join
// @access  Private
exports.requestJoin = async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

  const alreadyRequested = project.joinRequests.some(
    (r) => r.user.toString() === req.user.id
  );
  if (alreadyRequested) {
    return res.status(400).json({ success: false, message: 'Join request already sent' });
  }

  project.joinRequests.push({ user: req.user.id, message: req.body.message || '' });
  await project.save();
  res.status(200).json({ success: true, message: 'Join request sent!' });
};

// @desc    Accept/reject join request
// @route   PUT /api/projects/:id/join/:requestId
// @access  Private (owner only)
exports.handleJoinRequest = async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
  if (project.owner.toString() !== req.user.id) {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  const request = project.joinRequests.id(req.params.requestId);
  if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

  request.status = req.body.status; // 'accepted' or 'rejected'

  if (req.body.status === 'accepted') {
    project.teamMembers.push({ user: request.user, role: req.body.role || 'Member' });
    await User.findByIdAndUpdate(request.user, { $inc: { 'stats.teammates': 1 } });
    await User.findByIdAndUpdate(req.user.id, { $inc: { 'stats.teammates': 1 } });
  }

  await project.save();
  res.status(200).json({ success: true, project });
};
