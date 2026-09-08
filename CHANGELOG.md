# Changelog

All notable changes to the ZyraChain frontend (Next.js app) are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.0] - 2026-09-08

### Added

- **Pi Sign-In (OAuth 2.0)**
  - New `/signin/callback` route for OAuth token handling.
  - `PiSignInButton` component — "Sign in with Pi" button (primary/secondary/outline variants).
  - `lib/pi-signin.ts` — OAuth URL builder, state management (CSRF), callback parsing, `/v2/me` fetch.
  - Works in any browser (Chrome, Safari, Firefox) — not just Pi Browser.
  - Client ID configured via `NEXT_PUBLIC_PI_SIGNIN_CLIENT_ID`.
  - Added to `MobilePiWelcome` modal, `navbar` mobile menu, and social pages.

- **Pi Ads in Social Feed**
  - Interstitial ads between posts (every 5th, 2 ZP reward).
  - Rewarded ads between posts (every 3rd, 5 ZP with Pi Platform API verification).
  - Rewarded ads after comments (every 5th comment).
  - Banner ad in social layout (developer revenue, no user reward).
  - `AdCooldownContext` — frequency limits (3min cooldown, 10/day max).
  - `usePiAds` hook — wraps Pi SDK ad methods with React state.
  - `InterstitialAd`, `RewardedAdCard`, `BannerAd` components.

- **New Pi Capabilities**
  - `lib/pi-local-storage.ts` — Pi localStorage wrapper with fallback to window.localStorage.
  - `lib/pi-staking.ts` — Staking data fetch + tier display (Diamond/Gold/Silver/Bronze).
  - `lib/pi-share.ts` — File sharing wrapper (Pi.shareFile → Web Share API → clipboard fallback).
  - `GET /api/pi/staking` backend route + frontend proxy.
  - `PI_SIGNIN_CLIENT_ID` env vars for testnet and mainnet.

### Changed

- Feed view now interleaves ads between posts.
- Post detail page shows rewarded ad cards after every 5th comment.
- Social layout has persistent bottom banner ad.
- `PiNetworkContext` now exposes `signInWithPi()` method alongside `authenticate()`.
- All env files updated with Pi Sign-In client IDs.

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
