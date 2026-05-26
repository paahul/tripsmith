"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { TripPlan } from "@/lib/types";

export default function TripPage() {
  const [plan, setPlan] = useState<TripPlan | null>(null);
  const [previousPlan, setPreviousPlan] = useState<TripPlan | null>(null);
  const [missing, setMissing] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);

  const [tweak, setTweak] = useState("");
  const [refining, setRefining] = useState(false);
  const [refineError, setRefineError] = useState<string | null>(null);
  const [refinedFlash, setRefinedFlash] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem("tripsmith:lastTrip");
    if (!raw) {
      setMissing(true);
      return;
    }
    try {
      setPlan(JSON.parse(raw));
    } catch {
      setMissing(true);
    }
    const prev = sessionStorage.getItem("tripsmith:previousTrip");
    if (prev) {
      try {
        setPreviousPlan(JSON.parse(prev));
      } catch {
        /* ignore */
      }
    }
  }, []);

  async function handleEmail() {
    if (!plan) return;
    setSending(true);
    setSendError(null);
    try {
      const res = await fetch("/api/email-trip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
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

  async function handleRefine(e: React.FormEvent) {
    e.preventDefault();
    if (!plan || !tweak.trim()) return;
    setRefining(true);
    setRefineError(null);
    try {
      const res = await fetch("/api/refine-trip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPlan: plan, tweak: tweak.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Failed (${res.status})`);
      sessionStorage.setItem("tripsmith:previousTrip", JSON.stringify(plan));
      sessionStorage.setItem("tripsmith:lastTrip", JSON.stringify(data));
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

  function handleUndo() {
    if (!previousPlan) return;
    sessionStorage.setItem("tripsmith:lastTrip", JSON.stringify(previousPlan));
    sessionStorage.removeItem("tripsmith:previousTrip");
    setPlan(previousPlan);
    setPreviousPlan(null);
    setSent(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (missing) {
    return (
      <main className="flex flex-1 items-center justify-center px-6 py-24">
        <div className="text-center">
          <p className="font-serif text-xl italic text-muted">No trip plan found.</p>
          <Link
            href="/plan"
            className="mt-4 inline-block font-serif text-lg text-ink underline-offset-[6px] decoration-terracotta decoration-2 hover:underline"
          >
            Plan one →
          </Link>
        </div>
      </main>
    );
  }

  if (!plan) return null;

  return (
    <main className="flex flex-1 flex-col">
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

        <div className="mb-6 flex items-center justify-end gap-4 text-sm text-muted">
          <Link href="/plan" className="hover:text-terracotta">
            plan another
          </Link>
          <Link href="/" className="hover:text-terracotta">
            home
          </Link>
        </div>

        <p className="mb-8 font-serif text-2xl font-light italic leading-snug text-ink-2">
          {plan.summary}
        </p>

        {plan.budgetSummary && (
          <section className="mb-8 rounded-md border border-line bg-paper p-5">
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

        <form
          onSubmit={handleRefine}
          className="mb-6 rounded-md border border-line bg-paper p-4"
        >
          <label htmlFor="tweak" className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-muted">
            Tweak this plan
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              id="tweak"
              type="text"
              value={tweak}
              onChange={(e) => setTweak(e.target.value)}
              placeholder='e.g. "swap day 2 dinner to seafood", "make day 3 chiller"'
              className="flex-1 rounded border border-line bg-cream px-3 py-2 text-sm placeholder:text-muted/60 focus:border-terracotta focus:outline-none"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={refining || !tweak.trim()}
                className="rounded bg-terracotta px-4 py-2 text-sm font-medium text-cream hover:bg-terracotta-deep disabled:opacity-50"
              >
                {refining ? "Updating…" : "Refine"}
              </button>
              {previousPlan && !refining && (
                <button
                  type="button"
                  onClick={handleUndo}
                  className="rounded border border-line px-4 py-2 text-sm font-medium text-ink-2 hover:bg-cream-2"
                >
                  Undo
                </button>
              )}
            </div>
          </div>
          {refineError && <p className="mt-2 text-sm text-terracotta-deep">{refineError}</p>}
        </form>

        <div className="mb-12 rounded-md border border-line bg-paper p-4">
          {sent ? (
            <p className="text-sm text-ink-2">
              ✓ Sent to <span className="font-mono">{sent}</span>. Contact Paahul to get it
              forwarded to your inbox.
            </p>
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-ink-2">Want this plan in your inbox?</p>
              <button
                type="button"
                onClick={handleEmail}
                disabled={sending}
                className="rounded bg-ink px-4 py-1.5 text-sm font-medium text-cream hover:bg-ink-2 disabled:opacity-50"
              >
                {sending ? "Sending…" : "Email this plan"}
              </button>
            </div>
          )}
          {sendError && <p className="mt-2 text-sm text-terracotta-deep">{sendError}</p>}
        </div>

        <Block title="Flights" subtitle="Click through to see live prices.">
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

        <Block title="Where to stay" subtitle="Picks matched to your tier.">
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

        <Block title="Getting around">
          <p className="text-ink-2">{plan.localTransport}</p>
        </Block>

        <Block title="Day by day">
          <div className="space-y-5">
            {plan.itinerary.map((day, i) => (
              <div key={i} className="rounded border border-line bg-paper p-5">
                <div className="mb-3 flex items-baseline justify-between">
                  <h3 className="font-serif text-xl">{day.title}</h3>
                  <span className="font-mono text-xs text-muted">{day.date}</span>
                </div>
                <ul className="space-y-2 text-sm text-ink-2">
                  {day.activities.map((act, j) => (
                    <li key={j} className="flex gap-3">
                      <span className="font-mono text-xs uppercase text-muted">{act.time}</span>
                      <div className="flex-1">
                        {act.description}
                        {act.tip && <span className="ml-2 italic text-muted">— {act.tip}</span>}
                      </div>
                    </li>
                  ))}
                </ul>
                {day.meals.length > 0 && (
                  <div className="mt-4 border-t border-line pt-3">
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
            ))}
          </div>
        </Block>

        <Block title="Weather" subtitle={plan.weatherSummary}>
          <p className="text-sm text-muted">Used to build the packing list below.</p>
        </Block>

        <Block title="Packing list">
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
    </main>
  );
}

function Block({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-10">
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
