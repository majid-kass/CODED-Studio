import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

// POST /auth/signout — clears the Supabase session cookies and redirects home.
export async function POST(req: Request) {
  const supabase = await supabaseServer();
  await supabase.auth.signOut();
  const url = new URL("/", req.url);
  return NextResponse.redirect(url, { status: 303 });
}
