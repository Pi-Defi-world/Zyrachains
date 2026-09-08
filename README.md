# ZyraChain — Frontend

Next.js 16 web app for the Zyrachain Pi Network ecosystem hub. Includes blockchain explorer/monitors, ecosystem listings, admin-facing dashboards, and the **Zyra Social** platform.

## Tech Stack

- **Framework**: Next.js 16 (App Router) + React 19 + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **Charts**: Recharts, lightweight-charts, vis-network, react-leaflet
- **i18n**: Custom context-based provider with 5 languages (EN, KO, TR, VN, ZH)
- **Package Manager**: pnpm

## Getting Started

```bash
pnpm install
cp .env.example .env   # fill in API base URLs
pnpm dev               # runs on http://localhost:8000
```

Common scripts:

| Script | Purpose |
|--------|---------|
| `pnpm dev` / `pnpm dev:quiet` | Start dev server (port 8000) |
| `pnpm build` | Production build (`next build --webpack`) |
| `pnpm start` | Serve production build |
| `pnpm lint` | ESLint |

## Key Areas

- **Blockchain Explorer**: `/block`, `/account/[address]`, `/tx/[hash]`
- **Monitors**: `/cex-wallet-monitor`, `/pct-wallet-monitor`, `/realtime-transactions`
- **Ecosystem**: `/directory`, `/ecosystem/*`, `/community-listing`, `/influencer-listing`, `/business-listing`
- **Oracle API**: `/api-dashboard` (key management + top-up), `/api-documentation`
- **Zyra Social**: `/social/*` — feed, posts, profiles, tokens, badges, leaderboard, moderation, ads

## Authentication

Two authentication methods are supported:

### Pi SDK Auth (Pi Browser only)
- Uses `Pi.authenticate()` via Pi Browser SDK
- Required for payments and full functionality
- Triggered via "Connect Pi Wallet" button

### Pi Sign-In (Any browser)
- OAuth 2.0 implicit flow via `accounts.pinet.com`
- Works in Chrome, Safari, Firefox — not just Pi Browser
- Triggered via "Sign in with Pi" button
- Callback route: `/signin/callback`
- Client ID configured via `NEXT_PUBLIC_PI_SIGNIN_CLIENT_ID`

## Zyra Social

The social platform is a full engagement layer backed by the `Zyrachain-server` API.

### Pages

| Route | Description |
|-------|-------------|
| `/social` | Hub with trending posts, quick stats, composer |
| `/social/feed` | Infinite-scroll feed (`New` / `Trending` / `Following` tabs) |
| `/social/post/[id]` | Post detail, comments, related posts |
| `/social/profile/[uid]` | User profile, follow, badges, activity |
| `/social/tokens` | ZP wallet + transaction history |
| `/social/badges` | Badge catalog / earned badges |
| `/social/leaderboard` | Weekly XP leaderboard |
| `/social/moderation` | Community moderation queue + voting |
| `/social/ads` | Earn ZP via custom ads or Pi rewarded ads |

### Pi Ads Integration

All three Pi ad types are integrated into the social feed:

| Ad Type | Placement | Reward | Verification |
|---------|-----------|--------|-------------|
| **Interstitial** | Between posts (every 5th) | 2 ZP | Time-based |
| **Rewarded** | Between posts (every 3rd) + after comments (every 5th) | 5 ZP | Pi Platform API |
| **Banner** | Bottom of social layout | None (dev revenue) | N/A |
| **Custom** | `/social/ads` page | 0.5 ZP (varies) | Backend tracked |

Cooldowns: 3 minutes between rewarded ads, 10/day max.

### Key Files

- `context/SocialContext.tsx` — global social state (balance, XP, feed, actions)
- `lib/social-api-client.ts` — typed client for `/api/social/*`
- `lib/pi-ads-service.ts` — Pi Browser SDK ads (interstitial / rewarded + verification)
- `lib/pi-signin.ts` — OAuth sign-in flow (URL builder, state, callback parsing)
- `lib/pi-local-storage.ts` — Pi localStorage wrapper with fallback
- `lib/pi-staking.ts` — Staking data fetch + tier display
- `lib/pi-share.ts` — File sharing wrapper (Pi.shareFile + Web Share API)
- `components/social/ads/*` — AdCooldownContext, InterstitialAd, RewardedAdCard, BannerAd, usePiAds
- `components/social/*` — PostCard, PostComposer, AdCard/AdPlayer, TipModal, BoostModal, MissionsPanel, XPBar, TokenBalance, PiSignInButton, etc.

### Interaction Model (ZP tokens)

- Creating posts and comments is **free**.
- Like / dislike cost **0.1 ZP**, reshare **0.5 ZP**.
- Tips (min **1 ZP**) and boosts (min **10 ZP**) send ~80% to the creator; 20% platform fee.
- Watch ads to earn ZP:
  - Interstitial ads: **2 ZP** per view
  - Rewarded ads: **5 ZP** per view (Pi verified)
  - Custom campaigns: **0.5 ZP** per view

## New Pi Capabilities

| Capability | Status | Description |
|-----------|--------|-------------|
| Pi Sign-In | Active | OAuth 2.0 login from any browser |
| Local Storage | Whitelist required | Store preferences on device via Pi Browser |
| Staking Data API | Whitelist required | Display user's effective stake for Zyrachain |
| Pi.shareFile | Whitelist required | Native file/video sharing from the app |

## Environment Variables

See `.env.example` for full list. Key variables:

```
NEXT_PUBLIC_PI_SIGNIN_CLIENT_ID=    # Pi Sign-In OAuth client ID
NEXT_PUBLIC_PI_SANDBOX=             # true for testnet
NEXT_PUBLIC_SERVER_URL=             # Backend API URL
NEXT_PUBLIC_TESTNET_HORIZON_URL=    # Testnet Horizon endpoint
```

## Architecture Notes

- **External API clients** live in `/api/` (horizon, okx, piscan, socialchain).
- **Internal Next.js API routes** live in `/app/api/` and are consumed via `lib/api-client.ts`.
- **Shared API types** are in `types/types.md` (see `lib/README.md` for the API-structure guide).

See **`CHANGELOG.md`** for recent changes.
