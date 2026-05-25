"use client";

import { DEFAULT_PROFILE, type Profile } from "./types";

const KEY = "tripsmith:profile:v1";

export function loadProfile(): Profile {
  if (typeof window === "undefined") return DEFAULT_PROFILE;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULT_PROFILE;
    return { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
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
