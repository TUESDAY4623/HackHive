import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const initSocket = (token: string): Socket => {
  if (socket) return socket;

  socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000', {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => {
    console.log('🔌 Socket connected:', socket?.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('🔌 Socket disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('🔌 Socket connection error:', error.message);
  });

  return socket;
};

export const getSocket = (): Socket | null => socket;

export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const joinConversation = (conversationId: string): void => {
  socket?.emit('conversation:join', conversationId);
};

export const leaveConversation = (conversationId: string): void => {
  socket?.emit('conversation:leave', conversationId);
};

export const sendSocketMessage = (conversationId: string, text: string): void => {
  socket?.emit('message:send', { conversationId, text });
};

export const emitTypingStart = (conversationId: string): void => {
  socket?.emit('typing:start', conversationId);
};

export const emitTypingStop = (conversationId: string): void => {
  socket?.emit('typing:stop', conversationId);
};
