import { redirect } from "react-router";
import { createClient } from "@/lib/supabase/server";

/**
 * Require authentication in a route loader.
 * Redirects to /login if user is not authenticated.
 * Returns the authenticated user if successful.
 */
export async function requireAuth(request: Request) {
  const { supabase } = createClient(request);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Store the intended destination to redirect back after login
    const url = new URL(request.url);
    const redirectTo = url.pathname + url.search;

    throw redirect(`/login?redirectTo=${encodeURIComponent(redirectTo)}`);
  }

  return user;
}

/**
 * Get the current user without requiring authentication.
 * Returns null if user is not authenticated.
 */
export async function getUser(request: Request) {
  const { supabase } = createClient(request);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}
