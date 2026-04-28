const express = require('express');
const {
  getConversations, getOrCreateConversation,
  getMessages, sendMessage,
} = require('../controllers/message.controller');
const { protect } = require('../middleware/auth');
const { validateSendMessage, validateStartConversation } = require('../middleware/validate');

const router = express.Router();

router.get('/', protect, getConversations);
router.post('/', protect, validateStartConversation, getOrCreateConversation);
router.get('/:id/messages', protect, getMessages);
router.post('/:id/messages', protect, validateSendMessage, sendMessage);

module.exports = router;
