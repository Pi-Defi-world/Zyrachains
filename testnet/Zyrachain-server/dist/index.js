"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const envPath = path_1.default.resolve(process.cwd(), '.env.local');
console.log('🔍 Looking for .env.local at:', envPath);
dotenv_1.default.config({ path: envPath });
dotenv_1.default.config();
const mongodb_1 = __importDefault(require("./zyrachain-lib/lib/mongodb"));
const pi_config_1 = require("./zyrachain-lib/config/pi-config");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const helmet_1 = __importDefault(require("helmet"));
const pi_1 = __importDefault(require("./routes/pi"));
const listings_1 = __importDefault(require("./routes/listings"));
const users_1 = __importDefault(require("./routes/users"));
const admin_1 = __importDefault(require("./routes/admin"));
const admin_otp_1 = __importDefault(require("./routes/admin-otp"));
const auth_1 = __importDefault(require("./routes/auth"));
const ecosystem_1 = __importDefault(require("./routes/ecosystem"));
const events_1 = __importDefault(require("./routes/events"));
const hackathons_1 = __importDefault(require("./routes/hackathons"));
const core_team_1 = __importDefault(require("./routes/core-team"));
const upload_1 = __importDefault(require("./routes/upload"));
const oracle_1 = __importDefault(require("./routes/oracle"));
const social_stats_1 = __importDefault(require("./routes/social-stats"));
const pct_monitor_1 = __importDefault(require("./routes/pct-monitor"));
const cex_monitor_1 = __importDefault(require("./routes/cex-monitor"));
const v2_home_1 = __importDefault(require("./routes/v2-home"));
const charts_1 = __importDefault(require("./routes/charts"));
const community_followers_1 = __importDefault(require("./routes/community-followers"));
const social_tokens_1 = __importDefault(require("./routes/social-tokens"));
const social_posts_1 = __importDefault(require("./routes/social-posts"));
const social_users_1 = __importDefault(require("./routes/social-users"));
const social_badges_1 = __importDefault(require("./routes/social-badges"));
const social_moderation_1 = __importDefault(require("./routes/social-moderation"));
const social_ads_1 = __importDefault(require("./routes/social-ads"));
const social_gamification_1 = __importDefault(require("./routes/social-gamification"));
const support_1 = __importDefault(require("./routes/support"));
const addresses_1 = __importDefault(require("./routes/addresses"));
const social_referrals_1 = __importDefault(require("./routes/social-referrals"));
const node_cron_1 = __importDefault(require("node-cron"));
const pct_balance_scanner_1 = require("./services/pct-balance-scanner");
const ensureIndexes_1 = require("./services/ensureIndexes");
const snapshotScheduler_1 = require("./workers/snapshotScheduler");
const pct_streamer_1 = require("./services/pct-streamer");
const community_follower_snapshotter_1 = require("./services/community-follower-snapshotter");
const metrics_1 = require("./services/metrics");
const priceHistory_1 = require("./oracle/services/priceHistory");
const trending_scorer_1 = require("./services/trending-scorer");
const moderation_resolver_1 = require("./services/moderation-resolver");
const badge_evaluator_1 = require("./services/badge-evaluator");
const app = (0, express_1.default)();
app.set('trust proxy', 1);
const PORT = process.env.SERVER_PORT || 4000;
console.log('🔧 Environment check:');
console.log('  MONGODB_URI:', process.env.MONGODB_URI ? '✅ Set' : '❌ Not set');
console.log('  NODE_ENV:', process.env.NODE_ENV || 'development');
app.use((0, helmet_1.default)({
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
app.use((0, cors_1.default)({
    origin: [
        'http://localhost:8000',
        'http://localhost:3000',
        'http://localhost:5173',
        'http://localhost:4173',
        process.env.FRONTEND_URL || 'http://localhost:8000',
        'https://testnet.zyrachain.org',
        'https://zyrachain.org',
        'https://www.zyrachain.org',
        'https://www.Zyrachain.app',
        'https://Zyrachain.app',
        'https://Zyrachain.vercel.app',
        'https://fupi.work',
        'https://www.fupi.work',
        'https://api.minepi.com',
        'https://api.testnet.minepi.com',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    optionsSuccessStatus: 200
}));
const apiLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: Number(process.env.RATE_LIMIT_MAX_PER_WINDOW || (process.env.NODE_ENV === 'production' ? 800 : 20000)),
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many requests from this IP, please try again later.',
});
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.use('/api', apiLimiter);
const FRONTEND_DOMAINS = [
    'http://localhost:8000',
    'http://localhost:3000',
    'https://zyrachain.app',
    'https://www.zyrachain.app',
    'https://zyrachain.vercel.app',
    'https://testnet.zyrachain.org',
    'https://www.testnet.zyrachain.org',
    'https://api.minepi.com',
    'https://api.testnet.minepi.com',
];
function requireFrontendAccess(req, res, next) {
    const origin = req.get('origin') || req.get('referer') || '';
    if (!origin) {
        next();
        return;
    }
    const isFromFrontend = FRONTEND_DOMAINS.some(d => origin.startsWith(d));
    const hasPiAuth = (req.get('authorization') || '').startsWith('Bearer ');
    if (!isFromFrontend && !hasPiAuth) {
        res.status(403).json({ error: 'Access restricted to frontend only' });
        return;
    }
    next();
}
app.use('/api/listings', requireFrontendAccess, listings_1.default);
app.use('/api/users', requireFrontendAccess, users_1.default);
app.use('/api/ecosystem', requireFrontendAccess, ecosystem_1.default);
app.use('/api/events', requireFrontendAccess, events_1.default);
app.use('/api/hackathons', requireFrontendAccess, hackathons_1.default);
app.use('/api/social-stats', requireFrontendAccess, social_stats_1.default);
app.use('/api/pct-monitor', requireFrontendAccess, pct_monitor_1.default);
app.use('/api/cex-monitor', requireFrontendAccess, cex_monitor_1.default);
app.use('/api/v2/home', requireFrontendAccess, v2_home_1.default);
app.use('/api/charts', requireFrontendAccess, charts_1.default);
app.use('/api/community-followers', requireFrontendAccess, community_followers_1.default);
app.use('/api/social/tokens', requireFrontendAccess, social_tokens_1.default);
app.use('/api/social/posts', requireFrontendAccess, social_posts_1.default);
app.use('/api/social/users', requireFrontendAccess, social_users_1.default);
app.use('/api/social/badges', requireFrontendAccess, social_badges_1.default);
app.use('/api/social/moderation', requireFrontendAccess, social_moderation_1.default);
app.use('/api/social/ads', requireFrontendAccess, social_ads_1.default);
app.use('/api/social/gamification', requireFrontendAccess, social_gamification_1.default);
app.use('/api/social/referrals', requireFrontendAccess, social_referrals_1.default);
app.use('/api', requireFrontendAccess, support_1.default);
app.use('/api/addresses', requireFrontendAccess, addresses_1.default);
app.use('/api/pi', pi_1.default);
app.use('/api/admin', admin_1.default);
app.use('/api/admin', admin_otp_1.default);
app.use('/api/auth', auth_1.default);
app.use('/api/core-team-contact', core_team_1.default);
app.use('/api/upload', upload_1.default);
app.use('/api/oracle', oracle_1.default);
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        metrics: (0, metrics_1.getMetricsSnapshot)(),
        piConfig: {
            env: pi_config_1.serverPiConfig.PI_ENV,
            hasApiKey: !!process.env.PI_NETWORK_API_KEY
        }
    });
});
app.get('/', (req, res) => {
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
app.get('/cors-test', (req, res) => {
    res.json({
        message: 'CORS test successful',
        origin: req.headers.origin,
        timestamp: new Date().toISOString()
    });
});
app.use((err, _req, res, _next) => {
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
async function startServer() {
    try {
        await (0, mongodb_1.default)();
        console.log('✅ MongoDB connection established');
        await (0, ensureIndexes_1.ensureHotIndexes)().catch((e) => console.warn('ensureHotIndexes:', e));
        (0, snapshotScheduler_1.startSnapshotScheduler)();
        (0, pct_streamer_1.startPctStreamer)();
        (0, community_follower_snapshotter_1.startCommunityFollowerSnapshotter)();
        app.listen(PORT, () => {
            console.log(`🚀 Zyrachain Pi Server running on port ${PORT}`);
            console.log(`📍 Health check: http://localhost:${PORT}/health`);
            console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🌍 CORS enabled for frontend: http://localhost:8000`);
        });
        if (process.env.PCT_STREAM_ENABLED === 'true') {
            (0, pct_streamer_1.startPctStreamer)();
            console.log('📡 PCT stream mode enabled; balance refresh runs every 5 min');
        }
        if (process.env.PCT_SCAN_ENABLED === 'true') {
            const expr = process.env.PCT_SCAN_CRON || '*/5 * * * *';
            node_cron_1.default.schedule(expr, () => {
                console.log('[pct-scan] cron tick');
                (0, pct_balance_scanner_1.runPctBalanceScan)().catch((e) => console.error('[pct-scan] cron error', e));
            });
            console.log(`📅 PCT balance scan scheduled: ${expr}`);
        }
        const ORACLE_URL = process.env.ORACLE_BASE_URL || 'https://oracle.suban.org';
        const priceCronExpr = process.env.PRICE_HISTORY_CRON || '*/5 * * * *';
        node_cron_1.default.schedule(priceCronExpr, async () => {
            try {
                const res = await fetch(`${ORACLE_URL}/api/v1/price`);
                if (res.ok) {
                    const data = await res.json();
                    await (0, priceHistory_1.recordPrice)(data.price_usd, 'zyrachain-oracle');
                    await (0, priceHistory_1.trimOldPrices)();
                }
            }
            catch (e) {
                console.error('[price-history] record error', e);
            }
        });
        console.log(`📅 Price history recording scheduled: ${priceCronExpr}`);
        const socialTrendingCron = process.env.SOCIAL_TRENDING_CRON || '*/5 * * * *';
        node_cron_1.default.schedule(socialTrendingCron, () => {
            (0, trending_scorer_1.runTrendingScorer)().catch((e) => console.error('[social-trending] cron error', e));
        });
        console.log(`📅 Social trending scorer scheduled: ${socialTrendingCron}`);
        const socialModerationCron = process.env.SOCIAL_MODERATION_CRON || '*/15 * * * *';
        node_cron_1.default.schedule(socialModerationCron, () => {
            (0, moderation_resolver_1.runModerationResolver)().catch((e) => console.error('[social-moderation] cron error', e));
        });
        console.log(`📅 Social moderation resolver scheduled: ${socialModerationCron}`);
        node_cron_1.default.schedule('5 0 * * *', async () => {
            try {
                const Post = require('./zyrachain-lib/lib/models/Post').default;
                const result = await Post.updateMany({ is_boosted: true, boost_expires_at: { $lte: new Date() } }, { $set: { is_boosted: false } });
                console.log(`[social-boost] Expired ${result.modifiedCount} boosted posts`);
            }
            catch (e) {
                console.error('[social-boost] cron error', e);
            }
        });
        console.log('📅 Social boost expiry scheduled: daily at 00:05');
        (0, badge_evaluator_1.seedDefaultBadges)().catch((e) => console.warn('[social-badges] seed error:', e));
    }
    catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    process.exit(0);
});
process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    process.exit(0);
});
startServer();
//# sourceMappingURL=index.js.map