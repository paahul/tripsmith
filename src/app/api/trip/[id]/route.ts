import { NextResponse } from "next/server";
import { loadTripPlan, saveTripPlan } from "@/lib/tripStore";
import type { TripPlan } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }
  const plan = await loadTripPlan(id);
  if (!plan) {
    return NextResponse.json({ error: "Trip not found" }, { status: 404 });
  }
  return NextResponse.json(plan);
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }
  const plan = (await req.json()) as TripPlan;
  if (!plan?.destination) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }
  await saveTripPlan(plan, id);
  return NextResponse.json({ ok: true, id });
}
