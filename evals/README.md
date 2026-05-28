# Tripsmith evals

An LLM-as-judge harness that measures the quality of generated trip plans against a fixed set of fixtures. Run with:

```
npm run eval
```

## What it measures

**Generation** (11 fixtures) — each fixture is a `(profile, request)` pair. Tripsmith generates a plan; a stronger model scores the output 1–5 on five dimensions:

| Dimension | What it catches |
|---|---|
| `preference_alignment` | Tier, pace, dietary, freeform notes, `avoid` rules respected |
| `budget_coherence` | `pricePerNight × nights` reconciles with `budgetSummary`; consistent currency |
| `completeness` | All schema fields filled; 3 flight options; one day per date |
| `destination_fit` | Activities and restaurants plausible for the city |
| `format_compliance` | No markdown in strings, ≤3 activities/day, ≤4 packing categories |

**Refinement** (4 fixtures) — generates a base plan, applies a tweak ("downgrade hotel", "make day 2 relaxed", an impossible request, a vague request), and scores on:

| Dimension | What it catches |
|---|---|
| `change_applied` | The requested change shows up — *or* the model correctly refuses (impossible requests should produce an explanatory note in `budgetSummary.notes`, not a hallucinated "fix") |
| `unchanged_preserved` | Untouched fields stay intact; vague tweaks scope to the implied day, not a rewrite |

## Model choices

- **Generator**: Claude Haiku 4.5 — the model that ships in production. Picked for cost + Vercel's 60s function timeout.
- **Judge**: Claude Sonnet 4.6 — deliberately a stronger model than the generator. A judge weaker than what it's evaluating can't surface the nuanced failures the eval is supposed to catch (subtle preference misses, currency mixing, off-by-one math on accommodation totals).

## Baseline (2026-05-28)

### Generation

| Test case | Pref | Budget | Compl | Dest | Fmt | **Overall** |
|---|---|---|---|---|---|---|
| Budget solo / Tokyo 3 days | 4 | 3 | 4 | 5 | 4 | 4.0 |
| Luxury couple / Paris 5 days | 4 | 3 | 4 | 5 | 4 | 4.0 |
| Standard family / Bali 7 days (vegetarian) | 4 | 3 | 5 | 5 | 4 | 4.2 |
| Comfort group of friends / NYC 4 days | 4 | 4 | 4 | 5 | 4 | 4.2 |
| Budget solo / Barcelona 5 days (slow pace) | 5 | 4 | 5 | 5 | 4 | 4.6 |
| Comfort family / Costa Rica 6 days | 5 | 4 | 4 | 5 | 5 | 4.6 |
| Regional override: budget global but comfort Europe | 5 | 4 | 5 | 5 | 5 | 4.8 |
| Heavy freeform notes / NYC 4 days | 5 | 4 | 4 | 5 | 4 | 4.4 |
| Edge case: 1-day trip | 4 | 4 | 4 | 5 | 5 | 4.4 |
| Obscure home airport / Bozeman to Tokyo | 5 | 4 | 4 | 4 | 5 | 4.4 |
| Conflicting prefs: budget tier but wants luxury | 4 | 4 | 5 | 5 | 4 | 4.4 |
| **Average** | **4.5** | **3.7** | **4.4** | **4.9** | **4.4** | **4.4** |

### Refinement

| Test case | Change applied | Unchanged preserved | **Overall** |
|---|---|---|---|
| Refine: downgrade hotel only | 5 | 5 | 5.0 |
| Refine: make one day more relaxed | 5 | 5 | 5.0 |
| Refine: impossible request (add an extra day) | 5 | 5 | 5.0 |
| Refine: vague instruction | 5 | 5 | 5.0 |
| **Average** | **5.0** | **5.0** | **5.0** |

## What the baseline tells us

**Strengths**

- Destination fit (4.9) — Haiku rarely hallucinates landmarks or recommends implausible neighborhoods.
- Refinement (5.0 across the board) — the model correctly *refused* the impossible request rather than fabricating a 4th day, and correctly scoped vague instructions ("make day 2 more fun") to just day 2.

**The clear weak spot: budget coherence (3.7)**

Almost every low score in this column was the same shape of failure — the per-night × nights math doesn't reconcile with the budget summary string:

- Bali: plan says `~$80–100/night × 6 nights ≈ $480–600`, but `budgetSummary.accommodation` says `~$1,200–1,800`.
- Tokyo solo: `2 nights × $50–70` claimed in the summary as `~$150–225`.
- Paris: ambiguity whether the flights figure is per-person or for both travelers.
- Currency mixing — several plans alternate between `$` and `€` in different fields of the same plan.

This is a tight, prompt-addressable issue, not a model-capability ceiling. The next change is to require the generator to compute totals explicitly and pin a single currency per plan.

**Other recurring nits (cheap prompt tweaks)**

- `pace: "packed"` occasionally produces 2 activities/day instead of the spec'd 3.
- The profile `avoid` list leaks in once every few generations — Paris plan suggested L'As du Fallafel despite "avoid fast food"; Marrakech plan included a roadside tagine despite "avoid casual/cheap food"; NYC friends plan name-dropped Times Square despite "avoid tourist traps".

## Fixture design

Fixtures intentionally include **gap-coverage cases** to surface failure modes a happy-path eval would miss:

- **Regional override** — profile sets global tier to budget but adds "I bump up to comfort in Western Europe" in `stays.regionalAdjustments`. Tests whether the model honors the override over the global setting.
- **Heavy freeform notes** — a jazz-musician profile with very specific asks ("Village Vanguard / Smalls / Mezzrow level", "skip Times Square / Statue of Liberty / Empire State"). Tests whether `profile.freeform` actually steers the plan or gets ignored.
- **One-day trip** — minimum trip length, tests whether the schema still gets fully populated.
- **Obscure home airport** — BZN → NRT. Tests for plausible routing rather than hallucinated direct flights.
- **Conflicting prefs** — profile sets tier to budget but freeform says "honestly if there's an Aman or a Rosewood I'll splurge". Tests the model's judgment when signals disagree.
- **Impossible refinement** — user asks to add a 4th day to a 3-day trip. Correct behavior is to refuse with a note, not hallucinate.
- **Vague refinement** — "make day 2 more fun". Tests whether the refinement scopes to day 2 or rewrites the whole plan.

## How to add a fixture

Add to `GENERATION_FIXTURES` or `REFINEMENT_FIXTURES` in `evals/fixtures.ts` — typed by `Fixture` or `RefinementFixture`, both of which import the production `Profile` and `TripRequest` types so a fixture cannot drift from the schema. Re-run `npm run eval`.

## Results format

Each run writes a timestamped JSON to `evals/results/{timestamp}.json` with full per-dimension scores and judge reasoning strings. The directory is gitignored — only the markdown baseline in this file is checked in.
