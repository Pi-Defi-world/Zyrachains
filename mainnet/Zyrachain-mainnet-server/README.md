# Zyrachain Server

A standalone Express.js server for the Infogram Pi Network ecosystem hub, providing backend APIs for blockchain data, user management, and ecosystem services.

## 🚀 Features

- **Blockchain Integration**: Pi Network API integration for transaction and account data
- **User Management**: Authentication, authorization, and user profile management
- **Ecosystem Services**: Business listings, community management, influencer directory
- **Blog System**: Content management for educational articles and updates
- **Admin Dashboard**: Comprehensive admin interface for content and user management
- **Zyra Social**: Posts, feeds, tips, boosts, follow system, badges, community moderation, gamification, and XP/levels
- **Ads**: Custom ad campaigns with ZP rewards + Pi SDK rewarded-ads verification
- **Token Ledger**: ZP in-app token system (earn / purchase / spend) with full transaction history
- **Payment Integration**: Pi Network payment processing
- **File Upload**: Image and document upload capabilities
- **Email Services**: Automated email notifications and newsletters

## 🛠️ Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT tokens with bcrypt password hashing
- **File Upload**: Multer for handling multipart/form-data
- **Email**: Nodemailer for email services
- **Blockchain**: Stellar SDK for Pi Network integration
- **Package Manager**: pnpm

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/pi-clubhouse-server.git
   cd pi-clubhouse-server
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your configuration. See **`.env.example`** for all keys (including optional social metrics).

   Minimal example:
   ```env
   SERVER_PORT=4000
   MONGODB_URI=mongodb://localhost:27017/Zyrachain
   JWT_SECRET=your_jwt_secret
   PI_NETWORK_API_KEY=your_pi_network_api_key
   ```

4. **Build the project**
   ```bash
   pnpm build
   ```

5. **Start the server**
   ```bash
   # Development
   pnpm dev
   
   # Production
   pnpm start
   ```

## 🏗️ Project Structure

```
server/
├── config/           # Configuration files
├── lib/             # Core libraries and models
│   ├── models/      # MongoDB schemas
│   └── mongodb.ts   # Database connection
├── middleware/      # Express middleware
├── routes/          # API route handlers (incl. /api/social/*)
├── services/        # Business logic (token ledger, gamification, badges, moderation)
├── scripts/         # Utility scripts
├── types/           # TypeScript type definitions
├── utils/           # Utility functions
├── workers/         # Background schedulers
├── zyrachain-lib/   # Shared library (models, pi-network client, mongodb connection)
└── index.ts         # Main server entry point
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/verify` - Email verification

### Pi Network Integration
- `GET /api/pi/user` - Get Pi Network user data
- `POST /api/pi/payments/approve` - Approve Pi payment
- `POST /api/pi/payments/complete` - Complete Pi payment

### Ecosystem & listings
- `GET /api/ecosystem` - Ecosystem data (`?type=communities|influencers|events|...`)
- `GET /api/listings/community` - Approved **paid** community listings (MongoDB)
- `GET /api/listings/influencer` - Approved **paid** influencer listings (MongoDB)
- Optional query on the last two: **`?socialStats=1`** (or `social=1`) merges live **X / Telegram** public metrics (sorted by followers / members when stats load). Uses an in-memory TTL cache; set tokens below.

### Social stats (X + Telegram)
Requires env tokens (see table). Responses are **metrics only** (not full post feeds).

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/social-stats/twitter?handle=` | X user + `public_metrics` |
| GET | `/api/social-stats/telegram?username=` | Telegram `getChat` + member count when available |
| GET | `/api/social-stats/batch?twitter=a,b&telegram=c,d` | Batch (up to 10 each), shares cache with other routes |
| GET | `/api/social-stats/listing/influencer/:id` | Listing row + live X stats from stored `twitter` |
| GET | `/api/social-stats/listing/community/:id` | Listing row + live Telegram stats from stored `telegram` |

**Rate limits:** X and Telegram apply their own quotas; keep `SOCIAL_STATS_CACHE_TTL_MS` high enough for your traffic. For heavy traffic, prefer a scheduled job that writes denormalized counts on each listing document instead of fetching on every list request.

### Blog System
- `GET /api/blog/posts` - Get blog posts
- `POST /api/blog/posts` - Create blog post
- `GET /api/blog/categories` - Get categories
- `GET /api/blog/tags` - Get tags

### Zyra Social — Posts
All social routes require a Pi-authenticated `Bearer` token.

- `GET /api/social/posts?type=new|trending|following` - Feed (paginated)
- `POST /api/social/posts` - Create post (free)
- `GET /api/social/posts/search?q=` - Full-text post search
- `GET /api/social/posts/:id` - Post detail + comment count + user actions
- `DELETE /api/social/posts/:id` - Soft-remove own post
- `POST /api/social/posts/:id/like` / `dislike` - React (0.1 ZP)
- `POST /api/social/posts/:id/tip` - Tip creator (min 1 ZP, 20% fee)
- `POST /api/social/posts/:id/reshare` - Reshare (0.5 ZP)
- `POST /api/social/posts/:id/boost` - Boost post (min 10 ZP, 48h)
- `POST /api/social/posts/:id/report` - Flag post for moderation
- `POST /api/social/posts/:id/comments` / `GET /api/social/posts/:id/comments` - Add/list comments

### Zyra Social — Users
- `GET /api/social/users/search?q=` - Search users
- `GET /api/social/users/:uid/profile` - Profile with stats, badges, balance
- `POST /api/social/users/:uid/follow` / `DELETE /api/social/users/:uid/follow` - Follow / unfollow
- `GET /api/social/users/:uid/followers` / `:uid/following` / `:uid/activity` - Lists (paginated)

### Zyra Social — Tokens (ZP)
- `GET /api/social/tokens/balance` - Balance breakdown (earned / purchased / ad / spent)
- `GET /api/social/tokens/transactions?page=&limit=` - Transaction history
- `POST /api/social/tokens/purchase/complete` - Credit ZP for a Pi payment (`100 ZP per Pi`)
- `GET /api/social/tokens/balance/simple` - Balance only

### Zyra Social — Badges
- `GET /api/social/badges` - Badge catalog (auto-seeds defaults)
- `GET /api/social/badges/:uid/earned` - Badges earned by a user
- `POST /api/social/badges/:badgeId/purchase` - Buy a paid badge (ZP)

### Zyra Social — Moderation
- `GET /api/social/moderation/queue?page=&limit=` - Flagged-post queue
- `POST /api/social/moderation/stake` - Become a moderator (stake 50 ZP)
- `POST /api/social/moderation/vote` - Cast vote (flag / approve / abstain; 5 ZP, 1 ZP abstain)
- `GET /api/social/moderation/stats` - Own vote stats and accuracy

### Zyra Social — Ads
- `GET /api/social/ads` - Available ads (daily limit 10) + remaining + watched
- `POST /api/social/ads/:id/watch` - Watch a custom ad, credit ZP reward
- `GET /api/social/ads/reward-status` - Daily usage + total earned from ads
- `POST /api/social/ads/verify` - Verify a **Pi rewarded ad** (`adId`); credits 5 ZP when granted (requires `PI_NETWORK_API_KEY`)

### Zyra Social — Gamification
- `GET /api/social/gamification/stats` - XP, level, streak, weekly XP, progress
- `GET /api/social/gamification/missions` - Today's missions (auto-generated)
- `POST /api/social/gamification/missions/:key/claim` - Claim mission reward
- `GET /api/social/gamification/leaderboard?page=&limit=` - Weekly leaderboard
- `GET /api/social/gamification/streak` - Current streak info

### Admin
- `POST /api/admin/login` - Admin login
- `GET /api/admin/dashboard` - Admin dashboard data
- `POST /api/admin/otp` - Admin OTP verification

### Admin API (universal CRUD)
- `POST /api/admin/auth` - Request / verify admin OTP
- `GET /api/admin/auth/check` - Auth status
- `GET|POST|PUT|DELETE /api/admin-api/{entity}` - CRUD for any entity (users, posts, listings, revenue, ad inquiries, newsletters, …)
- `POST /api/admin-api/{entity}/bulk` - Bulk operations
- `GET /api/admin-api/dashboard/analytics` - Dashboard analytics
- `GET /api/admin-api/system/health` - System health
- `GET /api/admin-api/activity-logs` - Admin activity logs

See **`ADMIN_API_GUIDE.md`** and **`ADMIN_API_SUMMARY.md`** for full details.

 
### Testing

```bash
# Run all tests
pnpm test

# Test database connection
node test-db-connection.js

# Test admin login
node test-admin-login.js
```

## 🔒 Security

- JWT-based authentication
- Password hashing with bcrypt
- CORS configuration
- Input validation and sanitization
- Rate limiting (recommended to add)
- Environment variable protection

## 📝 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `SERVER_PORT` | HTTP port (default `4000`) | No |
| `MONGODB_URI` | MongoDB connection string | Yes |
| `JWT_SECRET` | JWT signing secret | Yes |
| `PI_NETWORK_API_KEY` | Pi Network API key | For Pi features |
| `SMTP_*` / email vars | Outbound mail | If using email |
| `NODE_ENV` | `development` / `production` | No |
| `TWITTER_BEARER_TOKEN` or `X_BEARER_TOKEN` | X API v2 app-only bearer | For social stats |
| `TELEGRAM_BOT_TOKEN` | Bot token from @BotFather | For Telegram social stats |
| `SOCIAL_STATS_CACHE_TTL_MS` | Cache for social fetches (default `600000`) | No |
| `SOCIAL_TRENDING_CRON` | Trending recalc schedule (default `*/5 * * * *`) | No |
| `SOCIAL_MODERATION_CRON` | Moderation resolution schedule (default `*/15 * * * *`) | No |

See **`.env.example`** for a full template.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in this repository
- Contact the Infogram team
- Check the documentation

## 🔗 Related Projects

- [Pi Clubhouse Frontend](https://github.com/your-username/pi-clubhouse) - Next.js frontend application
- [Pi Network SDK](https://github.com/pi-network/pi-nodejs-sdk) - Official Pi Network SDK 