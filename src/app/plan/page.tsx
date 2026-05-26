"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { DayPicker, type DateRange } from "react-day-picker";
import "react-day-picker/style.css";
import { hasProfile, loadProfile } from "@/lib/profile";
import { MAX_TRIP_DAYS, tripLengthDays, type TripRequest } from "@/lib/types";
import { COVER_PHOTO_URL } from "@/lib/travelImages";

const LOADING_MESSAGES = [
  "Looking up flights…",
  "Picking restaurants you'd like…",
  "Choosing stays that match your tier…",
  "Checking the weather forecast…",
  "Building your day-by-day…",
  "Pulling a hero shot…",
  "Estimating the budget…",
];

function isoDate(d: Date | undefined): string {
  if (!d) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function PlanPage() {
  const router = useRouter();
  const [request, setRequest] = useState<TripRequest>({
    destination: "",
    startDate: "",
    endDate: "",
    travelers: 1,
    mode: "solo",
    notes: "",
  });
  const [range, setRange] = useState<DateRange | undefined>();
  const [profileReady, setProfileReady] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingIndex, setLoadingIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const loadingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setProfileReady(hasProfile());
  }, []);

  useEffect(() => {
    setRequest((r) => ({
      ...r,
      startDate: isoDate(range?.from),
      endDate: isoDate(range?.to),
    }));
  }, [range]);

  useEffect(() => {
    if (loading) {
      setLoadingIndex(0);
      loadingTimerRef.current = setInterval(() => {
        setLoadingIndex((i) => (i + 1) % LOADING_MESSAGES.length);
      }, 4500);
    } else if (loadingTimerRef.current) {
      clearInterval(loadingTimerRef.current);
      loadingTimerRef.current = null;
    }
    return () => {
      if (loadingTimerRef.current) clearInterval(loadingTimerRef.current);
    };
  }, [loading]);

  const days = tripLengthDays(request.startDate, request.endDate);
  const tooLong = days > MAX_TRIP_DAYS;
  const datesInvalid =
    !!request.startDate && !!request.endDate && new Date(request.endDate) < new Date(request.startDate);
  const submitDisabled = loading || tooLong || datesInvalid || !request.startDate || !request.endDate;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (request.travelers < 1) {
      setError("Travelers must be at least 1.");
      return;
    }
    if (datesInvalid) {
      setError("End date must be on or after the start date.");
      return;
    }
    if (tooLong) {
      setError(`Maximum ${MAX_TRIP_DAYS} days per plan.`);
      return;
    }
    setLoading(true);
    try {
      const profile = loadProfile();
      const res = await fetch("/api/plan-trip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, request }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Request failed (${res.status})`);
      }
      const data = await res.json();
      sessionStorage.setItem("tripsmith:lastTrip", JSON.stringify(data));
      sessionStorage.removeItem("tripsmith:previousTrip");
      router.push("/trip");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <main className="flex flex-1 items-center justify-center px-6 py-24">
        <div className="text-center">
          <div className="mb-6 inline-flex items-center gap-2">
            <span className="block h-2 w-2 animate-pulse rounded-full bg-terracotta" />
            <span className="block h-2 w-2 animate-pulse rounded-full bg-terracotta [animation-delay:200ms]" />
            <span className="block h-2 w-2 animate-pulse rounded-full bg-terracotta [animation-delay:400ms]" />
          </div>
          <p className="font-serif text-3xl font-light italic text-ink">
            {LOADING_MESSAGES[loadingIndex]}
          </p>
          <p className="mt-3 text-sm text-muted">
            This usually takes about 25–35 seconds.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative flex flex-1 justify-center px-6 py-12">
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-cover bg-center opacity-30"
        style={{ backgroundImage: `url('${COVER_PHOTO_URL}')` }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-cream via-cream/70 to-cream"
        aria-hidden="true"
      />
      <div className="w-full max-w-xl rounded-md border border-line bg-paper/95 p-8 shadow-sm backdrop-blur-sm">
        <div className="mb-8 flex items-baseline justify-between">
          <div>
            <p className="mb-2 text-xs uppercase tracking-[0.22em] text-terracotta">
              Plan a trip
            </p>
            <h1 className="font-serif text-4xl font-light text-ink">Where to?</h1>
          </div>
          <Link href="/" className="text-sm text-muted hover:text-terracotta">
            ← home
          </Link>
        </div>

        {profileReady === false && (
          <div className="mb-6 rounded border border-terracotta/40 bg-terracotta-soft/60 p-4 text-sm text-terracotta-deep">
            You haven&apos;t set up your travel profile yet.{" "}
            <Link href="/profile" className="font-medium underline">
              Do that first
            </Link>{" "}
            so the plan matches how you travel.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Field label="Destination (city or country)">
            <input
              type="text"
              required
              value={request.destination}
              onChange={(e) => setRequest({ ...request, destination: e.target.value })}
              placeholder="Lisbon, Portugal"
              className="w-full rounded border border-line bg-paper px-3 py-2 text-base focus:border-terracotta focus:outline-none"
            />
          </Field>

          <div>
            <span className="mb-2 block text-sm font-medium text-ink-2">When?</span>
            <div className="rounded border border-line bg-paper p-3">
              <DayPicker
                mode="range"
                numberOfMonths={1}
                selected={range}
                onSelect={setRange}
                disabled={{ before: new Date() }}
              />
            </div>
            {days > 0 && (
              <p
                className={`mt-2 text-sm ${
                  tooLong || datesInvalid ? "text-terracotta-deep" : "text-muted"
                }`}
              >
                {datesInvalid
                  ? "End date must be on or after the start date."
                  : tooLong
                    ? `${days} days — maximum ${MAX_TRIP_DAYS} per plan.`
                    : `${days} day${days === 1 ? "" : "s"}`}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Who's coming">
              <select
                value={request.mode}
                onChange={(e) =>
                  setRequest({ ...request, mode: e.target.value as TripRequest["mode"] })
                }
                className="w-full rounded border border-line bg-paper px-3 py-2 text-base focus:border-terracotta focus:outline-none"
              >
                <option value="solo">Solo</option>
                <option value="couple">Couple</option>
                <option value="family">Family</option>
                <option value="friends">Friends</option>
              </select>
            </Field>
            <Field label="Travelers">
              <input
                type="number"
                min={1}
                max={10}
                value={request.travelers === 0 ? "" : request.travelers}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === "") {
                    setRequest({ ...request, travelers: 0 });
                    return;
                  }
                  const n = parseInt(v);
                  if (!isNaN(n)) {
                    setRequest({ ...request, travelers: Math.min(10, Math.max(0, n)) });
                  }
                }}
                className="w-full rounded border border-line bg-paper px-3 py-2 text-base focus:border-terracotta focus:outline-none"
              />
            </Field>
          </div>

          <Field label="Notes (optional)">
            <textarea
              value={request.notes}
              onChange={(e) => setRequest({ ...request, notes: e.target.value })}
              rows={3}
              placeholder="e.g. anniversary trip, want one nice meal; kid has nut allergy; need to be back by Friday evening"
              className="w-full rounded border border-line bg-paper px-3 py-2 text-base focus:border-terracotta focus:outline-none"
            />
          </Field>

          {error && (
            <div className="rounded border border-terracotta/40 bg-terracotta-soft/60 p-3 text-sm text-terracotta-deep">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitDisabled}
            className="rounded bg-terracotta px-6 py-3 text-base font-medium text-cream hover:bg-terracotta-deep disabled:opacity-40"
          >
            Plan my trip
          </button>
        </form>
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink-2">{label}</span>
      {children}
    </label>
  );
}
