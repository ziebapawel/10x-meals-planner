import { createSupabaseServerInstance } from "../db/supabase.client.ts";
import { defineMiddleware } from "astro:middleware";

// Public paths - Auth pages and API endpoints
const PUBLIC_PATHS = [
  // Server-Rendered Astro Pages
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
];

const PUBLIC_API_PREFIXES = ["/api/auth/"];

function isPublicPath(pathname: string): boolean {
  // Check if path is in PUBLIC_PATHS
  if (PUBLIC_PATHS.includes(pathname)) {
    return true;
  }

  // Check if path starts with any PUBLIC_API_PREFIXES
  return PUBLIC_API_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export const onRequest = defineMiddleware(async ({ locals, cookies, url, request, redirect }, next) => {
  const supabase = createSupabaseServerInstance({
    cookies,
    headers: request.headers,
  });

  // Store supabase instance in locals for use in API routes and pages
  locals.supabase = supabase;

  // IMPORTANT: Always get user session first before any other operations
  const {
    data: { user },
  } = await supabase.auth.getUser();

    // Store user in locals if authenticated
    if (user && user.email) {
      locals.user = {
        email: user.email,
        id: user.id,
      };
    } else {
      locals.user = null;
    }

  // If user is authenticated and tries to access auth pages, redirect to home
  if (user && ["/login", "/register"].includes(url.pathname)) {
    return redirect("/");
  }

  // If user is not authenticated and tries to access protected routes, redirect to login
  if (!user && !isPublicPath(url.pathname)) {
    return redirect("/login");
  }

  return next();
});
