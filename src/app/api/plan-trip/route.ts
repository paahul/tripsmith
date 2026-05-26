import { NextResponse } from "next/server";
import { getWeather } from "@/lib/openweather";
import { generateTripPlan } from "@/lib/claude";
import { getHeroImage } from "@/lib/unsplash";
import { saveTripPlan } from "@/lib/tripStore";
import { MAX_TRIP_DAYS, tripLengthDays, type Profile, type TripRequest } from "@/lib/types";

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

    const days = tripLengthDays(trip.startDate, trip.endDate);
    if (days < 1) {
      return NextResponse.json(
        { error: "End date must be on or after the start date." },
        { status: 400 },
      );
    }
    if (days > MAX_TRIP_DAYS) {
      return NextResponse.json(
        {
          error: `Maximum ${MAX_TRIP_DAYS} days per plan. Pick a shorter range, or plan multi-leg trips separately.`,
        },
        { status: 400 },
      );
    }

    const [weather, heroImage] = await Promise.all([
      getWeather(trip.destination).catch(() => null),
      getHeroImage(trip.destination).catch(() => null),
    ]);

    const plan = await generateTripPlan({
      profile,
      request: trip,
      weather,
    });

    const fullPlan = { ...plan, heroImage };
    const id = await saveTripPlan(fullPlan);
    return NextResponse.json({ ...fullPlan, id });
  } catch (err) {
    console.error("plan-trip error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
