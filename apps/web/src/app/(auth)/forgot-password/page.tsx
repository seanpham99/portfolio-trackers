"use client";

import { useActionState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, Loader2, Mail } from "lucide-react";
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
import { forgotPassword } from "../login/actions";

export default function ForgotPasswordPage() {
  const prefersReducedMotion = useReducedMotion();
  const [state, formAction, isPending] = useActionState(forgotPassword, { error: null });

  const cardVariants = prefersReducedMotion
    ? { initial: { opacity: 1 }, animate: { opacity: 1 } }
    : { initial: { opacity: 0, scale: 0.95 }, animate: { opacity: 1, scale: 1 } };

  return (
    <motion.div
      {...cardVariants}
      transition={{ duration: prefersReducedMotion ? 0 : 0.4 }}
      className="w-full"
    >
      <Card className="glass-card overflow-hidden">
        <CardHeader className="space-y-1 pb-6 pt-8 text-center">
          <CardTitle className="font-serif text-2xl font-light text-foreground tracking-tight">
            Reset password
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Enter your email and we&apos;ll send you a reset link
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-8 px-8">
          <form action={formAction} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="reset-email" className="text-muted-foreground font-normal">
                Email
              </Label>
              <div className="relative">
                <Input
                  id="reset-email"
                  name="email"
                  type="email"
                  placeholder="name@example.com"
                  autoComplete="email"
                  required
                  className="pl-10 h-11 border-border bg-overlay-light text-foreground"
                />
                <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              </div>
            </div>

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
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send Reset Link"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="text-sm text-muted-foreground hover:text-emerald-400 inline-flex items-center"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to login
            </Link>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
