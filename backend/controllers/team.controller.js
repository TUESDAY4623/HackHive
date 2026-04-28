const Team = require('../models/Team');
const User = require('../models/User');
const Hackathon = require('../models/Hackathon');

// @desc  Get all open teams (with optional hackathon filter)
// @route GET /api/teams
exports.getTeams = async (req, res) => {
  const { hackathon, search, open } = req.query;
  const filter = {};
  if (hackathon) filter.hackathon = hackathon;
  if (open !== 'false') filter.isOpen = true;
  if (search) filter.name = { $regex: search, $options: 'i' };

  const teams = await Team.find(filter)
    .populate('leader', 'name handle avatar level techStack')
    .populate('members.user', 'name handle avatar')
    .populate('hackathon', 'title emoji accentColor status')
    .sort({ createdAt: -1 })
    .limit(Number(req.query.limit) || 20);

  res.json({ success: true, count: teams.length, teams });
};

// @desc  Get single team
// @route GET /api/teams/:id
exports.getTeam = async (req, res) => {
  const team = await Team.findById(req.params.id)
    .populate('leader', 'name handle avatar level role techStack verifiedSkills')
    .populate('members.user', 'name handle avatar role techStack')
    .populate('hackathon', 'title emoji accentColor status startDate endDate')
    .populate('joinRequests.user', 'name handle avatar role');

  if (!team) return res.status(404).json({ success: false, message: 'Team not found' });
  res.json({ success: true, team });
};

// @desc  Create a team
// @route POST /api/teams
exports.createTeam = async (req, res) => {
  const { name, hackathonId, description, rolesNeeded, maxSize, accentColor } = req.body;

  // Verify hackathon exists
  const hackathon = await Hackathon.findById(hackathonId);
  if (!hackathon) return res.status(404).json({ success: false, message: 'Hackathon not found' });

  // Check user isn't already leading a team for this hackathon
  const existing = await Team.findOne({ hackathon: hackathonId, leader: req.user.id });
  if (existing) return res.status(400).json({ success: false, message: 'You already have a team for this hackathon' });

  const team = await Team.create({
    name,
    hackathon: hackathonId,
    leader: req.user.id,
    description,
    rolesNeeded: rolesNeeded || [],
    maxSize: maxSize || 4,
    accentColor: accentColor || '#7c3aed',
    members: [{ user: req.user.id, role: 'Leader' }],
  });

  await team.populate([
    { path: 'leader', select: 'name handle avatar level' },
    { path: 'hackathon', select: 'title emoji accentColor status' },
  ]);

  // Update user stats
  await User.findByIdAndUpdate(req.user.id, { $inc: { 'stats.teammates': 1 } });

  res.status(201).json({ success: true, message: 'Team created!', team });
};

// @desc  Send join request
// @route POST /api/teams/:id/join
exports.requestJoin = async (req, res) => {
  const { message, role } = req.body;
  const team = await Team.findById(req.params.id);
  if (!team) return res.status(404).json({ success: false, message: 'Team not found' });
  if (!team.isOpen) return res.status(400).json({ success: false, message: 'This team is not accepting new members' });
  if (team.members.length >= team.maxSize) return res.status(400).json({ success: false, message: 'Team is full' });

  const isMember = team.members.some(m => m.user.toString() === req.user.id);
  if (isMember) return res.status(400).json({ success: false, message: 'You are already in this team' });

  const alreadyRequested = team.joinRequests.some(
    r => r.user.toString() === req.user.id && r.status === 'pending'
  );
  if (alreadyRequested) return res.status(400).json({ success: false, message: 'Request already sent' });

  team.joinRequests.push({ user: req.user.id, message: message || '', role: role || 'Member' });
  await team.save();

  res.json({ success: true, message: 'Join request sent! The team leader will review it.' });
};

// @desc  Accept or reject join request
// @route PUT /api/teams/:id/requests/:requestId
exports.handleRequest = async (req, res) => {
  const { action, role } = req.body; // action: 'accept' | 'reject'
  const team = await Team.findById(req.params.id);
  if (!team) return res.status(404).json({ success: false, message: 'Team not found' });

  if (team.leader.toString() !== req.user.id) {
    return res.status(403).json({ success: false, message: 'Only the team leader can manage requests' });
  }

  const request = team.joinRequests.id(req.params.requestId);
  if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

  if (action === 'accept') {
    if (team.members.length >= team.maxSize) {
      return res.status(400).json({ success: false, message: 'Team is already full' });
    }
    team.members.push({ user: request.user, role: role || 'Member' });
    request.status = 'accepted';
    if (team.members.length >= team.maxSize) team.isOpen = false;

    await User.findByIdAndUpdate(request.user, { $inc: { 'stats.teammates': 1 } });
  } else {
    request.status = 'rejected';
  }

  await team.save();
  res.json({ success: true, message: `Request ${action}ed` });
};

// @desc  Leave team
// @route DELETE /api/teams/:id/leave
exports.leaveTeam = async (req, res) => {
  const team = await Team.findById(req.params.id);
  if (!team) return res.status(404).json({ success: false, message: 'Team not found' });

  if (team.leader.toString() === req.user.id) {
    return res.status(400).json({ success: false, message: 'Leader cannot leave. Transfer leadership or delete the team.' });
  }

  team.members = team.members.filter(m => m.user.toString() !== req.user.id);
  team.isOpen = true;
  await team.save();

  res.json({ success: true, message: 'You have left the team' });
};

// @desc  Get my teams (teams I lead or am member of)
// @route GET /api/teams/mine
exports.getMyTeams = async (req, res) => {
  const teams = await Team.find({
    $or: [
      { leader: req.user.id },
      { 'members.user': req.user.id },
    ],
  })
    .populate('leader', 'name handle avatar')
    .populate('members.user', 'name handle avatar')
    .populate('hackathon', 'title emoji accentColor status')
    .populate('project', 'title description progress');

  res.json({ success: true, teams });
};

// @desc  Update team details (leader only)
// @route PUT /api/teams/:id
exports.updateTeam = async (req, res) => {
  const team = await Team.findById(req.params.id);
  if (!team) return res.status(404).json({ success: false, message: 'Team not found' });

  if (team.leader.toString() !== req.user.id) {
    return res.status(403).json({ success: false, message: 'Only the team leader can update the team' });
  }

  const allowed = ['name', 'description', 'rolesNeeded', 'maxSize', 'isOpen', 'accentColor'];
  allowed.forEach(field => {
    if (req.body[field] !== undefined) team[field] = req.body[field];
  });

  await team.save();
  await team.populate([
    { path: 'leader', select: 'name handle avatar level' },
    { path: 'members.user', select: 'name handle avatar' },
    { path: 'hackathon', select: 'title emoji accentColor status' },
  ]);

  res.json({ success: true, message: 'Team updated!', team });
};

// @desc  Transfer leadership to another team member
// @route PUT /api/teams/:id/transfer
exports.transferLeadership = async (req, res) => {
  const { newLeaderId } = req.body;
  if (!newLeaderId) return res.status(400).json({ success: false, message: 'newLeaderId is required' });

  const team = await Team.findById(req.params.id);
  if (!team) return res.status(404).json({ success: false, message: 'Team not found' });

  if (team.leader.toString() !== req.user.id) {
    return res.status(403).json({ success: false, message: 'Only the current leader can transfer leadership' });
  }

  const isMember = team.members.some(m => m.user.toString() === newLeaderId);
  if (!isMember) return res.status(400).json({ success: false, message: 'New leader must be a current team member' });

  // Update roles in members array
  team.members = team.members.map(m => {
    if (m.user.toString() === newLeaderId) return { ...m.toObject(), role: 'Leader' };
    if (m.user.toString() === req.user.id) return { ...m.toObject(), role: 'Member' };
    return m;
  });

  team.leader = newLeaderId;
  await team.save();

  res.json({ success: true, message: 'Leadership transferred successfully!' });
};

// @desc  Delete team (leader only)
// @route DELETE /api/teams/:id
exports.deleteTeam = async (req, res) => {
  const team = await Team.findById(req.params.id);
  if (!team) return res.status(404).json({ success: false, message: 'Team not found' });
  if (team.leader.toString() !== req.user.id) {
    return res.status(403).json({ success: false, message: 'Only the leader can delete the team' });
  }
  await team.deleteOne();
  res.json({ success: true, message: 'Team deleted' });
};
