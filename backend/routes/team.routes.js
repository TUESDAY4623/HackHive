const express = require('express');
const {
  getTeams, getTeam, createTeam, requestJoin,
  handleRequest, leaveTeam, getMyTeams, updateTeam,
  transferLeadership, deleteTeam,
} = require('../controllers/team.controller');
const { protect } = require('../middleware/auth');
const { validateCreateTeam } = require('../middleware/validate');

const router = express.Router();

// IMPORTANT: /mine must be before /:id so Express doesn't treat "mine" as an :id param
router.get('/mine', protect, getMyTeams);
router.get('/', getTeams);
router.get('/:id', getTeam);
router.post('/', protect, validateCreateTeam, createTeam);
router.post('/:id/join', protect, requestJoin);
router.put('/:id/requests/:requestId', protect, handleRequest);
router.put('/:id/transfer', protect, transferLeadership);
router.put('/:id', protect, updateTeam);
router.delete('/:id/leave', protect, leaveTeam);
router.delete('/:id', protect, deleteTeam);

module.exports = router;
