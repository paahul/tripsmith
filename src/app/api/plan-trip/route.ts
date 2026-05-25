import { NextResponse } from "next/server";
import { getWeather } from "@/lib/openweather";
import { generateTripPlan } from "@/lib/claude";
import type { Profile, TripRequest } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { profile: Profile; request: TripRequest };
    const { profile, request: trip } = body;

    if (!profile?.homeAirport) {
      return NextResponse.json(
        { error: "Profile missing homeAirport. Set it in /profile." },
        { status: 400 },
      );
    }
    if (!trip?.destination || !trip?.startDate || !trip?.endDate) {
      return NextResponse.json({ error: "Missing destination or dates." }, { status: 400 });
    }

    const weather = await getWeather(trip.destination).catch(() => null);

    const plan = await generateTripPlan({
      profile,
      request: trip,
      weather,
    });

    return NextResponse.json(plan);
  } catch (err) {
    console.error("plan-trip error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
