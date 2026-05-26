import { NextResponse } from "next/server";
import { refineTripPlan } from "@/lib/claude";
import { saveTripPlan } from "@/lib/tripStore";
import type { TripPlan } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      currentPlan: TripPlan;
      tweak: string;
      id?: string;
    };
    const { currentPlan, tweak, id } = body;

    if (!currentPlan?.destination) {
      return NextResponse.json({ error: "Missing current plan." }, { status: 400 });
    }
    if (!tweak || tweak.trim().length === 0) {
      return NextResponse.json({ error: "Tell me what to change." }, { status: 400 });
    }
    if (tweak.length > 1000) {
      return NextResponse.json(
        { error: "Tweak request is too long. Keep it under 1000 characters." },
        { status: 400 },
      );
    }

    const updated = await refineTripPlan({ currentPlan, tweak });
    // Preserve the hero image — claude doesn't return it on refine.
    const withHero = { ...updated, heroImage: currentPlan.heroImage };
    const savedId = await saveTripPlan(withHero, id);
    return NextResponse.json({ ...withHero, id: savedId });
  } catch (err) {
    console.error("refine-trip error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
