import { NextResponse } from "next/server";
import { Resend } from "resend";
import { tripPlanToHtml } from "@/lib/email";
import type { TripPlan } from "@/lib/types";

export const runtime = "nodejs";

const FROM = process.env.EMAIL_FROM || "Tripsmith <trips@paahulhq.com>";

function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Email not configured. Set RESEND_API_KEY." },
        { status: 500 },
      );
    }

    const { plan, shareUrl, to } = (await req.json()) as {
      plan: TripPlan;
      shareUrl?: string;
      to?: string;
    };

    if (!plan?.destination) {
      return NextResponse.json({ error: "Missing trip plan." }, { status: 400 });
    }

    if (!to || typeof to !== "string" || !isValidEmail(to.trim())) {
      return NextResponse.json(
        { error: "A valid recipient email is required." },
        { status: 400 },
      );
    }
    const recipient = to.trim();

    const resend = new Resend(apiKey);
    const planHtml = tripPlanToHtml(plan);
    const html = shareUrl
      ? `<p style="font-family:sans-serif;font-size:14px;color:#666">View this trip online: <a href="${shareUrl}">${shareUrl}</a></p>${planHtml}`
      : planHtml;
    const subject = `tripsmith: ${plan.destination}`;

    const { data, error } = await resend.emails.send({
      from: FROM,
      to: recipient,
      subject,
      html,
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ id: data?.id, ok: true, sentTo: recipient });
  } catch (err) {
    console.error("email-trip error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
