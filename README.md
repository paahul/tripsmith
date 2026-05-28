# tripsmith

A personal travel planner. Fill out a profile of *how* you travel — your stays tier, food style, pace, what changes when you're solo vs with family — then ask it to plan a trip. It returns a checklist tailored to your style: flight options with deep-links to live prices, accommodation picks at your tier, a day-by-day itinerary, and a packing list calibrated to the destination's forecast.

It does **not** book anything. It hands you links you click to confirm.

**Live demo:** *https://tripsmith-paahul.vercel.app/*

---

## The interesting bits

A handful of decisions worth calling out:

**Profile-as-prompt.** Most AI trip planners ask the same flat form for every trip. tripsmith asks once, in detail — stays tier (Budget / Standard / Comfort / Luxury), food style, pace, plus *modes* for how those shift solo vs with family. Every plan request quietly bundles that profile into the Claude prompt, so a generated Tokyo trip for a Comfort-tier solo traveler reads completely differently from the same destination for a Standard-tier family of four.

**A delta picker, not two pickers.** The family/group tier is expressed as a delta from your default ("step down" / "stay the same" / "step up") rather than a second full picker, because that's how people actually think about it ("with kids I'd downshift a notch"). Same data, half the visual weight.

**Structured outputs over free-form text.** Claude returns a typed JSON schema — flights, accommodations, itinerary, budget, packing list — not prose. That's why the trip page can render each piece in its own component, with a real anchor strip, day pills, and a time-rail layout per day. The model is doing the reasoning; the UI is doing the design.

**Refinement as conversation.** After a plan is generated, a sticky bottom bar lets you tweak it in natural language ("make day 3 chiller", "swap dinner to seafood"). Refinement keeps the same trip id and overwrites server-side; an Undo button restores the prior version.

**Editorial design.** The UI deliberately avoids the "AI chatbot in a box" look. Warm cream + terracotta palette, Fraunces serif headings, numbered section chapters, a topographic-line SVG header on the profile page. The intent is that screenshots look like a magazine spread, not a Vercel template.

**Persistent, shareable trip URLs.** Every generated plan gets a short id (`/trip/abc123XY`) backed by Supabase Postgres. Plans live 90 days, work across devices, and can be shared as URLs or emailed.

**Optional auth.** Anonymous planning still works — magic-link sign-in is opt-in and gives you `/trips` history across devices.

**Evals with a stronger judge model.** The plan-generation prompt is regression-tested with an LLM-as-judge harness in [`evals/`](evals/README.md). Production runs on Haiku 4.5; the judge that scores the output is **Sonnet 4.6** — deliberately a stronger model than the generator, so the eval can catch the subtle preference-misses and budget-math drift a same-or-weaker judge would rubber-stamp. 11 generation fixtures (5 dimensions: preference alignment, budget coherence, completeness, destination fit, format compliance) plus 4 refinement fixtures including an *impossible* request, which the model must refuse rather than hallucinate. The current baseline (Overall **4.4 / 5**) and the weak spot it surfaced (budget math reconciliation, **3.7**) are in [evals/README.md](evals/README.md).

---

## Stack

- **Framework**: Next.js 16 (App Router) + React 19 + TypeScript + Tailwind v4
- **AI**: Anthropic Claude Haiku 4.5 (`@anthropic-ai/sdk` 0.98) — structured JSON output, prompt caching on the system prompt
- **Evals**: tsx-driven LLM-as-judge harness ([`evals/`](evals/README.md)) — Sonnet 4.6 as the judge scoring Haiku output across 11 generation + 4 refinement fixtures
- **DB + Auth**: Supabase Postgres + Supabase Auth (magic link, via `@supabase/ssr`)
- **Email**: Resend (server-side, optional)
- **Imagery**: Unsplash API (server-fetched, 30-day edge cache) + a curated CDN fallback for offline / no-key dev
- **Weather**: OpenWeather (free tier) — drives the packing list
- **Deploy**: Vercel

---

## How it works

```
┌─────────────┐   profile + request    ┌─────────────────┐
│   /plan     │ ─────────────────────▶ │ /api/plan-trip  │
└─────────────┘                        └────────┬────────┘
                                                │
                  ┌─────────────────────────────┼──────────────────────┐
                  ▼                             ▼                      ▼
            getWeather()                   Claude API              Unsplash API
            (OpenWeather)              (Haiku 4.5, JSON)         (hero image)
                  │                             │                      │
                  └─────────────────┬───────────┘                      │
                                    ▼                                  │
                            generated TripPlan ◀─────────────────────-─┘
                                    │
                                    ▼
                          ┌──────────────────┐
                          │  Supabase trips  │  ← persistent, shareable
                          │ id, plan, userId │
                          └──────────────────┘
                                    │
                                    ▼
                            redirect to /trip/[id]
```

Refinement (`/api/refine-trip`) feeds the existing plan back to Claude with the user's natural-language tweak and overwrites the same row. Loading a trip (`/api/trip/[id]`) is just a Supabase SELECT — no AI call on each page view.

---

## Local setup

1. Copy the env template and fill in keys:
   ```
   cp .env.local.example .env.local
   ```
2. Get free-tier keys for:
   - **Anthropic** — https://console.anthropic.com (required)
   - **Supabase** — https://supabase.com (required for persistent URLs + auth)
   - **OpenWeather** — https://openweathermap.org/api (required for weather + packing)
   - **Unsplash** — https://unsplash.com/oauth/applications (optional; falls back to a curated photo set)
   - **Resend** — https://resend.com (optional; for the email-this-plan feature)
3. In your Supabase project, run the SQL files under `supabase/migrations/` in order via the SQL editor.
4. In Supabase → Authentication → URL Configuration, set Site URL to `http://localhost:3000` and add `http://localhost:3000/auth/callback` to Redirect URLs.
5. Install + run:
   ```
   npm install
   npm run dev
   ```
6. Open http://localhost:3000

To run the eval suite against your local `.env.local`:

```
npm run eval
```

This runs all 15 fixtures (~13 min, real API cost) and writes a timestamped JSON to `evals/results/`. See [`evals/README.md`](evals/README.md) for the baseline scores and what they catch.

---

## Flow

1. **`/profile`** — one-time editorial form. Numbered chapters, single-open accordion, sticky save bar, completion meter. Saves to `localStorage`.
2. **`/plan`** — destination, dates, travelers, mode (solo / family / couple / friends). Calendar picker with restricted to a 10-day max.
3. **`/trip/[id]`** — the generated checklist. Sticky anchor strip (Summary · Budget · Flights · Stay · Itinerary · Packing), day pills, time-rail day cards, and a sticky refine bar at the bottom.
4. **`/trips`** *(signed-in only)* — history of your past plans.

---

## Cost notes

- Anthropic Haiku 4.5: ~$0.005–0.02 per plan (depends on profile size + trip length, with prompt caching on)
- Supabase free tier: 500 MB DB, 50k MAU — plenty
- Unsplash demo tier: 50 req/hr, edge-cached 30 days — plenty
- OpenWeather free tier: 1,000 calls/day — plenty
- Vercel hobby: free
- Resend free tier: 100 emails/day

Total recurring cost for a personal-scale deploy: $0/month + a few cents in Anthropic credits per plan.

---

## What I'd build next

- **Streaming plan generation** — replace the 60s spinner with a per-section stream so days appear as they're written.
- **Profile sync** — move the profile from `localStorage` to Supabase so it follows your account across devices.
- **Real flight data** — currently flight prices are estimates Claude generated; integrating Amadeus or a similar API would make the budget summary trustworthy enough to act on.
- **Print/share view** — a clean read-only export of a trip, optimized for PDF or sharing.

---

## Why I built this

Mostly to learn — full-stack Next.js + AI in 2026 in one project. Tripsmith is the application surface; the interesting parts for me were structured-output prompt design with Claude, migrating storage from Vercel KV to Supabase mid-project, and pushing on the editorial UX as a deliberate contrast to typical "chatbot in a box" AI tools.
