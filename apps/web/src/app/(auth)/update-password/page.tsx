"use client";

import { useActionState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Loader2, Lock } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { updatePassword } from "../login/actions";

export default function UpdatePasswordPage() {
  const prefersReducedMotion = useReducedMotion();
  const [state, formAction, isPending] = useActionState(updatePassword, { error: null });

  const cardVariants = prefersReducedMotion
    ? { initial: { opacity: 1 }, animate: { opacity: 1 } }
    : { initial: { opacity: 0, scale: 0.95, y: 10 }, animate: { opacity: 1, scale: 1, y: 0 } };

  return (
    <motion.div
      {...cardVariants}
      transition={{ duration: prefersReducedMotion ? 0 : 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="w-full"
    >
      <div className="flex flex-col space-y-2 text-center mb-6">
        <h1 className="text-2xl font-serif font-light text-white tracking-tight">
          Update password
        </h1>
        <p className="text-sm text-zinc-400">Enter your new password</p>
      </div>

      <div className="space-y-6">
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-password" className="text-xs font-medium text-zinc-400 ml-1">
              New Password
            </Label>
            <div className="relative group">
              <Input
                id="new-password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                className="pl-10 h-11 border-white/10 bg-white/5 text-white placeholder:text-zinc-600 focus:bg-white/10 focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all duration-300"
              />
              <Lock className="absolute left-3 top-3 h-5 w-5 text-zinc-500 group-focus-within:text-emerald-500 transition-colors duration-300 pointer-events-none" />
            </div>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="confirm-new-password"
              className="text-xs font-medium text-zinc-400 ml-1"
            >
              Confirm Password
            </Label>
            <div className="relative group">
              <Input
                id="confirm-new-password"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                className="pl-10 h-11 border-white/10 bg-white/5 text-white placeholder:text-zinc-600 focus:bg-white/10 focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all duration-300"
              />
              <Lock className="absolute left-3 top-3 h-5 w-5 text-zinc-500 group-focus-within:text-emerald-500 transition-colors duration-300 pointer-events-none" />
            </div>
          </div>

          {state?.error && (
            <div
              role="alert"
              className="rounded-lg bg-rose-500/10 border border-rose-500/20 px-4 py-3 text-sm text-rose-400 flex items-center gap-2"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />
              {state.error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full h-11 mt-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium tracking-wide shadow-lg shadow-emerald-900/40 hover:shadow-emerald-900/60 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
            disabled={isPending}
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update Password"}
          </Button>
        </form>
      </div>
    </motion.div>
  );
}
