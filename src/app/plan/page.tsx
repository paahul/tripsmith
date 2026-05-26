"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { hasProfile, loadProfile } from "@/lib/profile";
import { MAX_TRIP_DAYS, tripLengthDays, type TripRequest } from "@/lib/types";

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
  const [profileReady, setProfileReady] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const days = tripLengthDays(request.startDate, request.endDate);
  const tooLong = days > MAX_TRIP_DAYS;
  const datesInvalid =
    !!request.startDate && !!request.endDate && new Date(request.endDate) < new Date(request.startDate);
  const submitDisabled = loading || tooLong || datesInvalid;

  useEffect(() => {
    setProfileReady(hasProfile());
  }, []);

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
      setError(`Maximum ${MAX_TRIP_DAYS} days per plan. Pick a shorter range, or plan multi-leg trips separately.`);
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
      router.push("/trip");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <main className="flex flex-1 justify-center bg-zinc-50 px-6 py-12 dark:bg-black">
      <div className="w-full max-w-xl">
        <div className="mb-8 flex items-baseline justify-between">
          <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
            Plan a trip
          </h1>
          <Link href="/" className="text-sm text-zinc-500 underline-offset-4 hover:underline">
            ← home
          </Link>
        </div>

        {profileReady === false && (
          <div className="mb-6 rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200">
            You haven&apos;t set up your travel profile yet.{" "}
            <Link href="/profile" className="font-medium underline">
              Do that first
            </Link>{" "}
            so the plan matches how you actually travel.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <Field label="Destination (city or country)">
            <input
              type="text"
              required
              value={request.destination}
              onChange={(e) => setRequest({ ...request, destination: e.target.value })}
              placeholder="Lisbon, Portugal"
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Start date">
              <input
                type="date"
                required
                value={request.startDate}
                onChange={(e) => setRequest({ ...request, startDate: e.target.value })}
                className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              />
            </Field>
            <Field label="End date">
              <input
                type="date"
                required
                value={request.endDate}
                onChange={(e) => setRequest({ ...request, endDate: e.target.value })}
                className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              />
            </Field>
          </div>

          {days > 0 && (
            <p
              className={`text-sm ${
                tooLong || datesInvalid ? "text-amber-700 dark:text-amber-400" : "text-zinc-500"
              }`}
            >
              {datesInvalid
                ? "End date must be on or after the start date."
                : tooLong
                  ? `${days} days — maximum ${MAX_TRIP_DAYS} per plan. Pick a shorter range, or plan multi-leg trips separately.`
                  : `${days} day${days === 1 ? "" : "s"}`}
            </p>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Field label="Who's coming">
              <select
                value={request.mode}
                onChange={(e) =>
                  setRequest({ ...request, mode: e.target.value as TripRequest["mode"] })
                }
                className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
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
                className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              />
            </Field>
          </div>

          <Field label="Notes (optional — anything specific for this trip)">
            <textarea
              value={request.notes}
              onChange={(e) => setRequest({ ...request, notes: e.target.value })}
              rows={3}
              placeholder="e.g. anniversary trip, want one nice meal; kid has nut allergy; need to be back by Friday evening"
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
          </Field>

          {error && (
            <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitDisabled}
            className="rounded-md bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            {loading ? "Planning… (this takes 20–40s)" : "Plan my trip"}
          </button>
        </form>
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {label}
      </span>
      {children}
    </label>
  );
}
