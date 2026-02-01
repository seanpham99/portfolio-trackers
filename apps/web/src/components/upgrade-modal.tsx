"use client";

import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { TierValidationError } from "@workspace/shared-types";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  error: TierValidationError;
}

export function UpgradeModal({ isOpen, onClose, error }: UpgradeModalProps) {
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-zinc-900 border-white/8 text-white">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl font-light">Upgrade Required</DialogTitle>
          <DialogDescription className="text-zinc-500">{error.message}</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p>
            Your current plan is limited to {error.limit} portfolio(s). Please upgrade to the PRO
            plan to create unlimited portfolios and track more assets.
          </p>
        </div>
        <DialogFooter className="pt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="text-zinc-400 hover:text-white hover:bg-white/5"
          >
            Cancel
          </Button>
          <Button type="button" className="bg-emerald-600 text-white hover:bg-emerald-500">
            Upgrade to PRO
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
