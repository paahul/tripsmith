import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function GET(req: Request) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "ADMIN_SECRET not configured" }, { status: 503 });
  }

  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (token !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  // Default to today in UTC; accept ?date=YYYY-MM-DD to query any day.
  const date = searchParams.get("date") ?? new Date().toISOString().slice(0, 10);
  const dayStart = `${date}T00:00:00.000Z`;
  const dayEnd = `${date}T23:59:59.999Z`;

  const client = getServiceClient();
  if (!client) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  const [tripsCreated, tripsRefined, tripsTotal, usersCreated, usersTotal] = await Promise.all([
    // Trips generated today
    client
      .from("trips")
      .select("id, plan, user_id", { count: "exact" })
      .gte("created_at", dayStart)
      .lte("created_at", dayEnd),

    // Trips refined today (updated but not first-created today)
    client
      .from("trips")
      .select("id", { count: "exact", head: true })
      .gte("updated_at", dayStart)
      .lte("updated_at", dayEnd)
      .lt("created_at", dayStart),

    // Total trips ever
    client.from("trips").select("id", { count: "exact", head: true }),

    // New signups today
    client.auth.admin.listUsers({ perPage: 1000 }),

    // Total users ever (same call — we'll split below)
    Promise.resolve(null),
  ]);

  // Count signups from listUsers (admin API doesn't support date-filtered counts directly)
  const allUsers = usersCreated.data?.users ?? [];
  const newUsersToday = allUsers.filter((u: { created_at?: string }) => {
    const created = u.created_at ?? "";
    return created >= dayStart && created <= dayEnd;
  });
  const lastSignInToday = allUsers.filter((u: { last_sign_in_at?: string }) => {
    const lastSeen = u.last_sign_in_at ?? "";
    return lastSeen >= dayStart && lastSeen <= dayEnd;
  });

  // Extract destinations from trips created today
  const createdRows = tripsCreated.data ?? [];
  const destinations = createdRows.map((row: { plan: { destination?: string } | null }) => {
    return row.plan?.destination ?? "unknown";
  });
  const destinationCounts = destinations.reduce<Record<string, number>>((acc: Record<string, number>, d: string) => {
    acc[d] = (acc[d] ?? 0) + 1;
    return acc;
  }, {});

  return NextResponse.json({
    date,
    trips: {
      created: tripsCreated.count ?? 0,
      refined: tripsRefined.count ?? 0,
      totalAllTime: tripsTotal.count ?? 0,
      destinations: destinationCounts,
    },
    users: {
      signedUpToday: newUsersToday.length,
      activeToday: lastSignInToday.length,
      totalAllTime: allUsers.length,
    },
  });
}
