# Changelog

All notable changes to the Zyrachain server are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2026-08-12

### Added

- **Zyra Social backend — social engagement platform** (`routes/social-*.ts`, `services/`, `zyrachain-lib/lib/models/`)
  - **Posts** (`/api/social/posts`): create, delete (soft-remove), comment, like/dislike, tip, reshare, boost, report, search, and feeds (`new` / `trending` / `following`) with pagination and trending scores.
  - **Users** (`/api/social/users`): profiles with stats, follow/unfollow, followers/following lists, activity feed, and search.
  - **Tokens** (`/api/social/tokens`): ZP ledger with balance, transaction history, and Pi → ZP purchases (`100 ZP per Pi`, platform fee 20%).
  - **Badges** (`/api/social/badges`): badge catalog (seeded automatically), earned badges, and paid-badge purchases.
  - **Moderation** (`/api/social/moderation`): flagged-post queue, moderator staking (50 ZP), vote casting (5 ZP, 1 ZP abstain), and per-user stats.
  - **Ads** (`/api/social/ads`): ad campaign listing (daily limit 10, priority/reward sorted), ad watch with ZP crediting, reward status, and **Pi rewarded-ad verification** (`POST /verify`) that credits 5 ZP when the Pi mediator acknowledges a granted reward.
  - **Gamification** (`/api/social/gamification`): XP/levels, daily missions with claiming, weekly leaderboard, and daily streaks.
  - Token ledger services (`services/token-ledger.ts`) with `creditZP`, `debitZP`, `transferZP`, platform fees, and reward logging.
  - Trending scorer, badge evaluator, mission generator, gamification service, and moderation resolver services.
  - 17 new Mongoose models under `zyrachain-lib/lib/models/` (Post, AdCampaign, AdView, Badge, ModerationVote, SocialBoost, SocialToken, TokenTransaction, UserAction, UserActivity, UserBadge, UserFollow, UserGameStats, UserMission, RewardLog, and more).
  - Scheduled jobs: trending recomputation (every 5 min), moderation resolution (every 15 min), daily boost expiry, and badge seeding on startup.

- **Admin dashboard** — comprehensive admin API and client
  - Universal CRUD admin API (`/api/admin-api/{entity}`) with pagination, filtering, bulk operations, and activity logging across users, posts, listings, revenue, ad inquiries, newsletters, and more.
  - Dashboard analytics, system health, and activity-log endpoints.
  - OTP-based admin authentication with role-based access (`super_admin` / `admin` / `moderator`) and email whitelisting.
  - TypeScript admin API client (`lib/admin-api-client.ts`). See `ADMIN_API_GUIDE.md` and `ADMIN_API_SUMMARY.md`.

### Changed

- **Posting is free**: post/comment creation no longer charges ZP (token cost set to 0); like (0.1 ZP), dislike (0.1 ZP), reshare (0.5 ZP), tip (min 1 ZP), and boost (min 10 ZP, 48h) still apply.
- **Confidence score display** fixed in social post responses.
- **Ecology section removed** from the home/composer flows.
- Pi payment completion extended to support `oracle_api`, `topup_credits`, and `social_tokens` purchases in addition to listings.

### Fixed

- Added missing `return` statements to route handlers and fixed TypeScript type issues across social routes.
- Typed Pi API responses as `any` to satisfy TypeScript for the rewarded-ad endpoint.

[Unreleased]: https://github.com/Zyrachain/Zyrachain-server/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/Zyrachain/Zyrachain-server/releases/tag/v1.0.0
