import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        request.cookies.set({
          name,
          value,
          ...options,
        });
        supabaseResponse = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        supabaseResponse.cookies.set({
          name,
          value,
          ...options,
        });
      },
      remove(name: string, options: CookieOptions) {
        request.cookies.set({
          name,
          value: "",
          ...options,
        });
        supabaseResponse = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        supabaseResponse.cookies.set({
          name,
          value: "",
          ...options,
        });
      },
    },
  });

  const { pathname } = request.nextUrl;

  // Static files and internal Next.js assets should be skipped
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/static") ||
    pathname.includes(".")
  ) {
    return supabaseResponse;
  }

  // Refresh auth session
  let user = null;
  // If credentials are placeholder or network fails, gracefully treat user as null
  if (
    supabaseUrl &&
    !supabaseUrl.includes("placeholder") &&
    supabaseAnonKey &&
    !supabaseAnonKey.includes("placeholder")
  ) {
    try {
      const { data } = await supabase.auth.getUser();
      user = data?.user ?? null;
    } catch {
      user = null;
    }
  }

  // 1. Root route: redirect based on auth status
  if (pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = user ? "/app/dashboard" : "/login";
    return NextResponse.redirect(url);
  }

  // 2. Protected routes: /app and /app/*
  if (pathname.startsWith("/app")) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirectTo", pathname);
      return NextResponse.redirect(url);
    }
  }

  // 3. Auth routes: /login
  if (pathname === "/login") {
    if (user) {
      const url = request.nextUrl.clone();
      url.pathname = "/app/dashboard";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
