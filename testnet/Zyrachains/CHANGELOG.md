# Changelog

All notable changes to the ZyraChain frontend (Next.js app) are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2026-08-12

### Added

- **Zyra Social — full social platform UI**
  - New `/social` hub with trending preview, quick stats, and inline composer.
  - `/social/feed` with `New` / `Trending` / `Following` tabs and infinite scroll.
  - `/social/post/[id]` post detail with comments, actions, and related posts.
  - `/social/profile/[uid]` user profiles with follow/unfollow, followers/following lists, badges, and activity.
  - `/social/tokens` wallet dashboard (balance breakdown: earned / purchased / ad / spent) and transaction history.
  - `/social/badges` badge catalog and earned-badges gallery.
  - `/social/leaderboard` weekly XP leaderboard.
  - `/social/moderation` community moderation queue, moderator staking, and voting.
  - `/social/ads` ad hub with daily-limit stats, custom ad cards/player, and Pi rewarded-ads.
  - Homepage `Social` tab (`HomeSocialSection`), navbar links, and mobile bottom-nav entry.
  - `SocialProvider` context (`context/SocialContext.tsx`) and `socialAPI` client (`lib/social-api-client.ts`) wiring all social endpoints.
  - Posting is **free** (no token cost to create posts/comments); likes, tips, reshares, and boosts use ZP.

- **Ads**
  - Pi SDK Ads integration (`lib/pi-ads-service.ts`): interstitial + rewarded ads via the Pi Browser, with server-side verification of rewarded ads (+5 ZP).
  - In-app `AdCard` / `AdPlayer` for custom ad campaigns with ZP rewards.

- **i18n**
  - Full social UI translated across all 5 languages (EN, KO, TR, VN, ZH) — `context/en.ts`, `context/ko.ts`, `context/tr.ts`, `context/vn.ts`, `context/zh.ts`.
  - Turkish (TR) added to the `Language` type and language predicates.
  - Missing sections synced across languages (CEX monitor, docs, terms, privacy, report).
  - Default language set to English; monitor pages fully translated (removed hardcoded strings).

### Changed

- **Mobile-first social UI**: responsive layout with a persistent social sidebar on desktop and condensed top bars on mobile.
- **3-second toast popups** for social actions (rewards, tips, boosts, errors) instead of slow auto-dismissing alerts.
- **Confidence score display** fixed in the social UI.
- **Ecology section removed** from the homepage and its nav links (kept `/ecology` page), replacing it with the Social tab.

### Fixed

- All remaining TypeScript errors: `String()` casts for `t()` placeholder props, duplicate key removal, `.replace()` fixes.
- Duplicate `PulseSectionContent` function removed; original body restored after ecology cleanup.
- `Coin` → `Coins` icon (not available in lucide-react v0.263).
- Layout overflow on monitor pages.
- Turkish apostrophe escaping in `tr.ts` that broke builds.

[Unreleased]: https://github.com/Zyrachain/ZyraChain/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/Zyrachain/ZyraChain/releases/tag/v0.1.0
