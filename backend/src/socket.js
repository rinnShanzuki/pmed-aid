const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io;

module.exports = {
  init: (server) => {
    io = new Server(server, {
      cors: {
        origin: ['http://localhost:5173', 'http://localhost:5174', process.env.FRONTEND_URL].filter(Boolean),
        credentials: true,
      },
    });

    io.use((socket, next) => {
      // 1. Try to get token from handshake auth (for web client)
      let token = socket.handshake.auth?.token;

      // 2. Fallback to cookies if sent via web client with credentials
      if (!token && socket.handshake.headers.cookie) {
        const cookies = socket.handshake.headers.cookie.split(';');
        const tokenCookie = cookies.find((c) => c.trim().startsWith('token='));
        if (tokenCookie) {
          token = tokenCookie.split('=')[1];
        }
      }

      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.userId;
        next();
      } catch (err) {
        return next(new Error('Authentication error: Invalid token'));
      }
    });

    io.on('connection', (socket) => {
      console.log(`⚡ Client connected: ${socket.id} (User ID: ${socket.userId})`);

      // Join a personal room based on user ID for direct messages
      socket.join(`user_${socket.userId}`);

      socket.on('disconnect', () => {
        console.log(`🔌 Client disconnected: ${socket.id} (User ID: ${socket.userId})`);
      });
    });

    return io;
  },

  getIo: () => {
    if (!io) {
      throw new Error('Socket.io not initialized!');
    }
    return io;
  },
};
