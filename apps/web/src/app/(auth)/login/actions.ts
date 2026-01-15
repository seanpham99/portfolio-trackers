"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export type LoginState = {
  error: string | null;
};

export async function login(prevState: LoginState, formData: FormData): Promise<LoginState> {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/dashboard");
}

export async function signInWithGoogle() {
  const supabase = await createClient();
  const headersList = await headers();
  const origin = headersList.get("origin") || "http://localhost:3001";

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    redirect("/login?error=" + encodeURIComponent(error.message));
  }

  if (data.url) {
    redirect(data.url);
  }

  redirect("/login?error=Failed to initiate Google sign-in");
}

export async function signup(prevState: LoginState, formData: FormData): Promise<LoginState> {
  const supabase = await createClient();
  const headersList = await headers();
  const origin = headersList.get("origin") || "http://localhost:3001";

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/confirm`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/login?message=Check your email for a confirmation link");
}

export async function forgotPassword(
  prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const supabase = await createClient();
  const headersList = await headers();
  const origin = headersList.get("origin") || "http://localhost:3001";

  const email = formData.get("email") as string;

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/update-password`,
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/login?message=Check your email for a password reset link");
}

export async function updatePassword(
  prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const supabase = await createClient();

  const password = formData.get("password") as string;

  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
