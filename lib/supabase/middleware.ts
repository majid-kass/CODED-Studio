import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type CookieToSet = { name: string; value: string; options: CookieOptions };

// Refresh the Supabase session on every request that goes through middleware,
// and gate the protected routes. This pattern is the canonical Supabase SSR
// setup: we have to relay cookie reads/writes between Supabase and the response.
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }: CookieToSet) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }: CookieToSet) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANT: do not put any other logic between createServerClient and
  // getUser — Supabase recommends this exact ordering to keep the session fresh.
  const { data: { user } } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isProtected =
    pathname.startsWith("/queue") ||
    pathname.startsWith("/api/render") ||
    pathname.startsWith("/api/render-video") ||
    pathname.startsWith("/api/render-carousel") ||
    pathname.startsWith("/api/walkthrough");

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // If a signed-in user hits sign-in/sign-up, bounce them to /queue.
  if ((pathname === "/sign-in" || pathname === "/sign-up") && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/queue";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}
