import { randomBytes } from "crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { TripPlan } from "./types";

// In-memory fallback for local dev when Supabase env vars aren't set.
// Survives within a single Node process; dies on reload — fine for dev.
const memoryStore = new Map<string, TripPlan>();

let cachedClient: SupabaseClient | null = null;
let cachedClientResolved = false;

function getClient(): SupabaseClient | null {
  if (cachedClientResolved) return cachedClient;
  cachedClientResolved = true;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    cachedClient = null;
    return null;
  }
  cachedClient = createClient(url, key, { auth: { persistSession: false } });
  return cachedClient;
}

export function newTripId(): string {
  // ~11 chars, URL-safe.
  return randomBytes(8).toString("base64url");
}

export async function saveTripPlan(plan: TripPlan, id?: string): Promise<string> {
  const tripId = id ?? newTripId();
  const client = getClient();
  if (client) {
    const { error } = await client.from("trips").upsert(
      {
        id: tripId,
        plan,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    );
    if (error) {
      console.error("supabase trips upsert error:", error);
      throw new Error(`Failed to save trip: ${error.message}`);
    }
  } else {
    memoryStore.set(tripId, plan);
  }
  return tripId;
}

export async function loadTripPlan(id: string): Promise<TripPlan | null> {
  const client = getClient();
  if (client) {
    const { data, error } = await client
      .from("trips")
      .select("plan")
      .eq("id", id)
      .maybeSingle();
    if (error) {
      console.error("supabase trips select error:", error);
      return null;
    }
    return (data?.plan as TripPlan | undefined) ?? null;
  }
  return memoryStore.get(id) ?? null;
}
