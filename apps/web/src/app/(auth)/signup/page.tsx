"use client";

import { useActionState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Loader2, Mail, Lock, User } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@workspace/ui/components/card";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { signup, signInWithGoogle } from "../login/actions";

const signupSchema = z
  .object({
    email: z.string().email("Please enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type SignupFormData = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const prefersReducedMotion = useReducedMotion();
  const [state, formAction, isPending] = useActionState(signup, { error: null });

  const form = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: { email: "", password: "", confirmPassword: "" },
    mode: "onBlur",
  });

  const cardVariants = prefersReducedMotion
    ? { initial: { opacity: 1 }, animate: { opacity: 1 } }
    : {
        initial: { opacity: 0, scale: 0.95 },
        animate: { opacity: 1, scale: 1 },
      };

  return (
    <motion.div
      {...cardVariants}
      transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.4, ease: "easeOut" }}
      className="w-full"
    >
      <Card className="glass-card overflow-hidden">
        <CardHeader className="space-y-1 pb-6 pt-8 text-center">
          <CardTitle className="font-serif text-2xl font-light text-foreground tracking-tight">
            Create account
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Start tracking your portfolio today
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-8 px-8">
          {/* Google OAuth Button */}
          <form action={signInWithGoogle} className="mb-6">
            <Button
              type="submit"
              variant="outline"
              className="relative w-full h-11 border-border bg-overlay-light text-foreground hover:bg-overlay-medium transition-all duration-300 group"
              disabled={isPending}
            >
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
              Continue with Google
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground tracking-widest">
                Or create with email
              </span>
            </div>
          </div>

          {/* Signup Form */}
          <form action={formAction} className="space-y-5">
            <Controller
              name="email"
              control={form.control}
              render={({ field, fieldState }) => (
                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="text-muted-foreground font-normal">
                    Email
                  </Label>
                  <div className="relative">
                    <Input
                      {...field}
                      id="signup-email"
                      name="email"
                      type="email"
                      placeholder="name@example.com"
                      autoComplete="email"
                      className="pl-10 h-11 border-border bg-overlay-light text-foreground"
                    />
                    <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  </div>
                  {fieldState.error && (
                    <p className="text-sm text-destructive">{fieldState.error.message}</p>
                  )}
                </div>
              )}
            />

            <Controller
              name="password"
              control={form.control}
              render={({ field, fieldState }) => (
                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="text-muted-foreground font-normal">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      {...field}
                      id="signup-password"
                      name="password"
                      type="password"
                      autoComplete="new-password"
                      className="pl-10 h-11 border-border bg-overlay-light text-foreground"
                    />
                    <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  </div>
                  {fieldState.error && (
                    <p className="text-sm text-destructive">{fieldState.error.message}</p>
                  )}
                </div>
              )}
            />

            <Controller
              name="confirmPassword"
              control={form.control}
              render={({ field, fieldState }) => (
                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className="text-muted-foreground font-normal">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Input
                      {...field}
                      id="confirm-password"
                      type="password"
                      autoComplete="new-password"
                      className="pl-10 h-11 border-border bg-overlay-light text-foreground"
                    />
                    <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  </div>
                  {fieldState.error && (
                    <p className="text-sm text-destructive">{fieldState.error.message}</p>
                  )}
                </div>
              )}
            />

            {state?.error && (
              <div
                role="alert"
                className="rounded-md bg-rose-500/10 border border-rose-500/20 px-3 py-2 text-sm text-rose-400"
              >
                {state.error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-11 bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <span className="flex items-center justify-center">
                  Create Account <ArrowRight className="ml-2 h-4 w-4" />
                </span>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-emerald-400 hover:text-emerald-300 font-medium">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
