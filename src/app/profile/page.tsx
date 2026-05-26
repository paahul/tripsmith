"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { loadProfile, saveProfile } from "@/lib/profile";
import { STAYS_TIERS, type Profile, type StaysTier } from "@/lib/types";

function clampTierIndex(i: number) {
  return Math.max(0, Math.min(STAYS_TIERS.length - 1, i));
}

const SOLO_CHIPS = [
  "higher-end stays",
  "more cafe-hopping",
  "fewer big tours",
  "off-the-beaten-path",
  "long walks, no agenda",
];

const FAMILY_CHIPS = [
  "apartments over hotels",
  "kid-friendly activities",
  "earlier dinners",
  "pool/playground access",
  "less walking",
  "direct flights preferred",
];

const PACE_OPTIONS: Array<{ id: Profile["pace"]; label: string; hint: string }> = [
  { id: "packed", label: "Packed", hint: "See everything" },
  { id: "balanced", label: "Balanced", hint: "A few per day" },
  { id: "slow", label: "Slow", hint: "One anchor, then wander" },
];

function completion(p: Profile) {
  const fields = [
    p.homeAirport,
    p.stays.style,
    p.stays.avoid,
    p.stays.regionalAdjustments,
    p.food.style,
    p.food.dietary,
    p.food.avoid,
    p.soloMode,
    p.familyMode,
    p.freeform,
  ];
  return { filled: fields.filter((f) => f.trim().length > 0).length, total: fields.length };
}

function sectionFilledCount(values: string[]): number {
  return values.filter((v) => v.trim().length > 0).length;
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setProfile(loadProfile());
  }, []);

  const stats = useMemo(() => (profile ? completion(profile) : { filled: 0, total: 10 }), [profile]);
  const [openSection, setOpenSection] = useState<string | null>(null);

  function toggle(id: string) {
    setOpenSection((cur) => (cur === id ? null : id));
  }

  if (!profile) return null;

  function update<K extends keyof Profile>(key: K, value: Profile[K]) {
    setSaved(false);
    setProfile((p) => (p ? { ...p, [key]: value } : p));
  }

  function updateNested<S extends "stays" | "food", K extends keyof Profile[S]>(
    section: S,
    key: K,
    value: Profile[S][K],
  ) {
    setSaved(false);
    setProfile((p) => {
      if (!p) return p;
      return { ...p, [section]: { ...p[section], [key]: value } };
    });
  }

  function appendToField<K extends "soloMode" | "familyMode">(key: K, chip: string) {
    setSaved(false);
    setProfile((p) => {
      if (!p) return p;
      const current = p[key];
      if (current.toLowerCase().includes(chip.toLowerCase())) return p;
      const next = current.trim().length === 0 ? chip : `${current.trim()}, ${chip}`;
      return { ...p, [key]: next };
    });
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    saveProfile(profile);
    setSaved(true);
  }

  return (
    <main className="flex flex-1 justify-center px-6 pb-32 pt-12">
      <div className="w-full max-w-2xl">
        <TopoBand />

        <div className="mb-8 flex items-baseline justify-between">
          <div>
            <p className="mb-2 text-xs uppercase tracking-[0.22em] text-terracotta">
              Your travel profile
            </p>
            <h1 className="font-serif text-4xl font-light text-ink">How do you travel?</h1>
            <p className="mt-2 text-xs text-muted">
              {stats.filled} of {stats.total} fields filled
            </p>
          </div>
          <Link href="/" className="text-sm text-muted hover:text-terracotta">
            ← home
          </Link>
        </div>

        <p className="mb-10 text-sm italic text-muted">
          Saved locally — nothing leaves your browser until you ask for a plan.
        </p>

        <form id="profile-form" onSubmit={handleSave} className="space-y-14">
          <Section
            number="01"
            title="Basics"
            filled={sectionFilledCount([profile.homeAirport])}
            total={1}
            open={openSection === "basics"}
            onToggle={() => toggle("basics")}
          >
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

          <Section
            number="02"
            title="Where you stay"
            filled={sectionFilledCount([
              profile.stays.style,
              profile.stays.avoid,
              profile.stays.regionalAdjustments,
            ])}
            total={3}
            open={openSection === "stays"}
            onToggle={() => toggle("stays")}
          >
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
              <span className="mb-3 block text-sm font-medium text-ink-2">Your default tier</span>
              <TierPicker
                value={profile.stays.tierSolo}
                onChange={(v) => {
                  const oldSoloIdx = STAYS_TIERS.findIndex((t) => t.id === profile.stays.tierSolo);
                  const oldFamilyIdx = STAYS_TIERS.findIndex((t) => t.id === profile.stays.tierFamily);
                  const delta = oldFamilyIdx - oldSoloIdx;
                  const newSoloIdx = STAYS_TIERS.findIndex((t) => t.id === v);
                  const newFamilyId = STAYS_TIERS[clampTierIndex(newSoloIdx + delta)].id;
                  setSaved(false);
                  setProfile((p) =>
                    p
                      ? { ...p, stays: { ...p.stays, tierSolo: v, tierFamily: newFamilyId } }
                      : p,
                  );
                }}
                name="tierSolo"
              />
            </div>

            <div>
              <span className="mb-3 block text-sm font-medium text-ink-2">
                With family or a group, you usually…
              </span>
              <DeltaPicker
                solo={profile.stays.tierSolo}
                family={profile.stays.tierFamily}
                onChange={(v) => updateNested("stays", "tierFamily", v)}
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

          <Section
            number="03"
            title="Where you eat"
            filled={sectionFilledCount([profile.food.style, profile.food.dietary, profile.food.avoid])}
            total={3}
            open={openSection === "food"}
            onToggle={() => toggle("food")}
          >
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

          <Section
            number="04"
            title="How you travel"
            filled={sectionFilledCount([profile.soloMode, profile.familyMode])}
            total={2}
            open={openSection === "travel"}
            onToggle={() => toggle("travel")}
          >
            <Field label="Pace">
              <PaceCards
                value={profile.pace}
                onChange={(v) => update("pace", v)}
              />
            </Field>

            <Field label="Solo mode — how this changes when you're alone">
              <ChipRow
                chips={SOLO_CHIPS}
                currentValue={profile.soloMode}
                onPick={(c) => appendToField("soloMode", c)}
              />
              <Textarea
                value={profile.soloMode}
                onChange={(v) => update("soloMode", v)}
                placeholder="higher-end stays, more cafe-hopping, fewer big tours"
              />
            </Field>

            <Field label="Family mode — how this changes with family">
              <ChipRow
                chips={FAMILY_CHIPS}
                currentValue={profile.familyMode}
                onPick={(c) => appendToField("familyMode", c)}
              />
              <Textarea
                value={profile.familyMode}
                onChange={(v) => update("familyMode", v)}
                placeholder="apartments not hotels, kid-friendly activities, earlier dinners"
              />
            </Field>
          </Section>

          <Section
            number="05"
            title="Anything else"
            filled={sectionFilledCount([profile.freeform])}
            total={1}
            open={openSection === "else"}
            onToggle={() => toggle("else")}
          >
            <Field label="Free-text — anything tripsmith should know">
              <Textarea
                value={profile.freeform}
                onChange={(v) => update("freeform", v)}
                rows={5}
              />
            </Field>
          </Section>
        </form>
      </div>

      <StickySaveBar
        saved={saved}
        onPlan={() => router.push("/plan")}
      />
    </main>
  );
}

function StickySaveBar({ saved, onPlan }: { saved: boolean; onPlan: () => void }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-cream/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-2xl items-center gap-5 px-6 py-3">
        <button
          type="submit"
          form="profile-form"
          className="rounded bg-terracotta px-6 py-2.5 text-sm font-medium text-cream hover:bg-terracotta-deep"
        >
          Save profile
        </button>
        <button
          type="button"
          onClick={onPlan}
          className="text-sm font-medium text-ink underline-offset-4 hover:underline"
        >
          Plan a trip →
        </button>
        {saved && <span className="text-sm italic text-moss">Saved.</span>}
      </div>
    </div>
  );
}

function TopoBand() {
  return (
    <svg
      viewBox="0 0 800 90"
      preserveAspectRatio="none"
      aria-hidden="true"
      className="mb-10 h-20 w-full text-line-strong"
    >
      <g fill="none" stroke="currentColor" strokeWidth="0.6" strokeLinecap="round">
        <path d="M0,18 C140,2 260,42 420,18 C560,-2 680,32 800,14" />
        <path d="M0,34 C120,18 240,58 400,34 C560,12 680,52 800,32" />
        <path d="M0,50 C160,34 280,74 420,50 C580,28 700,68 800,50" />
        <path d="M0,66 C140,50 260,90 420,66 C560,46 680,82 800,68" />
        <path d="M0,82 C120,68 240,100 400,82 C560,62 700,98 800,86" />
      </g>
      <g fill="currentColor" opacity="0.5">
        <circle cx="180" cy="42" r="1.4" />
        <circle cx="520" cy="34" r="1.4" />
        <circle cx="680" cy="58" r="1.4" />
      </g>
    </svg>
  );
}

function Section({
  number,
  title,
  filled,
  total,
  open,
  onToggle,
  children,
}: {
  number: string;
  title: string;
  filled: number;
  total: number;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const complete = filled === total && total > 0;
  return (
    <fieldset>
      <button
        type="button"
        onClick={onToggle}
        className="group flex w-full items-baseline justify-between gap-4 text-left"
      >
        <div className="flex items-baseline gap-5">
          <span className="font-mono text-xs uppercase tracking-[0.22em] text-terracotta">
            {number}
          </span>
          <legend className="font-serif text-3xl font-light text-ink">{title}</legend>
        </div>
        <div className="flex items-baseline gap-4">
          <span className={`font-mono text-xs ${complete ? "text-moss" : "text-muted"}`}>
            {filled}/{total}
          </span>
          <span
            className="font-mono text-lg text-muted group-hover:text-terracotta"
            aria-hidden="true"
          >
            {open ? "−" : "+"}
          </span>
        </div>
      </button>
      <hr className="mt-3 border-line-strong" />
      {open && <div className="mt-7 space-y-5">{children}</div>}
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

function ChipRow({
  chips,
  currentValue,
  onPick,
}: {
  chips: string[];
  currentValue: string;
  onPick: (chip: string) => void;
}) {
  return (
    <div className="mb-2 flex flex-wrap gap-1.5">
      {chips.map((c) => {
        const present = currentValue.toLowerCase().includes(c.toLowerCase());
        return (
          <button
            key={c}
            type="button"
            onClick={() => onPick(c)}
            disabled={present}
            className={`rounded-full border px-2.5 py-0.5 text-xs transition ${
              present
                ? "border-line text-muted opacity-50"
                : "border-line-strong text-ink-2 hover:border-terracotta hover:text-terracotta"
            }`}
          >
            {present ? "✓ " : "+ "}
            {c}
          </button>
        );
      })}
    </div>
  );
}

function PaceCards({
  value,
  onChange,
}: {
  value: Profile["pace"];
  onChange: (v: Profile["pace"]) => void;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-3">
      {PACE_OPTIONS.map((o) => {
        const selected = value === o.id;
        return (
          <label
            key={o.id}
            className={`flex cursor-pointer flex-col rounded border-2 px-4 py-3 transition ${
              selected
                ? "border-terracotta bg-terracotta-soft/40"
                : "border-line bg-paper hover:border-line-strong"
            }`}
          >
            <input
              type="radio"
              name="pace"
              checked={selected}
              onChange={() => onChange(o.id)}
              className="sr-only"
            />
            <span className="font-serif text-lg text-ink">{o.label}</span>
            <span className="font-serif text-xs italic text-muted">{o.hint}</span>
          </label>
        );
      })}
    </div>
  );
}

function DeltaPicker({
  solo,
  family,
  onChange,
}: {
  solo: StaysTier;
  family: StaysTier;
  onChange: (v: StaysTier) => void;
}) {
  const soloIdx = STAYS_TIERS.findIndex((t) => t.id === solo);
  const familyIdx = STAYS_TIERS.findIndex((t) => t.id === family);
  const rawDelta = familyIdx - soloIdx;
  const delta = Math.max(-1, Math.min(1, rawDelta));

  const options: Array<{ d: -1 | 0 | 1; label: string; hint: string }> = [
    { d: -1, label: "Step down a tier", hint: "smaller spaces, more practical" },
    { d: 0, label: "Stay the same", hint: "same tier as the default" },
    { d: 1, label: "Step up a tier", hint: "more room, more amenities" },
  ];

  function pick(d: -1 | 0 | 1) {
    onChange(STAYS_TIERS[clampTierIndex(soloIdx + d)].id);
  }

  const resulting = STAYS_TIERS[clampTierIndex(soloIdx + delta)];

  return (
    <div className="space-y-2">
      {options.map((o) => {
        const selected = o.d === delta;
        const wouldClamp =
          (o.d === -1 && soloIdx === 0) ||
          (o.d === 1 && soloIdx === STAYS_TIERS.length - 1);
        return (
          <label
            key={o.d}
            className={`flex cursor-pointer items-center gap-3 rounded border-2 px-4 py-3 transition ${
              selected
                ? "border-terracotta bg-terracotta-soft/40"
                : "border-line bg-paper hover:border-line-strong"
            } ${wouldClamp ? "opacity-50" : ""}`}
          >
            <input
              type="radio"
              name="tierDelta"
              checked={selected}
              onChange={() => pick(o.d)}
              disabled={wouldClamp}
              className="accent-terracotta"
            />
            <span className="font-serif text-lg text-ink">{o.label}</span>
            <span className="font-serif text-sm italic text-muted">{o.hint}</span>
          </label>
        );
      })}
      <p className="pl-1 pt-1 text-xs italic text-muted">
        → Family/group tier:{" "}
        <span className="font-medium not-italic text-ink-2">{resulting.label}</span>
      </p>
    </div>
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
