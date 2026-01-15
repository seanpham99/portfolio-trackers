import * as React from "react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@workspace/ui/components/dialog";
import { Button } from "@workspace/ui/components/button";
import { ShieldCheck, ShieldAlert, Loader2 } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

interface PrivacyConsentModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  currentVersion: string;
  onAccept: () => Promise<void>;
  onDecline: () => void;
}

export function PrivacyConsentModal({
  isOpen,
  onOpenChange,
  currentVersion,
  onAccept,
  onDecline,
}: PrivacyConsentModalProps) {
  const prefersReducedMotion = useReducedMotion();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    setError(null);

    try {
      await onAccept();
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsPending(false);
    }
  };

  const motionVariants = prefersReducedMotion
    ? { initial: { opacity: 1 }, animate: { opacity: 1 } }
    : { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 } };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        className="border-white/10 bg-zinc-900/40 backdrop-blur-2xl shadow-2xl shadow-black/40 ring-1 ring-white/5 max-w-md p-0 overflow-hidden sm:rounded-2xl"
      >
        <motion.div
          {...motionVariants}
          transition={
            prefersReducedMotion ? { duration: 0 } : { duration: 0.3, ease: [0.16, 1, 0.3, 1] }
          }
          className="flex flex-col"
        >
          <DialogHeader className="px-8 pt-10 pb-6 flex flex-col items-center text-center space-y-0 relative">
            {/* Background glow for icon */}
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-emerald-500/10 to-transparent pointer-events-none" />

            <div className="relative flex justify-center mb-6">
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-900/20 border border-emerald-500/20 shadow-lg shadow-emerald-500/10">
                <ShieldCheck className="h-8 w-8 text-emerald-400" />
              </div>
            </div>
            <DialogTitle className="text-2xl font-serif font-light text-white tracking-tight mb-3">
              Privacy Matters
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-center text-balance leading-relaxed">
              To provide you with secure, institutional-grade analytics, we handle your data with
              the highest level of care.
            </DialogDescription>
          </DialogHeader>

          <div className="px-8 pb-8 space-y-5 text-sm">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 ring-1 ring-black/5">
              <p className="leading-relaxed text-zinc-300">
                By continuing, you agree to our processing of your personal data according to
                Vietnam&apos;s
                <span className="text-emerald-400 font-medium tracking-wide"> PDPL (2026)</span> and
                <span className="text-emerald-400 font-medium tracking-wide"> GDPR</span> standards.
              </p>
            </div>
            <ul className="space-y-3.5">
              <li className="flex items-start gap-3.5 group">
                <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0 group-hover:scale-125 transition-transform" />
                <span className="leading-relaxed text-zinc-400">
                  <span className="text-zinc-200 font-medium">Data Minimization:</span> We only
                  collect essential PII for portfolio tracking.
                </span>
              </li>
              <li className="flex items-start gap-3.5 group">
                <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0 group-hover:scale-125 transition-transform" />
                <span className="leading-relaxed text-zinc-400">
                  <span className="text-zinc-200 font-medium">Audit-Ready:</span> Your consent is
                  logged using secure, anonymized metadata.
                </span>
              </li>
              <li className="flex items-start gap-3.5 group">
                <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0 group-hover:scale-125 transition-transform" />
                <span className="leading-relaxed text-zinc-400">
                  <span className="text-zinc-200 font-medium">Your Rights:</span> You can export or
                  delete your data at any time.
                </span>
              </li>
            </ul>
          </div>

          <DialogFooter className="px-8 pb-8 pt-2 flex flex-col gap-3">
            <form onSubmit={handleSubmit} className="w-full">
              <input type="hidden" name="consent_version" value={currentVersion} />
              <Button
                type="submit"
                disabled={isPending}
                className="w-full h-12 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium shadow-lg shadow-emerald-900/40 hover:shadow-emerald-900/60 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 text-base"
              >
                {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : "Accept and Continue"}
              </Button>
            </form>
            <Button
              variant="ghost"
              onClick={onDecline}
              disabled={isPending}
              className="w-full h-11 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            >
              Decline and Sign Out
            </Button>
          </DialogFooter>

          {error && (
            <div className="mx-8 mb-8 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-3 text-sm text-rose-400 animate-in fade-in zoom-in-95 duration-300">
              <ShieldAlert className="h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
