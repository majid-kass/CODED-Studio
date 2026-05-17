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

## Routes

| Path | Purpose |
|---|---|
| `/` | Public submission form |
| `/queue` | Admin review queue *(auth coming next)* |
| `/api/submit` | POST submission → Claude copy + screenshot + color sampling |
| `/api/screenshot` | Same-origin screenshot proxy (Microlink under the hood) |
| `/api/render/[id]` | Server-side PNG render (1080×1920) |
| `/api/render-video/[id]` | Server-side Reel render (30s MP4) |

## PRD-aligned roadmap

- [x] Public submission form
- [x] Claude EN/AR marketing copy
- [x] Microlink full-page screenshot + caching
- [x] Per-project background color sampling
- [x] 1080×1920 PNG render
- [x] 30-second Remotion Reel render
- [ ] Admin auth (sign in / sign out)
- [ ] Multi-slide carousel render (4–6 slides)
- [ ] Bilingual UI on the submission form

## Team
- **Majid** — Showcase (this repo)
- **Fatma** — Content Creator
- **Ola** — Design System Platform

Three independent scopes that converge into CODED Studio post-capstone.
