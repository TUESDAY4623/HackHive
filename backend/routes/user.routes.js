const express = require('express');
const {
  getUsers,
  getUser,
  getUserByHandle,
  updateProfile,
  updateSkills,
  deleteAccount,
  getUserProjects,
  getUserTeams,
} = require('../controllers/user.controller');
const { protect } = require('../middleware/auth');

const router = express.Router();

// ── Static / self routes MUST come before /:id to avoid "me" being parsed as ObjectId ──
router.put('/me', protect, updateProfile);
router.put('/me/skills', protect, updateSkills);
router.delete('/me', protect, deleteAccount);

// ── Public routes ──
router.get('/', getUsers);
router.get('/handle/:handle', getUserByHandle);
router.get('/:id', getUser);
router.get('/:id/projects', getUserProjects);
router.get('/:id/teams', getUserTeams);

module.exports = router;
