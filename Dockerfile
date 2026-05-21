# Multi-stage build so the final image stays slim. Stage 1 compiles, stage 2
# runs. Chromium and the system libs Playwright needs ship in the runtime
# stage; node_modules are copied across.

# ── Build ────────────────────────────────────────────────────────────────
FROM node:20-bookworm-slim AS builder

# Next.js inlines NEXT_PUBLIC_* env vars into the client bundle at build time
# (`next build`). They must be present as real env vars during that step or
# the browser bundle ships with empty strings and supabaseBrowser() throws on
# init. Railway (and any other Docker host) needs to receive them as build
# args; declaring ARG + re-exposing as ENV is the canonical pattern.
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY

WORKDIR /app

# Install build-time deps (Playwright chromium dependencies are needed both
# at build and runtime; install once here and copy what we need).
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    chromium \
    fonts-liberation \
    fonts-noto-color-emoji \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcairo2 \
    libcups2 \
    libdrm2 \
    libgbm1 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libxcomposite1 \
    libxdamage1 \
    libxkbcommon0 \
    libxrandr2 \
    libxss1 \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

# Download Playwright's matching chromium build into /ms-playwright.
RUN npx playwright install chromium

COPY . .
RUN npm run build

# ── Runtime ──────────────────────────────────────────────────────────────
FROM node:20-bookworm-slim

WORKDIR /app

# Same chromium deps in the runtime stage. Without these, the binary copied
# from /ms-playwright fails to link at startup.
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    chromium \
    fonts-liberation \
    fonts-noto-color-emoji \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcairo2 \
    libcups2 \
    libdrm2 \
    libgbm1 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libxcomposite1 \
    libxdamage1 \
    libxkbcommon0 \
    libxrandr2 \
    libxss1 \
    && rm -rf /var/lib/apt/lists/*

ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
ENV NODE_ENV=production
ENV PORT=3000

# Copy everything we built. node_modules + .next + public + remotion source +
# the playwright browser cache.
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/remotion ./remotion
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/tailwind.config.ts ./tailwind.config.ts
COPY --from=builder /app/postcss.config.mjs ./postcss.config.mjs
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /ms-playwright /ms-playwright

EXPOSE 3000
CMD ["npm", "run", "start"]
