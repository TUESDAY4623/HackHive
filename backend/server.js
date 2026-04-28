require('dotenv').config();
require('express-async-errors');
const cron = require('node-cron');

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/db');
const errorHandler = require('./middleware/error');
const User = require('./models/User');
const { initSocket } = require('./socket/socket');
const { syncExternalHackathons } = require('./services/externalHackathons');

// Routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const projectRoutes = require('./routes/project.routes');
const hackathonRoutes = require('./routes/hackathon.routes');
const conversationRoutes = require('./routes/conversation.routes');
const syncRoutes = require('./routes/sync.routes');
const teamRoutes = require('./routes/team.routes');

// Connect to MongoDB then trigger initial sync
connectDB().then(() => {
  // Initial sync 5 seconds after startup (gives DB time to fully connect)
  setTimeout(() => {
    syncExternalHackathons().catch(err => console.warn('Initial sync failed:', err.message));
  }, 5000);

  // Auto-sync every 6 hours: minute 0, every 6th hour
  cron.schedule('0 */6 * * *', () => {
    console.log('⏰ Cron: Running scheduled hackathon sync...');
    syncExternalHackathons().catch(err => console.warn('Scheduled sync failed:', err.message));
  });

  console.log('⏰ Hackathon auto-sync scheduled every 6 hours');
}).catch(err => {
  console.error('DB connection failed, skipping sync schedule');
});

const app = express();
const server = http.createServer(app);

// ===================== SOCKET.IO =====================
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});
initSocket(io);

// ===================== PASSPORT OAUTH =====================

// GitHub Strategy
passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/auth/github/callback`,
      scope: ['user:email'],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ githubId: profile.id });

        if (!user) {
          // Check if email already exists
          const email = profile.emails?.[0]?.value;
          if (email) {
            user = await User.findOne({ email });
            if (user) {
              user.githubId = profile.id;
              user.githubUrl = profile.profileUrl;
              if (!user.avatar) user.avatar = profile.photos?.[0]?.value || '';
              await user.save();
              return done(null, user);
            }
          }

          // Create new user
          const handle = await generateUniqueHandle(profile.username || profile.displayName);
          user = await User.create({
            githubId: profile.id,
            name: profile.displayName || profile.username,
            handle,
            email: email || `github_${profile.id}@hackhive.app`,
            avatar: profile.photos?.[0]?.value || '',
            githubUrl: profile.profileUrl,
          });
        }
        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

// Google Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ googleId: profile.id });

        if (!user) {
          const email = profile.emails?.[0]?.value;
          if (email) {
            user = await User.findOne({ email });
            if (user) {
              user.googleId = profile.id;
              if (!user.avatar) user.avatar = profile.photos?.[0]?.value || '';
              await user.save();
              return done(null, user);
            }
          }

          const handle = await generateUniqueHandle(profile.displayName);
          user = await User.create({
            googleId: profile.id,
            name: profile.displayName,
            handle,
            email: email || `google_${profile.id}@hackhive.app`,
            avatar: profile.photos?.[0]?.value || '',
          });
        }
        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

// Helper: generate unique handle from display name
async function generateUniqueHandle(name) {
  let base = name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .substring(0, 20);
  if (!base) base = 'user';
  let handle = base;
  let count = 0;
  while (await User.findOne({ handle })) {
    count++;
    handle = `${base}${count}`;
  }
  return handle;
}

// ===================== MIDDLEWARE =====================
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(passport.initialize());

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { success: false, message: 'Too many requests, please try again later' },
});
app.use('/api', limiter);

// Strict rate limit for auth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many auth attempts, please try again later' },
});
app.use('/api/auth', authLimiter);

// ===================== ROUTES =====================
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/hackathons', hackathonRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/teams', teamRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: '🐝 HackHive API is running',
    env: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// Global error handler
app.use(errorHandler);

// ===================== START SERVER =====================
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`\n🐝 HackHive API running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  console.log(`📡 Socket.io ready for real-time connections`);
  console.log(`🔗 http://localhost:${PORT}/api/health\n`);
});

module.exports = { app, server };
