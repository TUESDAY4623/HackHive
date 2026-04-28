const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

// @desc    Get all conversations for current user
// @route   GET /api/conversations
// @access  Private
exports.getConversations = async (req, res) => {
  const conversations = await Conversation.find({ participants: req.user.id })
    .populate('participants', 'name handle avatar isOnline lastSeen')
    .populate('lastMessage')
    .sort({ lastMessageAt: -1 });

  // Format: remove self from participants list, add unread count
  const formatted = conversations.map((conv) => {
    const other = conv.participants.filter((p) => p._id.toString() !== req.user.id);
    const unread = conv.unreadCount?.get(req.user.id) || 0;
    return { ...conv.toObject(), otherParticipants: other, unread };
  });

  res.status(200).json({ success: true, conversations: formatted });
};

// @desc    Get or create conversation with a user
// @route   POST /api/conversations
// @access  Private
exports.getOrCreateConversation = async (req, res) => {
  const { recipientId } = req.body;

  if (recipientId === req.user.id) {
    return res.status(400).json({ success: false, message: 'Cannot message yourself' });
  }

  let conversation = await Conversation.findOne({
    participants: { $all: [req.user.id, recipientId] },
    isGroup: false,
  })
    .populate('participants', 'name handle avatar isOnline lastSeen')
    .populate('lastMessage');

  if (!conversation) {
    conversation = await Conversation.create({ participants: [req.user.id, recipientId] });
    conversation = await conversation.populate('participants', 'name handle avatar isOnline lastSeen');
  }

  res.status(200).json({ success: true, conversation });
};

// @desc    Get messages in a conversation
// @route   GET /api/conversations/:id/messages
// @access  Private
exports.getMessages = async (req, res) => {
  const conversation = await Conversation.findById(req.params.id);
  if (!conversation) return res.status(404).json({ success: false, message: 'Conversation not found' });
  if (!conversation.participants.includes(req.user.id)) {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  const { page = 1, limit = 50 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const messages = await Message.find({ conversation: req.params.id })
    .populate('sender', 'name handle avatar')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  // Mark messages as read
  await Message.updateMany(
    { conversation: req.params.id, readBy: { $ne: req.user.id } },
    { $push: { readBy: req.user.id } }
  );

  // Reset unread count
  const unreadKey = `unreadCount.${req.user.id}`;
  await Conversation.findByIdAndUpdate(req.params.id, { $set: { [unreadKey]: 0 } });

  res.status(200).json({ success: true, messages: messages.reverse() });
};

// @desc    Send a message
// @route   POST /api/conversations/:id/messages
// @access  Private
exports.sendMessage = async (req, res) => {
  const conversation = await Conversation.findById(req.params.id);
  if (!conversation) return res.status(404).json({ success: false, message: 'Conversation not found' });
  if (!conversation.participants.includes(req.user.id)) {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  const message = await Message.create({
    conversation: req.params.id,
    sender: req.user.id,
    text: req.body.text,
  });

  // Update conversation
  conversation.lastMessage = message._id;
  conversation.lastMessageAt = new Date();

  // Increment unread for all other participants
  conversation.participants.forEach((participantId) => {
    if (participantId.toString() !== req.user.id) {
      const key = participantId.toString();
      const current = conversation.unreadCount?.get(key) || 0;
      if (!conversation.unreadCount) conversation.unreadCount = new Map();
      conversation.unreadCount.set(key, current + 1);
    }
  });

  conversation.markModified('unreadCount');
  await conversation.save();

  const populated = await message.populate('sender', 'name handle avatar');

  res.status(201).json({ success: true, message: populated });
};
