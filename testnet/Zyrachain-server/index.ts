import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables FIRST, before any other imports
const envPath = path.resolve(process.cwd(), '.env.local');
console.log('🔍 Looking for .env.local at:', envPath);
dotenv.config({ path: envPath });
dotenv.config(); // Also load from current directory as fallback

// Now import modules that depend on environment variables
import connectToDatabase from './zyrachain-lib/lib/mongodb';
import { serverPiConfig } from './zyrachain-lib/config/pi-config';
import mongoose from 'mongoose';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

// Import routes
import piRoutes from './routes/pi';
import listingRoutes from './routes/listings';
import userRoutes from './routes/users';
import adminRoutes from './routes/admin';
import adminOtpRoutes from './routes/admin-otp';
import authRoutes from './routes/auth';
import ecosystemRoutes from './routes/ecosystem';
import eventsRoutes from './routes/events';
import hackathonsRoutes from './routes/hackathons';
import coreTeamRoutes from './routes/core-team';
import uploadRoutes from './routes/upload';
import oracleRoutes from './routes/oracle';
import socialStatsRoutes from './routes/social-stats';
import pctMonitorRoutes from './routes/pct-monitor';
import cexMonitorRoutes from './routes/cex-monitor';
import v2HomeRoutes from './routes/v2-home';
import chartRoutes from './routes/charts';
import communityFollowersRoutes from './routes/community-followers';
import socialTokensRoutes from './routes/social-tokens';
import socialPostsRoutes from './routes/social-posts';
import socialUsersRoutes from './routes/social-users';
import socialBadgesRoutes from './routes/social-badges';
import socialModerationRoutes from './routes/social-moderation';
import socialAdsRoutes from './routes/social-ads';
import socialGamificationRoutes from './routes/social-gamification';
import supportRoutes from './routes/support';
import addressesRoutes from './routes/addresses';
import socialReferralsRoutes from './routes/social-referrals';
import cron from 'node-cron';
import { runPctBalanceScan } from './services/pct-balance-scanner';
import { ensureHotIndexes } from './services/ensureIndexes';
import { startSnapshotScheduler } from './workers/snapshotScheduler';
import { startPctStreamer } from './services/pct-streamer';
import { startCommunityFollowerSnapshotter } from './services/community-follower-snapshotter';
import { getMetricsSnapshot } from './services/metrics';
import { recordPrice, trimOldPrices } from './oracle/services/priceHistory';
import { runTrendingScorer } from './services/trending-scorer';
import { runModerationResolver } from './services/moderation-resolver';
import { seedDefaultBadges } from './services/badge-evaluator';
const app: Express = express();
app.set('trust proxy', 1);
const PORT = process.env.SERVER_PORT || 4000;

// Debug environment variables
console.log('🔧 Environment check:');
console.log('  MONGODB_URI:', process.env.MONGODB_URI ? '✅ Set' : '❌ Not set');
console.log('  NODE_ENV:', process.env.NODE_ENV || 'development');

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));
app.use(cors({
  origin: [
    'http://localhost:8000',  // Next.js frontend
    'http://localhost:3000',  // Alternative frontend port
    'http://localhost:5173',  // Vite dev server (admin app)
    'http://localhost:4173',  // Vite preview server
    process.env.FRONTEND_URL || 'http://localhost:8000',
    'https://testnet.zyrachain.org', // Deployed frontend (Pi Browser)
    'https://zyrachain.org',
    'https://www.zyrachain.org',
    'https://www.Zyrachain.app',
    'https://Zyrachain.app',
    'https://Zyrachain.vercel.app',
    'https://fupi.work',    // Production domain
    'https://www.fupi.work', // Production domain with www
    'https://admin.zyrachain.org',  // Admin dashboard
    'https://api.minepi.com',            // Pi Network mainnet API
    'https://api.testnet.minepi.com',    // Pi Network testnet API
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
}));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX_PER_WINDOW || (process.env.NODE_ENV === 'production' ? 800 : 20000)),
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again later.',
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/api', apiLimiter);

const FRONTEND_DOMAINS = [
  'http://localhost:8000',
  'http://localhost:3000',
  'https://zyrachain.app',
  'https://www.zyrachain.app',
  'https://zyrachain.vercel.app',
  'https://testnet.zyrachain.org',
  'https://www.testnet.zyrachain.org',
  'https://admin.zyrachain.org',
  'https://api.minepi.com',
  'https://api.testnet.minepi.com',
];

function requireFrontendAccess(req: Request, res: Response, next: NextFunction): void {
  const origin = req.get('origin') || req.get('referer') || '';
  // Server-side fetches (e.g., Next.js server components) have no Origin/Referer
  if (!origin) { next(); return; }
  const isFromFrontend = FRONTEND_DOMAINS.some(d => origin.startsWith(d));
  const hasPiAuth = (req.get('authorization') || '').startsWith('Bearer ');
  if (!isFromFrontend && !hasPiAuth) {
    res.status(403).json({ error: 'Access restricted to frontend only' });
    return;
  }
  next();
}

// Routes
// Public routes — restricted to frontend + Pi-authenticated requests
app.use('/api/listings', requireFrontendAccess, listingRoutes);
app.use('/api/users', requireFrontendAccess, userRoutes);
app.use('/api/ecosystem', requireFrontendAccess, ecosystemRoutes);
app.use('/api/events', requireFrontendAccess, eventsRoutes);
app.use('/api/hackathons', requireFrontendAccess, hackathonsRoutes);
app.use('/api/social-stats', requireFrontendAccess, socialStatsRoutes);
app.use('/api/pct-monitor', requireFrontendAccess, pctMonitorRoutes);
app.use('/api/cex-monitor', requireFrontendAccess, cexMonitorRoutes);
app.use('/api/v2/home', requireFrontendAccess, v2HomeRoutes);
app.use('/api/charts', requireFrontendAccess, chartRoutes);
app.use('/api/community-followers', requireFrontendAccess, communityFollowersRoutes);
app.use('/api/social/tokens', requireFrontendAccess, socialTokensRoutes);
app.use('/api/social/posts', requireFrontendAccess, socialPostsRoutes);
app.use('/api/social/users', requireFrontendAccess, socialUsersRoutes);
app.use('/api/social/badges', requireFrontendAccess, socialBadgesRoutes);
app.use('/api/social/moderation', requireFrontendAccess, socialModerationRoutes);
app.use('/api/social/ads', requireFrontendAccess, socialAdsRoutes);
app.use('/api/social/gamification', requireFrontendAccess, socialGamificationRoutes);
app.use('/api/social/referrals', requireFrontendAccess, socialReferralsRoutes);
app.use('/api', requireFrontendAccess, supportRoutes);
app.use('/api/addresses', requireFrontendAccess, addressesRoutes);

// Core routes
app.use('/api/pi', piRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin', adminOtpRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/core-team-contact', coreTeamRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/oracle', oracleRoutes);

// how the frontend call addresses
// /api/ecosystem?type=generated-addresses 
// /api/ecosystem?type=cex-addresses
// /api/ecosystem?type=core-team-addresses

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    metrics: getMetricsSnapshot(),
    piConfig: {
      env: serverPiConfig.PI_ENV,
      hasApiKey: !!process.env.PI_NETWORK_API_KEY
    }
  });
});

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Zyrachain Pi Network Server API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      pi: '/api/pi/*',
      oracle: '/api/oracle/*'
    }
  });
});

// CORS test endpoint
app.get('/cors-test', (req: Request, res: Response) => {
  res.json({
    message: 'CORS test successful',
    origin: req.headers.origin,
    timestamp: new Date().toISOString()
  });
});

app.use((err: unknown, _req: Request, res: Response, _next: unknown) => {
  console.error('Server error:', err);
  const message = err instanceof Error ? err.message : 'Internal server error';
  res.status(500).json({
    error: 'Internal server error',
    message,
    ...(process.env.NODE_ENV === 'development' &&
      err instanceof Error &&
      err.stack && { stack: err.stack }),
  });
});

// Start server
async function startServer() {
  try {
    // Connect to MongoDB
    await connectToDatabase();
    console.log('✅ MongoDB connection established');

    await ensureHotIndexes().catch((e) => console.warn('ensureHotIndexes:', e));
    startSnapshotScheduler();
    startPctStreamer();
    startCommunityFollowerSnapshotter();

    // Start HTTP server
    app.listen(PORT, () => {
      console.log(`🚀 Zyrachain Pi Server running on port ${PORT}`);
      console.log(`📍 Health check: http://localhost:${PORT}/health`);
      console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌍 CORS enabled for frontend: http://localhost:8000`);
    });

    if (process.env.PCT_STREAM_ENABLED === 'true') {
      startPctStreamer();
      console.log('📡 PCT stream mode enabled; balance refresh runs every 5 min');
    }
    if (process.env.PCT_SCAN_ENABLED === 'true') {
      const expr = process.env.PCT_SCAN_CRON || '*/5 * * * *';
      cron.schedule(expr, () => {
        console.log('[pct-scan] cron tick');
        runPctBalanceScan().catch((e) => console.error('[pct-scan] cron error', e));
      });
      console.log(`📅 PCT balance scan scheduled: ${expr}`);
    }

    // Record price to history every 5 minutes from oracle.suban.org
    const ORACLE_URL = process.env.ORACLE_BASE_URL || 'https://oracle.suban.org';
    const priceCronExpr = process.env.PRICE_HISTORY_CRON || '*/5 * * * *';
    cron.schedule(priceCronExpr, async () => {
      try {
        const res = await fetch(`${ORACLE_URL}/api/v1/price`);
        if (res.ok) {
          const data = await res.json() as { price_usd: number };
          await recordPrice(data.price_usd, 'zyrachain-oracle');
          await trimOldPrices();
        }
      } catch (e) {
        console.error('[price-history] record error', e);
      }
    });
    console.log(`📅 Price history recording scheduled: ${priceCronExpr}`);

    // Social: trending score recalculation every 5 min
    const socialTrendingCron = process.env.SOCIAL_TRENDING_CRON || '*/5 * * * *';
    cron.schedule(socialTrendingCron, () => {
      runTrendingScorer().catch((e) => console.error('[social-trending] cron error', e));
    });
    console.log(`📅 Social trending scorer scheduled: ${socialTrendingCron}`);

    // Social: moderation queue resolution every 15 min
    const socialModerationCron = process.env.SOCIAL_MODERATION_CRON || '*/15 * * * *';
    cron.schedule(socialModerationCron, () => {
      runModerationResolver().catch((e) => console.error('[social-moderation] cron error', e));
    });
    console.log(`📅 Social moderation resolver scheduled: ${socialModerationCron}`);

    // Social: expire boosted posts daily
    cron.schedule('5 0 * * *', async () => {
      try {
        const Post = require('./zyrachain-lib/lib/models/Post').default;
        const result = await Post.updateMany(
          { is_boosted: true, boost_expires_at: { $lte: new Date() } },
          { $set: { is_boosted: false } }
        );
        console.log(`[social-boost] Expired ${result.modifiedCount} boosted posts`);
      } catch (e) {
        console.error('[social-boost] cron error', e);
      }
    });
    console.log('📅 Social boost expiry scheduled: daily at 00:05');

    // Social: seed default badges on startup
    seedDefaultBadges().catch((e) => console.warn('[social-badges] seed error:', e));

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

startServer(); 
