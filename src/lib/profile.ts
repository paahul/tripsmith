"use client";

import { DEFAULT_PROFILE, type Profile } from "./types";

const KEY = "tripsmith:profile:v1";

export function loadProfile(): Profile {
  if (typeof window === "undefined") return DEFAULT_PROFILE;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULT_PROFILE;
    const parsed = JSON.parse(raw) as Partial<Profile> & {
      stays?: Record<string, unknown>;
    };
    return {
      ...DEFAULT_PROFILE,
      ...parsed,
      stays: {
        ...DEFAULT_PROFILE.stays,
        ...(parsed.stays as Profile["stays"] | undefined),
      },
      food: {
        ...DEFAULT_PROFILE.food,
        ...(parsed.food as Profile["food"] | undefined),
      },
    };
  } catch {
    return DEFAULT_PROFILE;
  }
}

export function saveProfile(profile: Profile) {
  window.localStorage.setItem(KEY, JSON.stringify(profile));
}

export function hasProfile(): boolean {
  if (typeof window === "undefined") return false;
  return !!window.localStorage.getItem(KEY);
}
