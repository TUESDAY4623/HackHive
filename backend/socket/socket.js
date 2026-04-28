const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');

const onlineUsers = new Map(); // userId -> socketId

const initSocket = (io) => {
  // ── Auth middleware for socket ──────────────────────────────
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication error'));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      if (!user) return next(new Error('User not found'));
      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.user._id.toString();
    onlineUsers.set(userId, socket.id);

    // Mark user online
    await User.findByIdAndUpdate(userId, { isOnline: true, lastSeen: new Date() });

    // Broadcast online status
    io.emit('user:online', { userId });
    console.log(`🟢 User connected: ${socket.user.name} (${socket.id})`);

    // ── Join / Leave conversation rooms ───────────────────────
    socket.on('conversation:join', (conversationId) => {
      socket.join(`conv:${conversationId}`);
    });

    socket.on('conversation:leave', (conversationId) => {
      socket.leave(`conv:${conversationId}`);
    });

    // ── message:relay ─────────────────────────────────────────
    // The HTTP endpoint (POST /api/conversations/:id/messages) saves the message
    // to the DB and returns the populated message object. The frontend then emits
    // message:relay with that object so the socket can broadcast it to other
    // participants in real-time WITHOUT a second DB write.
    // This prevents every message being stored twice.
    socket.on('message:relay', async (data) => {
      try {
        const { conversationId, message } = data;
        if (!conversationId || !message) return;

        // Verify the sender is a participant (security check)
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) return;
        if (!conversation.participants.map(p => p.toString()).includes(userId)) return;

        // Broadcast the already-saved message to the room
        socket.to(`conv:${conversationId}`).emit('message:new', message);

        // Push a notification to offline participants who aren't in the room
        conversation.participants.forEach((pid) => {
          const pidStr = pid.toString();
          if (pidStr !== userId) {
            const recipientSocketId = onlineUsers.get(pidStr);
            if (recipientSocketId) {
              io.to(recipientSocketId).emit('notification:message', {
                conversationId,
                sender: { name: socket.user.name, avatar: socket.user.avatar },
                preview: (message.text || '').substring(0, 60),
              });
            }
          }
        });
      } catch (err) {
        socket.emit('error', { message: 'Failed to relay message' });
      }
    });

    // ── message:send (legacy / fallback — saves to DB via socket) ──
    // This is kept for backward compatibility. If the frontend can't use
    // the HTTP + relay pattern it can still use this event directly.
    // It will NOT be called alongside the HTTP endpoint — only one or the other.
    socket.on('message:send', async (data) => {
      try {
        const { conversationId, text } = data;

        const conversation = await Conversation.findById(conversationId);
        if (!conversation || !conversation.participants.map(p => p.toString()).includes(userId)) return;

        const message = await Message.create({
          conversation: conversationId,
          sender: userId,
          text,
          readBy: [userId],
        });

        const populated = await message.populate('sender', 'name handle avatar');

        // Update conversation meta
        conversation.lastMessage = message._id;
        conversation.lastMessageAt = new Date();
        conversation.participants.forEach((pid) => {
          const pidStr = pid.toString();
          if (pidStr !== userId) {
            const current = conversation.unreadCount?.get(pidStr) || 0;
            if (!conversation.unreadCount) conversation.unreadCount = new Map();
            conversation.unreadCount.set(pidStr, current + 1);
          }
        });
        conversation.markModified('unreadCount');
        await conversation.save();

        // Emit to all in room (including sender for confirmation)
        io.to(`conv:${conversationId}`).emit('message:new', populated);

        // Notify offline participants
        conversation.participants.forEach((pid) => {
          const pidStr = pid.toString();
          if (pidStr !== userId) {
            const recipientSocketId = onlineUsers.get(pidStr);
            if (recipientSocketId) {
              io.to(recipientSocketId).emit('notification:message', {
                conversationId,
                sender: { name: socket.user.name, avatar: socket.user.avatar },
                preview: text.substring(0, 60),
              });
            }
          }
        });
      } catch (err) {
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // ── Typing indicators ─────────────────────────────────────
    socket.on('typing:start', (conversationId) => {
      socket.to(`conv:${conversationId}`).emit('typing:start', {
        userId,
        name: socket.user.name,
        conversationId,
      });
    });

    socket.on('typing:stop', (conversationId) => {
      socket.to(`conv:${conversationId}`).emit('typing:stop', { userId, conversationId });
    });

    // ── Disconnect ────────────────────────────────────────────
    socket.on('disconnect', async () => {
      onlineUsers.delete(userId);
      await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen: new Date() });
      io.emit('user:offline', { userId });
      console.log(`🔴 User disconnected: ${socket.user.name}`);
    });
  });
};

module.exports = { initSocket, onlineUsers };
