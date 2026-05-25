"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loadProfile, saveProfile } from "@/lib/profile";
import type { Profile } from "@/lib/types";

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setProfile(loadProfile());
  }, []);

  if (!profile) return null;

  function update<K extends keyof Profile>(key: K, value: Profile[K]) {
    setProfile((p) => (p ? { ...p, [key]: value } : p));
  }

  function updateNested<S extends "stays" | "food">(
    section: S,
    key: keyof Profile[S],
    value: string,
  ) {
    setProfile((p) => {
      if (!p) return p;
      return { ...p, [section]: { ...p[section], [key]: value } };
    });
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    saveProfile(profile);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <main className="flex flex-1 justify-center bg-zinc-50 px-6 py-12 dark:bg-black">
      <div className="w-full max-w-2xl">
        <div className="mb-8 flex items-baseline justify-between">
          <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
            Your travel profile
          </h1>
          <Link href="/" className="text-sm text-zinc-500 underline-offset-4 hover:underline">
            ← home
          </Link>
        </div>

        <p className="mb-10 text-zinc-600 dark:text-zinc-400">
          Tell tripsmith how you like to travel. Saved locally — nothing leaves your browser
          until you ask for a plan.
        </p>

        <form onSubmit={handleSave} className="space-y-10">
          <Section title="Basics">
            <Field label="Name (optional)">
              <Input value={profile.name ?? ""} onChange={(v) => update("name", v)} />
            </Field>
            <Field label="Home airport (IATA code, e.g. SFO, JFK, LHR)">
              <Input
                value={profile.homeAirport}
                onChange={(v) => update("homeAirport", v.toUpperCase().slice(0, 3))}
                placeholder="SFO"
              />
            </Field>
          </Section>

          <Section title="Where you stay">
            <Field label="Style (e.g. boutique hotels, design-forward, Airbnb in walkable areas)">
              <Textarea
                value={profile.stays.style}
                onChange={(v) => updateNested("stays", "style", v)}
              />
            </Field>
            <Field label="Avoid (e.g. big chains, all-inclusives, anything noisy)">
              <Textarea
                value={profile.stays.avoid}
                onChange={(v) => updateNested("stays", "avoid", v)}
              />
            </Field>
            <Field label="Budget per night — solo">
              <Input
                value={profile.stays.budgetPerNightSolo}
                onChange={(v) => updateNested("stays", "budgetPerNightSolo", v)}
                placeholder="e.g. $150–250"
              />
            </Field>
            <Field label="Budget per night — family">
              <Input
                value={profile.stays.budgetPerNightFamily}
                onChange={(v) => updateNested("stays", "budgetPerNightFamily", v)}
                placeholder="e.g. $250–400"
              />
            </Field>
          </Section>

          <Section title="Where you eat">
            <Field label="Style (e.g. hole-in-the-wall, local favorites, 1–2 standout meals)">
              <Textarea
                value={profile.food.style}
                onChange={(v) => updateNested("food", "style", v)}
              />
            </Field>
            <Field label="Dietary restrictions">
              <Input
                value={profile.food.dietary}
                onChange={(v) => updateNested("food", "dietary", v)}
                placeholder="e.g. pescatarian, no shellfish"
              />
            </Field>
            <Field label="Avoid">
              <Input
                value={profile.food.avoid}
                onChange={(v) => updateNested("food", "avoid", v)}
                placeholder="e.g. tourist trap fine dining"
              />
            </Field>
          </Section>

          <Section title="How you travel">
            <Field label="Pace">
              <select
                value={profile.pace}
                onChange={(e) => update("pace", e.target.value as Profile["pace"])}
                className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              >
                <option value="packed">Packed — see everything</option>
                <option value="balanced">Balanced — a few things per day</option>
                <option value="slow">Slow — one anchor, then wander</option>
              </select>
            </Field>
            <Field label="Solo mode — how this changes when you're alone">
              <Textarea
                value={profile.soloMode}
                onChange={(v) => update("soloMode", v)}
                placeholder="e.g. higher-end stays, more cafe-hopping, fewer big tours"
              />
            </Field>
            <Field label="Family mode — how this changes with family">
              <Textarea
                value={profile.familyMode}
                onChange={(v) => update("familyMode", v)}
                placeholder="e.g. apartments not hotels, kid-friendly activities, earlier dinners"
              />
            </Field>
          </Section>

          <Section title="Anything else">
            <Field label="Free-text — anything tripsmith should know">
              <Textarea
                value={profile.freeform}
                onChange={(v) => update("freeform", v)}
                rows={5}
              />
            </Field>
          </Section>

          <div className="flex items-center gap-4">
            <button
              type="submit"
              className="rounded-md bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            >
              Save profile
            </button>
            <button
              type="button"
              onClick={() => router.push("/plan")}
              className="text-sm font-medium text-zinc-700 underline-offset-4 hover:underline dark:text-zinc-300"
            >
              Plan a trip →
            </button>
            {saved && <span className="text-sm text-emerald-600">Saved.</span>}
          </div>
        </form>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-5">
      <legend className="mb-1 text-sm font-semibold uppercase tracking-wider text-zinc-500">
        {title}
      </legend>
      {children}
    </fieldset>
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

function Input(props: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      type="text"
      value={props.value}
      onChange={(e) => props.onChange(e.target.value)}
      placeholder={props.placeholder}
      className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm placeholder:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:placeholder:text-zinc-600"
    />
  );
}

function Textarea(props: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      value={props.value}
      onChange={(e) => props.onChange(e.target.value)}
      placeholder={props.placeholder}
      rows={props.rows ?? 3}
      className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm placeholder:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:placeholder:text-zinc-600"
    />
  );
}
