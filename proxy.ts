import { NextResponse, type NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const hasSupabaseConfig = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  if (!hasSupabaseConfig) return NextResponse.next();

  const hasSessionCookie = request.cookies
    .getAll()
    .some((cookie) => cookie.name.startsWith("sb-") && cookie.name.endsWith("-auth-token"));

  if (request.nextUrl.pathname.startsWith("/dashboard") && !hasSessionCookie) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
