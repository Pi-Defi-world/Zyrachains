FROM node:20-alpine AS deps
RUN corepack enable && corepack prepare pnpm@10 --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM node:20-alpine AS builder
RUN corepack enable && corepack prepare pnpm@10 --activate
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Override via --build-arg; default to production backend so the image works standalone
ARG NEXT_PUBLIC_API_URL=https://zyrachain-server.onrender.com
ARG NEXT_PUBLIC_HORIZON_URL=https://horizon.suban.org/horizon
ARG NEXT_PUBLIC_ORACLE_URL=https://api.zyrachain.org
ARG NEXT_PUBLIC_BASE_URL=https://testnet.zyrachain.org
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_HORIZON_URL=$NEXT_PUBLIC_HORIZON_URL
ENV NEXT_PUBLIC_ORACLE_URL=$NEXT_PUBLIC_ORACLE_URL
ENV NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL
ENV NEXT_TELEMETRY_DISABLED=1

RUN pnpm build

FROM node:20-alpine AS runner
RUN corepack enable && corepack prepare pnpm@10 --activate
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Backend URL for runtime
ARG NEXT_PUBLIC_API_URL=https://zyrachain-server.onrender.com
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/next.config.ts ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next

RUN pnpm install --prod --frozen-lockfile

EXPOSE 8000
CMD ["pnpm", "start"]