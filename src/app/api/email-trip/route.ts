import { NextResponse } from "next/server";
import { Resend } from "resend";
import { tripPlanToHtml } from "@/lib/email";
import type { TripPlan } from "@/lib/types";

export const runtime = "nodejs";

const FROM = process.env.EMAIL_FROM || "tripsmith <onboarding@resend.dev>";

export async function POST(req: Request) {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Email not configured. Set RESEND_API_KEY." },
        { status: 500 },
      );
    }

    const { to, plan } = (await req.json()) as { to: string; plan: TripPlan };

    if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
      return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
    }
    if (!plan?.destination) {
      return NextResponse.json({ error: "Missing trip plan." }, { status: 400 });
    }

    const resend = new Resend(apiKey);
    const html = tripPlanToHtml(plan);
    const subject = `Your trip to ${plan.destination}`;

    const { data, error } = await resend.emails.send({
      from: FROM,
      to,
      subject,
      html,
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ id: data?.id, ok: true });
  } catch (err) {
    console.error("email-trip error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
