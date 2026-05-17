# Showcase — CODED Studio

> A capstone slice of **CODED Studio**. Turns each alumni project URL into a ready-to-post Instagram package (single image, multi-slide carousel, 30s Reel) — no manual design or copywriting.

## Stack
- **Next.js 16** (App Router, Turbopack) + **Tailwind**
- **Claude API** (`@anthropic-ai/sdk`) — segment-aware marketing copy, EN/AR auto-detect
- **Microlink** — full-page screenshot capture
- **sharp** — dominant-color sampling for per-project background palette
- **Next.js `ImageResponse` / Satori** — 1080×1920 PNG render
- **Remotion** — 30-second Reel render with cinematic scroll + tap-ripple animation

## Quick start

```bash
npm install
cp .env.example .env.local   # then fill in ANTHROPIC_API_KEY
npm run dev
```

Open [http://localhost:3030](http://localhost:3030).

## Environment

| Variable | Required | Purpose |
|---|---|---|
| `ANTHROPIC_API_KEY` | yes | Claude marketing-copy generation |
| `NEXT_PUBLIC_SUPABASE_URL` | yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | Supabase anon (publishable) key |

## Routes

| Path | Purpose |
|---|---|
| `/` | Public submission form |
| `/queue` | Admin review queue *(auth coming next)* |
| `/api/submit` | POST submission → Claude copy + screenshot + color sampling |
| `/api/screenshot` | Same-origin screenshot proxy (Microlink under the hood) |
| `/api/render/[id]` | Server-side PNG render (1080×1920) |
| `/api/render-carousel/[id]` | 5-slide carousel rendered as a ZIP of 1080×1350 PNGs |
| `/api/render-video/[id]` | Server-side Reel render (30s MP4) |
| `/sign-in`, `/sign-up` | Clerk-hosted auth pages |

## PRD-aligned roadmap

- [x] Public submission form
- [x] Claude EN/AR marketing copy
- [x] Microlink full-page screenshot + caching
- [x] Per-project background color sampling
- [x] 1080×1920 PNG render
- [x] 30-second Remotion Reel render
- [x] Admin auth via Supabase (sign in / sign up / sign out)
- [x] Multi-slide carousel render (5 slides → ZIP)
- [ ] Bilingual UI on the submission form

## Team
- **Majid** — Showcase (this repo)
- **Fatma** — Content Creator
- **Ola** — Design System Platform

Three independent scopes that converge into CODED Studio post-capstone.
