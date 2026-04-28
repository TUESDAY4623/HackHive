const express = require('express');
const {
  getProjects, getProject, createProject, updateProject,
  deleteProject, likeProject, addComment, requestJoin, handleJoinRequest,
} = require('../controllers/project.controller');
const { protect, optionalAuth } = require('../middleware/auth');
const { validateCreateProject } = require('../middleware/validate');

const router = express.Router();

router.get('/', optionalAuth, getProjects);
router.get('/:id', optionalAuth, getProject);
router.post('/', protect, validateCreateProject, createProject);
router.put('/:id', protect, updateProject);
router.delete('/:id', protect, deleteProject);
router.put('/:id/like', protect, likeProject);
router.post('/:id/comments', protect, addComment);
router.post('/:id/join', protect, requestJoin);
router.put('/:id/join/:requestId', protect, handleJoinRequest);

module.exports = router;
