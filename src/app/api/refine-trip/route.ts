import { NextResponse } from "next/server";
import { refineTripPlan } from "@/lib/claude";
import type { TripPlan } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { currentPlan: TripPlan; tweak: string };
    const { currentPlan, tweak } = body;

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
    return NextResponse.json(updated);
  } catch (err) {
    console.error("refine-trip error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
