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

### Key Files

- `context/SocialContext.tsx` — global social state (balance, XP, feed, actions)
- `lib/social-api-client.ts` — typed client for `/api/social/*`
- `lib/pi-ads-service.ts` — Pi Browser SDK ads (interstitial / rewarded + verification)
- `components/social/*` — PostCard, PostComposer, AdCard/AdPlayer, TipModal, BoostModal, MissionsPanel, XPBar, TokenBalance, etc.

### Interaction Model (ZP tokens)

- Creating posts and comments is **free**.
- Like / dislike cost **0.1 ZP**, reshare **0.5 ZP**.
- Tips (min **1 ZP**) and boosts (min **10 ZP**) send ~80% to the creator; 20% platform fee.
- Watch ads to earn ZP (custom campaigns + Pi rewarded ads = **5 ZP** each).

## Architecture Notes

- **External API clients** live in `/api/` (horizon, okx, piscan, socialchain).
- **Internal Next.js API routes** live in `/app/api/` and are consumed via `lib/api-client.ts`.
- **Shared API types** are in `types/types.md` (see `lib/README.md` for the API-structure guide).

See **`CHANGELOG.md`** for recent changes.
