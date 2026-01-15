"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Loader2, Mail, Lock } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { login, signInWithGoogle } from "./actions";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const prefersReducedMotion = useReducedMotion();
  const searchParams = useSearchParams();
  const message = searchParams.get("message");

  const [state, formAction, isPending] = useActionState(login, { error: null });

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
    mode: "onBlur",
  });

  const cardVariants = prefersReducedMotion
    ? { initial: { opacity: 1 }, animate: { opacity: 1 } }
    : {
        initial: { opacity: 0, scale: 0.95, y: 10 },
        animate: { opacity: 1, scale: 1, y: 0 },
      };

  return (
    <motion.div
      {...cardVariants}
      transition={
        prefersReducedMotion ? { duration: 0 } : { duration: 0.4, ease: [0.16, 1, 0.3, 1] }
      }
      className="w-full"
    >
      <div className="flex flex-col space-y-2 text-center mb-6">
        <h1 className="text-2xl font-serif font-light text-white tracking-tight">Welcome back</h1>
        <p className="text-sm text-zinc-400">Sign in to access your portfolio</p>
      </div>

      <div className="space-y-6">
        {/* Google OAuth Button */}
        <form action={signInWithGoogle}>
          <Button
            type="submit"
            variant="outline"
            className="relative w-full h-11 border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white hover:border-white/20 transition-all duration-300 group"
            disabled={isPending}
          >
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-emerald-500/10 via-transparent to-emerald-500/10" />
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {isPending ? "Connecting..." : "Continue with Google"}
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-white/10" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-medium">
            <span className="bg-[#09090b] px-3 text-zinc-500">Or continue with email</span>
          </div>
        </div>

        {/* Email/Password Form */}
        <form action={formAction} className="space-y-4">
          <Controller
            name="email"
            control={form.control}
            render={({ field, fieldState }) => (
              <div className="space-y-2">
                <Label htmlFor="login-email" className="text-xs font-medium text-zinc-400 ml-1">
                  Email
                </Label>
                <div className="relative group">
                  <Input
                    {...field}
                    id="login-email"
                    name="email"
                    type="email"
                    placeholder="name@example.com"
                    autoComplete="email"
                    aria-invalid={fieldState.invalid}
                    className="pl-10 h-11 border-white/10 bg-white/5 text-white placeholder:text-zinc-600 focus:bg-white/10 focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all duration-300"
                  />
                  <Mail
                    className="absolute left-3 top-3 h-5 w-5 text-zinc-500 group-focus-within:text-emerald-500 transition-colors duration-300 pointer-events-none"
                    aria-hidden="true"
                  />
                </div>
                {fieldState.error && (
                  <p className="text-xs text-rose-400 ml-1 animate-in slide-in-from-left-1">
                    {fieldState.error.message}
                  </p>
                )}
              </div>
            )}
          />

          <Controller
            name="password"
            control={form.control}
            render={({ field, fieldState }) => (
              <div className="space-y-2">
                <div className="flex items-center justify-between ml-1">
                  <Label htmlFor="login-password" className="text-xs font-medium text-zinc-400">
                    Password
                  </Label>
                  <Link
                    href="/forgot-password"
                    className="text-xs text-zinc-500 hover:text-emerald-400 transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative group">
                  <Input
                    {...field}
                    id="login-password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    aria-invalid={fieldState.invalid}
                    className="pl-10 h-11 border-white/10 bg-white/5 text-white placeholder:text-zinc-600 focus:bg-white/10 focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all duration-300"
                  />
                  <Lock
                    className="absolute left-3 top-3 h-5 w-5 text-zinc-500 group-focus-within:text-emerald-500 transition-colors duration-300 pointer-events-none"
                    aria-hidden="true"
                  />
                </div>
                {fieldState.error && (
                  <p className="text-xs text-rose-400 ml-1 animate-in slide-in-from-left-1">
                    {fieldState.error.message}
                  </p>
                )}
              </div>
            )}
          />

          {/* Server error */}
          {state?.error && (
            <div
              role="alert"
              aria-live="polite"
              className="rounded-lg bg-rose-500/10 border border-rose-500/20 px-4 py-3 text-sm text-rose-400 flex items-center gap-2"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />
              {state.error}
            </div>
          )}

          {/* Consent required message */}
          {message === "consent_required" && (
            <div
              role="alert"
              aria-live="polite"
              className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 text-sm text-emerald-400"
            >
              Privacy consent is required. Please sign in again.
            </div>
          )}

          <Button
            type="submit"
            className="w-full h-11 mt-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium tracking-wide shadow-lg shadow-emerald-900/40 hover:shadow-emerald-900/60 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <span className="flex items-center justify-center">
                Sign In <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </span>
            )}
          </Button>
        </form>

        <div className="mt-8 text-center text-sm text-zinc-500">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors hover:underline decoration-emerald-500/30 underline-offset-4"
          >
            Create one now
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
