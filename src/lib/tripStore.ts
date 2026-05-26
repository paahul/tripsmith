import { randomBytes } from "crypto";
import { kv } from "@vercel/kv";
import type { TripPlan } from "./types";

// Trips expire 90 days after last write. Long enough to share, short enough
// to keep storage bounded.
const TTL_SECONDS = 60 * 60 * 24 * 90;
const PREFIX = "trip:";

// In-memory fallback for local dev when Vercel KV env vars aren't set.
// Survives within a single Node process; dies on reload — fine for dev.
const memoryStore = new Map<string, TripPlan>();

function hasKv(): boolean {
  return !!process.env.KV_REST_API_URL && !!process.env.KV_REST_API_TOKEN;
}

export function newTripId(): string {
  // ~11 chars, URL-safe.
  return randomBytes(8).toString("base64url");
}

export async function saveTripPlan(plan: TripPlan, id?: string): Promise<string> {
  const tripId = id ?? newTripId();
  if (hasKv()) {
    await kv.set(PREFIX + tripId, plan, { ex: TTL_SECONDS });
  } else {
    memoryStore.set(tripId, plan);
  }
  return tripId;
}

export async function loadTripPlan(id: string): Promise<TripPlan | null> {
  if (hasKv()) {
    const plan = await kv.get<TripPlan>(PREFIX + id);
    return plan ?? null;
  }
  return memoryStore.get(id) ?? null;
}
