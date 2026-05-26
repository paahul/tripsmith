import { randomBytes } from "crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { TripPlan } from "./types";

// In-memory fallback for local dev when Supabase env vars aren't set.
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
  return randomBytes(8).toString("base64url");
}

export async function saveTripPlan(
  plan: TripPlan,
  options: { id?: string; userId?: string } = {},
): Promise<string> {
  const tripId = options.id ?? newTripId();
  const client = getClient();
  if (client) {
    const row: Record<string, unknown> = {
      id: tripId,
      plan,
      updated_at: new Date().toISOString(),
    };
    // Only set user_id when explicitly provided. Refines pass undefined so
    // ownership stays as-is (don't overwrite to null on refine).
    if (options.userId !== undefined) {
      row.user_id = options.userId;
    }
    const { error } = await client.from("trips").upsert(row, { onConflict: "id" });
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

export type TripSummary = {
  id: string;
  destination: string;
  summary: string;
  updatedAt: string;
};

export async function listTripsForUser(userId: string): Promise<TripSummary[]> {
  const client = getClient();
  if (!client) return [];
  const { data, error } = await client
    .from("trips")
    .select("id, plan, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(50);
  if (error) {
    console.error("supabase trips list error:", error);
    return [];
  }
  return (data ?? []).map((row) => {
    const plan = row.plan as TripPlan;
    return {
      id: row.id as string,
      destination: plan.destination,
      summary: plan.summary,
      updatedAt: row.updated_at as string,
    };
  });
}
