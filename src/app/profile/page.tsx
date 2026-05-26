"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loadProfile, saveProfile } from "@/lib/profile";
import { STAYS_TIERS, type Profile, type StaysTier } from "@/lib/types";

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

  function updateNested<S extends "stays" | "food", K extends keyof Profile[S]>(
    section: S,
    key: K,
    value: Profile[S][K],
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
    setTimeout(() => router.push("/plan"), 600);
  }

  return (
    <main className="flex flex-1 justify-center px-6 py-12">
      <div className="w-full max-w-2xl">
        <div className="mb-8 flex items-baseline justify-between">
          <div>
            <p className="mb-2 text-xs uppercase tracking-[0.22em] text-terracotta">
              Your travel profile
            </p>
            <h1 className="font-serif text-4xl font-light text-ink">How do you travel?</h1>
          </div>
          <Link href="/" className="text-sm text-muted hover:text-terracotta">
            ← home
          </Link>
        </div>

        <figure className="mb-10 border-l-2 border-terracotta py-1 pl-5">
          <blockquote className="font-serif text-2xl font-light italic leading-snug text-ink-2">
            &ldquo;How you travel says more about you than where you&rsquo;ve been.&rdquo;
          </blockquote>
          <figcaption className="mt-2 text-xs uppercase tracking-[0.18em] text-muted">
            — your profile, in one sitting
          </figcaption>
        </figure>

        <div className="mb-10 flex items-center gap-4">
          <hr className="flex-1 border-line" />
          <span className="font-serif text-terracotta">✦</span>
          <hr className="flex-1 border-line" />
        </div>

        <p className="mb-10 text-sm italic text-muted">
          Saved locally — nothing leaves your browser until you ask for a plan.
        </p>

        <form onSubmit={handleSave} className="space-y-12">
          <Section title="Basics">
            <Field label="Name (optional)">
              <Input value={profile.name ?? ""} onChange={(v) => update("name", v)} />
            </Field>
            <Field label="Home airport (IATA code)">
              <Input
                value={profile.homeAirport}
                onChange={(v) => update("homeAirport", v.toUpperCase().slice(0, 3))}
                placeholder="SFO"
              />
            </Field>
          </Section>

          <Section title="Where you stay">
            <Field label="Style">
              <Textarea
                value={profile.stays.style}
                onChange={(v) => updateNested("stays", "style", v)}
                placeholder="boutique hotels, design-forward, Airbnb in walkable areas"
              />
            </Field>
            <Field label="Avoid">
              <Textarea
                value={profile.stays.avoid}
                onChange={(v) => updateNested("stays", "avoid", v)}
                placeholder="big chains, all-inclusives, anything noisy"
              />
            </Field>

            <div>
              <span className="mb-3 block text-sm font-medium text-ink-2">Tier — solo trips</span>
              <TierPicker
                value={profile.stays.tierSolo}
                onChange={(v) => updateNested("stays", "tierSolo", v)}
                name="tierSolo"
              />
            </div>

            <div>
              <span className="mb-3 block text-sm font-medium text-ink-2">
                Tier — family / group trips
              </span>
              <TierPicker
                value={profile.stays.tierFamily}
                onChange={(v) => updateNested("stays", "tierFamily", v)}
                name="tierFamily"
              />
            </div>

            <Field label="Regional adjustments (optional)">
              <Textarea
                value={profile.stays.regionalAdjustments}
                onChange={(v) => updateNested("stays", "regionalAdjustments", v)}
                placeholder="In SE Asia I'd downshift — dollars stretch further. In Europe I prefer apartments over hotels."
                rows={3}
              />
            </Field>
          </Section>

          <Section title="Where you eat">
            <Field label="Style">
              <Textarea
                value={profile.food.style}
                onChange={(v) => updateNested("food", "style", v)}
                placeholder="hole-in-the-wall, local favorites, 1–2 standout meals"
              />
            </Field>
            <Field label="Dietary restrictions">
              <Input
                value={profile.food.dietary}
                onChange={(v) => updateNested("food", "dietary", v)}
                placeholder="pescatarian, no shellfish"
              />
            </Field>
            <Field label="Avoid">
              <Input
                value={profile.food.avoid}
                onChange={(v) => updateNested("food", "avoid", v)}
                placeholder="tourist trap fine dining"
              />
            </Field>
          </Section>

          <Section title="How you travel">
            <Field label="Pace">
              <select
                value={profile.pace}
                onChange={(e) => update("pace", e.target.value as Profile["pace"])}
                className="w-full rounded border border-line bg-paper px-3 py-2 text-base focus:border-terracotta focus:outline-none"
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
                placeholder="higher-end stays, more cafe-hopping, fewer big tours"
              />
            </Field>
            <Field label="Family mode — how this changes with family">
              <Textarea
                value={profile.familyMode}
                onChange={(v) => update("familyMode", v)}
                placeholder="apartments not hotels, kid-friendly activities, earlier dinners"
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

          <div className="flex items-center gap-5">
            <button
              type="submit"
              className="rounded bg-terracotta px-6 py-2.5 text-sm font-medium text-cream hover:bg-terracotta-deep"
            >
              Save profile
            </button>
            <button
              type="button"
              onClick={() => router.push("/plan")}
              className="text-sm font-medium text-ink underline-offset-4 hover:underline"
            >
              Plan a trip →
            </button>
            {saved && <span className="text-sm italic text-moss">Saved.</span>}
          </div>
        </form>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-5">
      <legend className="mb-3 font-serif text-2xl font-light text-ink">{title}</legend>
      {children}
    </fieldset>
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
      className="w-full rounded border border-line bg-paper px-3 py-2 text-base placeholder:text-muted/60 focus:border-terracotta focus:outline-none"
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
      className="w-full rounded border border-line bg-paper px-3 py-2 text-base placeholder:text-muted/60 focus:border-terracotta focus:outline-none"
    />
  );
}

function TierPicker({
  value,
  onChange,
  name,
}: {
  value: StaysTier;
  onChange: (v: StaysTier) => void;
  name: string;
}) {
  return (
    <div className="space-y-2">
      {STAYS_TIERS.map((t) => {
        const selected = value === t.id;
        return (
          <label
            key={t.id}
            className={`block cursor-pointer rounded border-2 p-4 transition ${
              selected
                ? "border-terracotta bg-terracotta-soft/40"
                : "border-line bg-paper hover:border-line-strong"
            }`}
          >
            <div className="flex items-start gap-3">
              <input
                type="radio"
                name={name}
                checked={selected}
                onChange={() => onChange(t.id)}
                className="mt-1.5 accent-terracotta"
              />
              <div className="flex-1">
                <div className="flex items-baseline gap-3">
                  <span className="font-serif text-xl">{t.label}</span>
                  <span className="font-serif text-sm italic text-muted">{t.tagline}</span>
                </div>
                <p className="mt-1.5 text-sm text-ink-2">{t.description}</p>
                <p className="mt-1.5 text-xs text-muted">
                  <span className="font-medium">Examples:</span> {t.examples}
                </p>
                <p className="mt-1 font-mono text-xs text-muted">{t.prices}</p>
              </div>
            </div>
          </label>
        );
      })}
    </div>
  );
}
