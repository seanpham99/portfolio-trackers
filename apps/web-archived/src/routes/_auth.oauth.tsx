import { createClient } from "@/lib/supabase/server";
import { type LoaderFunctionArgs, redirect } from "react-router";

export async function loader({ request }: LoaderFunctionArgs) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/";
  const redirectTo = next.startsWith("/") ? next : "/";

  if (code) {
    const { supabase, headers } = createClient(request);
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return redirect(redirectTo, { headers });
    } else {
      return redirect(`/auth/error?error=${encodeURIComponent(error.message)}`);
    }
  }

  // No code provided - redirect to error page
  return redirect("/auth/error");
}
