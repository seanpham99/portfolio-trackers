"use client";

import { useActionState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Loader2, Lock } from "lucide-react";
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
import { updatePassword } from "../login/actions";

export default function UpdatePasswordPage() {
  const prefersReducedMotion = useReducedMotion();
  const [state, formAction, isPending] = useActionState(updatePassword, { error: null });

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
            Update password
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Enter your new password
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-8 px-8">
          <form action={formAction} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="new-password" className="text-muted-foreground font-normal">
                New Password
              </Label>
              <div className="relative">
                <Input
                  id="new-password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  className="pl-10 h-11 border-border bg-overlay-light text-foreground"
                />
                <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-new-password" className="text-muted-foreground font-normal">
                Confirm Password
              </Label>
              <div className="relative">
                <Input
                  id="confirm-new-password"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="pl-10 h-11 border-border bg-overlay-light text-foreground"
                />
                <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
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
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
