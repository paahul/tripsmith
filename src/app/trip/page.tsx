"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { TripPlan } from "@/lib/types";

export default function TripPage() {
  const [plan, setPlan] = useState<TripPlan | null>(null);
  const [missing, setMissing] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);

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

  if (missing) {
    return (
      <main className="flex flex-1 items-center justify-center bg-zinc-50 px-6 py-24 dark:bg-black">
        <div className="text-center">
          <p className="text-zinc-600 dark:text-zinc-400">No trip plan found.</p>
          <Link
            href="/plan"
            className="mt-4 inline-block text-sm font-medium text-black underline-offset-4 hover:underline dark:text-white"
          >
            Plan one →
          </Link>
        </div>
      </main>
    );
  }

  if (!plan) return null;

  return (
    <main className="flex flex-1 justify-center bg-zinc-50 px-6 py-12 dark:bg-black">
      <div className="w-full max-w-3xl">
        <div className="mb-8 flex items-baseline justify-between">
          <div>
            <p className="text-sm uppercase tracking-wider text-zinc-500">Your trip</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
              {plan.destination}
            </h1>
          </div>
          <div className="flex gap-4 text-sm">
            <Link href="/plan" className="text-zinc-500 underline-offset-4 hover:underline">
              plan another
            </Link>
            <Link href="/" className="text-zinc-500 underline-offset-4 hover:underline">
              home
            </Link>
          </div>
        </div>

        <p className="mb-8 text-lg text-zinc-700 dark:text-zinc-300">{plan.summary}</p>

        <div className="mb-10 rounded-md border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          {sent ? (
            <p className="text-sm text-zinc-700 dark:text-zinc-300">
              ✓ Sent to <span className="font-mono">{sent}</span>. Please contact Paahul to get
              it forwarded to your mailbox.
            </p>
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-zinc-700 dark:text-zinc-300">
                Want this plan in your inbox?
              </p>
              <button
                type="button"
                onClick={handleEmail}
                disabled={sending}
                className="rounded-md bg-black px-4 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
              >
                {sending ? "Sending…" : "Email this plan"}
              </button>
            </div>
          )}
          {sendError && (
            <p className="mt-2 text-sm text-red-600">{sendError}</p>
          )}
        </div>

        <Block title="✈️ Flights" subtitle="Click through to book — tripsmith does not book for you.">
          <div className="space-y-3">
            {plan.flights.map((f, i) => (
              <a
                key={i}
                href={f.bookingLink}
                target="_blank"
                rel="noreferrer"
                className="block rounded-md border border-zinc-200 bg-white p-4 transition hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-600"
              >
                <div className="flex items-baseline justify-between">
                  <span className="font-medium">{f.airline}</span>
                  <span className="font-mono text-sm">{f.price}</span>
                </div>
                <div className="mt-1 text-sm text-zinc-500">
                  {f.departure} → {f.arrival} · {f.duration} ·{" "}
                  {f.stops === 0 ? "nonstop" : `${f.stops} stop${f.stops > 1 ? "s" : ""}`}
                </div>
              </a>
            ))}
          </div>
        </Block>

        <Block title="🏨 Where to stay" subtitle="Picks matched to your stay style.">
          <div className="space-y-3">
            {plan.accommodations.map((a, i) => (
              <a
                key={i}
                href={a.bookingLink}
                target="_blank"
                rel="noreferrer"
                className="block rounded-md border border-zinc-200 bg-white p-4 transition hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-600"
              >
                <div className="flex items-baseline justify-between">
                  <span className="font-medium">{a.name}</span>
                  <span className="font-mono text-sm">{a.pricePerNight}</span>
                </div>
                <div className="mt-1 text-sm text-zinc-500">{a.style}</div>
                <div className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">{a.whyItFits}</div>
              </a>
            ))}
          </div>
        </Block>

        <Block title="🚕 Getting around">
          <p className="text-zinc-700 dark:text-zinc-300">{plan.localTransport}</p>
        </Block>

        <Block title="📅 Day-by-day">
          <div className="space-y-6">
            {plan.itinerary.map((day, i) => (
              <div key={i} className="rounded-md border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex items-baseline justify-between">
                  <h3 className="font-medium">{day.title}</h3>
                  <span className="font-mono text-xs text-zinc-500">{day.date}</span>
                </div>
                <ul className="mt-3 space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
                  {day.activities.map((act, j) => (
                    <li key={j}>
                      <span className="font-mono text-xs text-zinc-500 mr-2">{act.time}</span>
                      {act.description}
                      {act.tip && (
                        <span className="ml-2 text-zinc-500">— {act.tip}</span>
                      )}
                    </li>
                  ))}
                </ul>
                {day.meals.length > 0 && (
                  <div className="mt-4 border-t border-zinc-100 pt-3 dark:border-zinc-800">
                    <p className="mb-2 text-xs uppercase tracking-wider text-zinc-500">Meals</p>
                    <ul className="space-y-1.5 text-sm text-zinc-700 dark:text-zinc-300">
                      {day.meals.map((m, k) => (
                        <li key={k}>
                          <span className="font-medium">{m.meal}:</span> {m.suggestion}{" "}
                          <span className="text-zinc-500">— {m.why}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Block>

        <Block title="🌤️ Weather" subtitle={plan.weatherSummary}>
          <p className="text-sm text-zinc-500">Used to build the packing list below.</p>
        </Block>

        <Block title="🧥 Packing list">
          <div className="space-y-4">
            {plan.packingList.map((cat, i) => (
              <div key={i}>
                <h3 className="text-sm font-medium uppercase tracking-wider text-zinc-500">
                  {cat.category}
                </h3>
                <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-zinc-700 dark:text-zinc-300">
                  {cat.items.map((item, j) => (
                    <li key={j} className="flex items-baseline gap-2">
                      <span className="text-zinc-400">·</span> {item}
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
      <h2 className="mb-1 text-xl font-semibold text-black dark:text-zinc-50">{title}</h2>
      {subtitle && <p className="mb-4 text-sm text-zinc-500">{subtitle}</p>}
      {children}
    </section>
  );
}
