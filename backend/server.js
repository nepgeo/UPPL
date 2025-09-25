// backend/server.js
require('dotenv').config();

// Core dependencies
const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

// Optional socket helper (if you use sockets)
let initSocket;
try {
  ({ initSocket } = require('./socket'));
} catch (e) {
  // socket file not present or failed to load - proceed without sockets
  initSocket = null;
  // console.warn('Socket module not available:', e.message);
}

// Import routes
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const playerRoutes = require('./routes/playerRoutes');
const userRoutes = require('./routes/userRoutes');
const paymentQRRoutes = require('./routes/paymentQRRoutes');
const adminManagementRoutes = require('./routes/adminManagementRoutes');
const newsRoutes = require('./routes/newsRoutes');
const galleryRoutes = require('./routes/galleryRoutes');
const sponsorRoutes = require('./routes/sponsorRoutes');
const seasonRoutes = require('./routes/seasonRoutes');
const teamRoutes = require('./routes/teamRoutes');
const groupRoutes = require('./routes/groupRoutes');
const matchRoutes = require('./routes/matchRoutes');
const pointsTableRoutes = require('./routes/pointsTableRoutes');
const teamMemberRoutes = require('./routes/teamMemberRoutes');

const { startAutoGroupScheduler } = require('./utils/scheduleGroupGeneration');

// Start background scheduler (interval minutes)
try {
  startAutoGroupScheduler(10); // runs every 10 minutes
} catch (err) {
  console.warn('Failed to start group scheduler:', err?.message || err);
}

// Environment-driven configuration
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173' || 'http://localhost:4173';
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || FRONTEND_URL)
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);




const app = express();
app.set('trust proxy', true);

// Ensure uploads directory exists (some controllers expect these)
const UPLOADS_ROOT = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_ROOT)) {
  fs.mkdirSync(UPLOADS_ROOT, { recursive: true });
}

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// CORS: allow no-origin (Postman) plus configured origins
app.use(cors({
  origin: (origin, callback) => {
    // console.log("🌐 Incoming Origin:", origin); // <== DEBUG LOG
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    console.warn(`🚨 Blocked by CORS: ${origin}`);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
}));

// Security & logging
app.use(helmet({ contentSecurityPolicy: false })); // CSP disabled to avoid common dev issues; customize as needed
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Database connection
const connectDB = require('./config/db');
connectDB().catch(err => {
  console.error('MongoDB connection failed:', err?.message || err);
  // Don't exit immediately, let server try to start (or fail later), but log prominently
});

// Seed Super Admin (one-time safe upsert)
const User = require('./models/User');
const bcrypt = require('bcryptjs');

const seedSuperAdmin = async () => {
  try {
    const email = process.env.SUPER_ADMIN_EMAIL || 'superadmin@pplt20.com';
    const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || 'supersecurepassword';

    const hashed = await bcrypt.hash(superAdminPassword, 10);

    await User.updateOne(
      { email },
      {
        $set: {
          name: 'Super Admin',
          email,
          password: hashed,
          role: 'super-admin',
          verified: true,
          phone: 'N/A',
          bio: '',
          dateOfBirth: '',
          position: '',
          battingStyle: '',
          bowlingStyle: '',
          profileImage: '',
          documents: []
        }
      },
      { upsert: true }
    );

    if (process.env.NODE_ENV !== 'production') {
      console.log(`✅ Super Admin created/updated: ${email} (password from env or default)`);
    }
  } catch (err) {
    console.error('❌ Failed to seed super admin:', err?.message || err);
  }
};
seedSuperAdmin().catch(() => {/* ignore top-level seed errors */});

// Default route / health
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Udaydev Patan Premier League (UPPL) API',
    status: 'OK',
    uptime: process.uptime(),
    env: process.env.NODE_ENV || 'development'
  });
});

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/player', playerRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin-management', adminManagementRoutes);

app.use('/api/teams', teamRoutes);
app.use('/api/seasons', seasonRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api', matchRoutes);

app.use('/api/news', newsRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/payment-qr', paymentQRRoutes);
app.use('/api/team-members', teamMemberRoutes);
app.use('/api/sponsors', sponsorRoutes);
app.use('/api/points-table', pointsTableRoutes);

// Serve uploads with safe CORS headers to allow accessing images from frontend
app.use('/uploads', (req, res, next) => {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
}, express.static(path.join(__dirname, 'uploads')));


// --- Helper: show registered routes (useful in dev)
app._showRoutes = () => {
  if (!app._router) {
    console.log('⚠️ Router not initialized yet — cannot show routes.');
    return;
  }

  const routes = [];

  app._router.stack.forEach((middleware) => {
    if (middleware.route) {
      // direct routes
      const methods = Object.keys(middleware.route.methods).join(', ').toUpperCase();
      routes.push(`${methods} ${middleware.route.path}`);
    } else if (middleware.name === 'router' && middleware.handle?.stack) {
      middleware.handle.stack.forEach((handler) => {
        if (handler.route) {
          const methods = Object.keys(handler.route.methods).join(', ').toUpperCase();
          routes.push(`${methods} ${handler.route.path}`);
        }
      });
    }
  });

  if (routes.length === 0) {
    console.log('ℹ️ No routes registered.');
  } else {
    console.log('✅ Registered Routes:\n', routes.join('\n '));
  }
};

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ message: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err?.stack || err);
  // if it is a CORS error, send 403
  if (err && /CORS/i.test(err.message || '')) {
    return res.status(403).json({ message: 'CORS error', error: err.message });
  }
  res.status(500).json({
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? (err?.message || err) : undefined
  });
});

// Start server (use http server to enable socket.io if needed)
const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  // Show routes in dev to help debugging
  setTimeout(() => {
    if (process.env.NODE_ENV === 'development') {
      app._showRoutes();
    }
  }, 100);
});

// Initialize socket.io (if available)
if (initSocket) {
  try {
    // Pass allowed origins (array of origins)
    initSocket(server, { allowedOrigins: ALLOWED_ORIGINS });
    console.log('⚡ Socket.IO initialized with allowed origins:', ALLOWED_ORIGINS);
  } catch (err) {
    console.warn('Socket init failed:', err?.message || err);
  }
} else {
  // no socket module present - harmless
  // console.log('Socket module not loaded; skipping socket initialization.');
}

// Graceful error handling for process-level errors
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err?.stack || err);
  // Optionally exit or keep running; for now just log.
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Optionally exit or keep running; for now just log.
});
