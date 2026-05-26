"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import type { TripPlan } from "@/lib/types";

type TripPlanWithId = TripPlan & { id?: string };

const CACHE_PREFIX = "tripsmith:trip:";
const PREV_PREFIX = "tripsmith:prev:";

const ANCHORS = [
  { id: "summary", label: "Summary" },
  { id: "budget", label: "Budget" },
  { id: "flights", label: "Flights" },
  { id: "stays", label: "Stay" },
  { id: "itinerary", label: "Itinerary" },
  { id: "packing", label: "Packing" },
];

export default function TripPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [plan, setPlan] = useState<TripPlanWithId | null>(null);
  const [previousPlan, setPreviousPlan] = useState<TripPlanWithId | null>(null);
  const [missing, setMissing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);

  const [tweak, setTweak] = useState("");
  const [refining, setRefining] = useState(false);
  const [refineError, setRefineError] = useState<string | null>(null);
  const [refinedFlash, setRefinedFlash] = useState(false);

  useEffect(() => {
    // Render from sessionStorage cache first for instant paint.
    const cached = sessionStorage.getItem(CACHE_PREFIX + id);
    if (cached) {
      try {
        setPlan(JSON.parse(cached));
        setLoading(false);
      } catch {
        /* fall through to fetch */
      }
    }
    const prev = sessionStorage.getItem(PREV_PREFIX + id);
    if (prev) {
      try {
        setPreviousPlan(JSON.parse(prev));
      } catch {
        /* ignore */
      }
    }
    // Always verify against the server in case the trip was refined elsewhere.
    fetch(`/api/trip/${id}`)
      .then(async (res) => {
        if (res.status === 404) {
          setMissing(true);
          return;
        }
        if (!res.ok) throw new Error(`Failed (${res.status})`);
        const data = (await res.json()) as TripPlan;
        const withId = { ...data, id };
        setPlan(withId);
        sessionStorage.setItem(CACHE_PREFIX + id, JSON.stringify(withId));
      })
      .catch(() => {
        // If we already have a cached plan, keep showing it; otherwise mark missing.
        if (!cached) setMissing(true);
      })
      .finally(() => setLoading(false));
  }, [id]);

  async function handleEmail() {
    if (!plan) return;
    setSending(true);
    setSendError(null);
    try {
      const shareUrl =
        typeof window !== "undefined" ? `${window.location.origin}/trip/${id}` : undefined;
      const res = await fetch("/api/email-trip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, shareUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Failed (${res.status})`);
      setSent(data.sentTo || "Paahul");
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "Failed to send");
    } finally {
      setSending(false);
    }
  }

  const [copied, setCopied] = useState(false);
  function handleCopyLink() {
    if (typeof window === "undefined") return;
    const url = `${window.location.origin}/trip/${id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }

  async function handleRefine(e: React.FormEvent) {
    e.preventDefault();
    if (!plan || !tweak.trim()) return;
    setRefining(true);
    setRefineError(null);
    try {
      const res = await fetch("/api/refine-trip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPlan: plan, tweak: tweak.trim(), id }),
      });
      const data = (await res.json()) as TripPlanWithId & { error?: string };
      if (!res.ok) throw new Error(data.error || `Failed (${res.status})`);
      sessionStorage.setItem(PREV_PREFIX + id, JSON.stringify(plan));
      sessionStorage.setItem(CACHE_PREFIX + id, JSON.stringify(data));
      setPreviousPlan(plan);
      setPlan(data);
      setTweak("");
      setRefinedFlash(true);
      setTimeout(() => setRefinedFlash(false), 2500);
      setSent(null);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setRefineError(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setRefining(false);
    }
  }

  async function handleUndo() {
    if (!previousPlan) return;
    try {
      await fetch(`/api/trip/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(previousPlan),
      });
    } catch {
      /* server save is best-effort; local state still rolls back */
    }
    sessionStorage.setItem(CACHE_PREFIX + id, JSON.stringify(previousPlan));
    sessionStorage.removeItem(PREV_PREFIX + id);
    setPlan(previousPlan);
    setPreviousPlan(null);
    setSent(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (missing) {
    return (
      <main className="flex flex-1 items-center justify-center px-6 py-24">
        <div className="text-center">
          <p className="font-serif text-xl italic text-muted">
            This trip link doesn&rsquo;t exist anymore.
          </p>
          <p className="mt-2 text-sm text-muted">
            Trips are kept for 90 days after they&rsquo;re last touched.
          </p>
          <Link
            href="/plan"
            className="mt-6 inline-block font-serif text-lg text-ink underline-offset-[6px] decoration-terracotta decoration-2 hover:underline"
          >
            Plan a new one →
          </Link>
        </div>
      </main>
    );
  }

  if (!plan) {
    return (
      <main className="flex flex-1 items-center justify-center px-6 py-24">
        <div className="text-center text-sm italic text-muted">
          {loading ? "Loading trip…" : ""}
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col pb-28">
      {/* Hero */}
      <div className="relative h-[42vh] min-h-[280px] w-full overflow-hidden bg-cream-2">
        {plan.heroImage?.url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={plan.heroImage.url}
            alt={plan.destination}
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-3xl px-6 pb-8">
          <p className="text-xs uppercase tracking-[0.22em] text-cream/90">Your trip</p>
          <h1 className="mt-2 font-serif text-5xl font-light leading-[1.05] tracking-tight text-cream sm:text-6xl">
            {plan.destination}
          </h1>
        </div>
        {plan.heroImage?.authorName && (
          <a
            href={plan.heroImage.photoUrl}
            target="_blank"
            rel="noreferrer"
            className="absolute right-3 top-3 rounded bg-ink/40 px-2 py-0.5 text-[10px] text-cream/80 backdrop-blur hover:bg-ink/60"
          >
            Photo by {plan.heroImage.authorName}
          </a>
        )}
      </div>

      <AnchorStrip />

      <div className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
        {refinedFlash && (
          <div className="mb-6 rounded border border-terracotta/40 bg-terracotta-soft/60 px-4 py-2 text-sm text-terracotta-deep">
            Plan updated.{" "}
            {previousPlan && (
              <button
                type="button"
                onClick={handleUndo}
                className="font-medium underline underline-offset-4"
              >
                Undo
              </button>
            )}
          </div>
        )}

        <section id="summary" className="scroll-mt-20">
          <p className="mb-6 font-serif text-2xl font-light italic leading-snug text-ink-2">
            {plan.summary}
          </p>

          {/* Inline secondary action row */}
          <div className="mb-10 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
            <button
              type="button"
              onClick={handleCopyLink}
              className="text-ink hover:text-terracotta"
            >
              {copied ? "✓ Link copied" : "Copy share link"}
            </button>
            <span className="text-line-strong">·</span>
            {sent ? (
              <span className="text-ink-2">
                ✓ Emailed to <span className="font-mono">{sent}</span>
              </span>
            ) : (
              <button
                type="button"
                onClick={handleEmail}
                disabled={sending}
                className="text-ink hover:text-terracotta disabled:opacity-50"
              >
                {sending ? "Sending…" : "Email this plan"}
              </button>
            )}
            <span className="text-line-strong">·</span>
            <Link href="/plan" className="text-muted hover:text-terracotta">
              Plan another
            </Link>
            <span className="text-line-strong">·</span>
            <Link href="/" className="text-muted hover:text-terracotta">
              Home
            </Link>
            {sendError && (
              <span className="text-terracotta-deep">{sendError}</span>
            )}
          </div>
        </section>

        {plan.budgetSummary && (
          <section id="budget" className="mb-12 scroll-mt-20 rounded-md border border-line bg-paper p-5">
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                Trip budget — estimated
              </h2>
              <span className="font-serif text-2xl text-terracotta-deep">
                {plan.budgetSummary.estimatedTotal}
              </span>
            </div>
            <dl className="space-y-1.5 text-sm">
              <Row label="Flights" value={plan.budgetSummary.flights} />
              <Row label="Stay" value={plan.budgetSummary.accommodation} />
              <Row label="Food + activities" value={plan.budgetSummary.foodAndActivities} />
            </dl>
            {plan.budgetSummary.notes && (
              <p className="mt-3 text-xs italic text-muted">{plan.budgetSummary.notes}</p>
            )}
          </section>
        )}

        <Block id="flights" title="Flights" subtitle="Click through to see live prices.">
          <div className="space-y-3">
            {plan.flights.map((f, i) => (
              <a
                key={i}
                href={f.bookingLink}
                target="_blank"
                rel="noreferrer"
                className="block rounded border border-line bg-paper p-4 transition hover:border-terracotta"
              >
                <div className="flex items-baseline justify-between">
                  <span className="font-serif text-lg">{f.airline}</span>
                  <span className="font-mono text-sm text-terracotta-deep">{f.price}</span>
                </div>
                <div className="mt-1 text-sm text-muted">
                  {f.departure} → {f.arrival} · {f.duration} ·{" "}
                  {f.stops === 0 ? "nonstop" : `${f.stops} stop${f.stops > 1 ? "s" : ""}`}
                </div>
              </a>
            ))}
          </div>
        </Block>

        <Block id="stays" title="Where to stay" subtitle="Picks matched to your tier.">
          <div className="space-y-3">
            {plan.accommodations.map((a, i) => (
              <a
                key={i}
                href={a.bookingLink}
                target="_blank"
                rel="noreferrer"
                className="block rounded border border-line bg-paper p-4 transition hover:border-terracotta"
              >
                <div className="flex items-baseline justify-between">
                  <span className="font-serif text-lg">{a.name}</span>
                  <span className="font-mono text-sm text-terracotta-deep">{a.pricePerNight}</span>
                </div>
                <div className="mt-1 text-sm text-muted">{a.style}</div>
                <div className="mt-2 text-sm text-ink-2">{a.whyItFits}</div>
              </a>
            ))}
          </div>
        </Block>

        <Block id="transport" title="Getting around">
          <p className="text-ink-2">{plan.localTransport}</p>
        </Block>

        <Block id="itinerary" title="Day by day">
          <DayPills count={plan.itinerary.length} />
          <div className="space-y-5">
            {plan.itinerary.map((day, i) => (
              <DayCard key={i} day={day} index={i} />
            ))}
          </div>
        </Block>

        <Block id="weather" title="Weather" subtitle={plan.weatherSummary}>
          <p className="text-sm text-muted">Used to build the packing list below.</p>
        </Block>

        <Block id="packing" title="Packing list">
          <div className="space-y-4">
            {plan.packingList.map((cat, i) => (
              <div key={i}>
                <h3 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
                  {cat.category}
                </h3>
                <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-ink-2">
                  {cat.items.map((item, j) => (
                    <li key={j} className="flex items-baseline gap-2">
                      <span className="text-terracotta">·</span> {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Block>
      </div>

      <RefineBar
        tweak={tweak}
        setTweak={setTweak}
        refining={refining}
        refineError={refineError}
        onSubmit={handleRefine}
        canUndo={!!previousPlan && !refining}
        onUndo={handleUndo}
      />
    </main>
  );
}

function AnchorStrip() {
  return (
    <nav className="sticky top-0 z-10 border-b border-line bg-cream/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-3xl items-center gap-1 overflow-x-auto px-6 py-2 text-xs">
        {ANCHORS.map((a, i) => (
          <span key={a.id} className="flex items-center gap-1">
            <a
              href={`#${a.id}`}
              className="rounded px-2 py-1 font-medium uppercase tracking-[0.18em] text-muted hover:bg-cream-2 hover:text-terracotta"
            >
              {a.label}
            </a>
            {i < ANCHORS.length - 1 && (
              <span className="text-line-strong" aria-hidden="true">
                ·
              </span>
            )}
          </span>
        ))}
      </div>
    </nav>
  );
}

function DayPills({ count }: { count: number }) {
  return (
    <div className="mb-6 flex flex-wrap gap-1.5">
      {Array.from({ length: count }, (_, i) => (
        <a
          key={i}
          href={`#day-${i + 1}`}
          className="rounded-full border border-line bg-paper px-3 py-1 font-mono text-xs uppercase tracking-wider text-ink-2 hover:border-terracotta hover:text-terracotta"
        >
          D{i + 1}
        </a>
      ))}
    </div>
  );
}

function DayCard({
  day,
  index,
}: {
  day: {
    date: string;
    title: string;
    activities: { time: string; description: string; tip?: string }[];
    meals: { meal: string; suggestion: string; why: string }[];
  };
  index: number;
}) {
  return (
    <div id={`day-${index + 1}`} className="scroll-mt-20 rounded border border-line bg-paper p-5">
      <div className="flex gap-5">
        <div className="flex flex-col items-center gap-0.5 border-r border-line pr-5 pt-1 min-w-[72px]">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
            Day
          </span>
          <span className="font-serif text-3xl leading-none text-ink">{index + 1}</span>
          <span className="mt-1 max-w-[60px] truncate font-mono text-[10px] uppercase tracking-wider text-muted">
            {day.date}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="mb-3 font-serif text-xl">{day.title}</h3>
          <ul className="space-y-3 text-sm text-ink-2">
            {day.activities.map((act, j) => (
              <li key={j} className="flex gap-4">
                <span className="w-14 shrink-0 pt-0.5 font-mono text-[11px] uppercase tracking-wider text-terracotta">
                  {act.time}
                </span>
                <div className="flex-1 border-l border-line pl-4">
                  <p>{act.description}</p>
                  {act.tip && (
                    <p className="mt-1 text-xs italic text-muted">{act.tip}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
          {day.meals.length > 0 && (
            <div className="mt-5 border-t border-line pt-4">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
                Meals
              </p>
              <ul className="space-y-1.5 text-sm text-ink-2">
                {day.meals.map((m, k) => (
                  <li key={k}>
                    <span className="font-medium">{m.meal}:</span> {m.suggestion}{" "}
                    <span className="italic text-muted">— {m.why}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function RefineBar({
  tweak,
  setTweak,
  refining,
  refineError,
  onSubmit,
  canUndo,
  onUndo,
}: {
  tweak: string;
  setTweak: (v: string) => void;
  refining: boolean;
  refineError: string | null;
  onSubmit: (e: React.FormEvent) => void;
  canUndo: boolean;
  onUndo: () => void;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-cream/95 backdrop-blur">
      <form
        onSubmit={onSubmit}
        className="mx-auto flex w-full max-w-3xl flex-col gap-1 px-6 py-3"
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            type="text"
            value={tweak}
            onChange={(e) => setTweak(e.target.value)}
            placeholder='Tweak the plan — e.g. "make day 3 chiller", "swap dinner to seafood"'
            className="flex-1 rounded border border-line bg-paper px-3 py-2 text-sm placeholder:text-muted/60 focus:border-terracotta focus:outline-none"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={refining || !tweak.trim()}
              className="rounded bg-terracotta px-4 py-2 text-sm font-medium text-cream hover:bg-terracotta-deep disabled:opacity-50"
            >
              {refining ? "Updating…" : "Refine"}
            </button>
            {canUndo && (
              <button
                type="button"
                onClick={onUndo}
                className="rounded border border-line bg-paper px-4 py-2 text-sm font-medium text-ink-2 hover:bg-cream-2"
              >
                Undo
              </button>
            )}
          </div>
        </div>
        {refineError && (
          <p className="text-sm text-terracotta-deep">{refineError}</p>
        )}
      </form>
    </div>
  );
}

function Block({
  id,
  title,
  subtitle,
  children,
}: {
  id?: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="mb-10 scroll-mt-20">
      <h2 className="font-serif text-3xl font-light text-ink">{title}</h2>
      {subtitle && <p className="mt-1 mb-5 text-sm italic text-muted">{subtitle}</p>}
      {!subtitle && <div className="mb-5" />}
      {children}
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right font-mono text-ink">{value}</dd>
    </div>
  );
}
