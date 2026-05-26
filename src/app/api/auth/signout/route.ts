import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const supabase = await getSupabaseServer();
  await supabase.auth.signOut();
  const { origin } = new URL(req.url);
  return NextResponse.redirect(`${origin}/`, { status: 303 });
}
