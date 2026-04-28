const express = require('express');
const {
  getHackathons,
  getFeaturedHackathons,
  getHackathon,
  getHackathonTeams,
  createHackathon,
  updateHackathon,
  deleteHackathon,
  registerForHackathon,
} = require('../controllers/hackathon.controller');
const { protect } = require('../middleware/auth');

const router = express.Router();

// IMPORTANT: Static routes must come before /:id param routes
router.get('/featured', getFeaturedHackathons);
router.get('/', getHackathons);
router.get('/:id', getHackathon);
router.get('/:id/teams', getHackathonTeams);
router.post('/', protect, createHackathon);
router.put('/:id', protect, updateHackathon);
router.put('/:id/register', protect, registerForHackathon);
router.delete('/:id', protect, deleteHackathon);

module.exports = router;
