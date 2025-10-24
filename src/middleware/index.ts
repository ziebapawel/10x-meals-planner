import { createSupabaseServerInstance } from "../db/supabase.client.ts";
import { defineMiddleware } from "astro:middleware";

// Protected paths that require authentication
const PROTECTED_PATHS = ["/generate", "/plans"];

function isProtectedPath(pathname: string): boolean {
  // Check if path is in PROTECTED_PATHS
  if (PROTECTED_PATHS.includes(pathname)) {
    return true;
  }

  // Check if path starts with /plans/ (for plan details)
  return pathname.startsWith("/plans/");
}

export const onRequest = defineMiddleware(async ({ locals, cookies, url, request, redirect }, next) => {
  const supabase = createSupabaseServerInstance({
    cookies,
    headers: request.headers,
    runtime: locals.runtime, // Pass runtime if available (Cloudflare), undefined locally
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

  // If user is authenticated and tries to access auth pages, redirect to homepage (meal plans list)
  if (user && ["/login", "/register"].includes(url.pathname)) {
    return redirect("/");
  }

  // If user is not authenticated and tries to access protected routes, redirect to login
  if (!user && isProtectedPath(url.pathname)) {
    return redirect("/login");
  }

  return next();
});
