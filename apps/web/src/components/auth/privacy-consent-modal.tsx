import * as React from "react"
import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@repo/ui/components/dialog"
import { Button } from "@repo/ui/components/button"
import { ShieldCheck, ShieldAlert, Loader2 } from "lucide-react"
import { motion, useReducedMotion } from "framer-motion"

interface PrivacyConsentModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  currentVersion: string
  onAccept: () => Promise<void>
  onDecline: () => void
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
      setError('An unexpected error occurred');
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
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 border-white/10 bg-zinc-900/60 backdrop-blur-2xl shadow-2xl ring-1 ring-white/5 max-w-md p-0 overflow-hidden"
      >
        <motion.div
          {...motionVariants}
          transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.2, ease: "easeOut" }}
          className="p-6 md:p-8 flex flex-col items-center"
        >
          <DialogHeader className="mb-6 flex flex-col items-center text-center">
            <div className="flex justify-center mb-6">
              <div className="p-3 rounded-full bg-emerald-500/10 ring-1 ring-emerald-500/20">
                <ShieldCheck className="h-8 w-8 text-emerald-500" />
              </div>
            </div>
            <DialogTitle className="text-2xl font-serif font-light text-center text-white tracking-tight">
              Privacy Matters
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-center text-balance mt-2">
              To provide you with secure, institutional-grade analytics, we handle your data with the highest level of care.
            </DialogDescription>
          </DialogHeader>

          <div className="w-full space-y-4 mb-8 text-sm text-zinc-300">
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <p className="leading-relaxed">
                By continuing, you agree to our processing of your personal data according to Vietnam&apos;s 
                <span className="text-emerald-400 font-medium"> PDPL (2026)</span> and 
                <span className="text-emerald-400 font-medium"> GDPR</span> standards.
              </p>
            </div>
            <ul className="space-y-2 px-1">
              <li className="flex items-start gap-3">
                <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span><span className="text-white font-medium">Data Minimization:</span> We only collect essential PII for portfolio tracking.</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span><span className="text-white font-medium">Audit-Ready:</span> Your consent is logged using secure, anonymized metadata.</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span><span className="text-white font-medium">Your Rights:</span> You can export or delete your data at any time.</span>
              </li>
            </ul>
          </div>

          <DialogFooter className="flex-col sm:flex-col gap-3">
            <form onSubmit={handleSubmit} className="w-full">
              <input type="hidden" name="consent_version" value={currentVersion} />
              <Button 
                type="submit"
                disabled={isPending}
                className="w-full h-11 bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-lg shadow-emerald-900/20"
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Accept and Continue"
                )}
              </Button>
            </form>
            <Button 
              variant="ghost" 
              onClick={onDecline}
              disabled={isPending}
              className="w-full h-11 text-zinc-500 hover:text-rose-400 hover:bg-rose-400/5"
            >
              Decline and Sign Out
            </Button>
          </DialogFooter>

          {error && (
            <div className="mt-4 p-3 rounded-md bg-rose-500/10 border border-rose-500/20 flex items-center gap-2 text-sm text-rose-400 animate-in fade-in duration-300">
              <ShieldAlert className="h-4 w-4" />
              {error}
            </div>
          )}
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}
