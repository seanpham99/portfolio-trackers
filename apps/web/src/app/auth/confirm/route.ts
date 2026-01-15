import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = searchParams.get("next") ?? "/dashboard";

  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      type: type as "signup" | "recovery" | "email",
      token_hash,
    });

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }

    console.error("Email confirm error:", error.message);
  }

  // Confirmation error - redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=Could not verify email`);
}
