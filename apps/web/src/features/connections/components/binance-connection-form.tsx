"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { useCreateConnection, useValidateConnection } from "../hooks/use-connections";
import { Loader2, CheckCircle2, AlertCircle, Eye, EyeOff } from "lucide-react";

interface BinanceConnectionFormProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BinanceConnectionForm({ isOpen, onClose }: BinanceConnectionFormProps) {
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [isValidated, setIsValidated] = useState(false);

  const createMutation = useCreateConnection();
  const validateMutation = useValidateConnection();

  const handleValidate = () => {
    if (!apiKey || !apiSecret) return;

    validateMutation.mutate(
      {
        exchange: "binance",
        apiKey,
        apiSecret,
      },
      {
        onSuccess: (result) => {
          if (result.valid) {
            setIsValidated(true);
          }
        },
      }
    );
  };

  const handleSubmit = () => {
    createMutation.mutate(
      {
        exchange: "binance",
        apiKey,
        apiSecret,
      },
      {
        onSuccess: () => {
          onClose();
          resetForm();
        },
      }
    );
  };

  const resetForm = () => {
    setApiKey("");
    setApiSecret("");
    setIsValidated(false);
    setShowSecret(false);
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <img src="/icons/binance.svg" alt="Binance" className="h-6 w-6" />
            Connect Binance
          </DialogTitle>
          <DialogDescription>
            Enter your Binance API credentials. Use <strong>read-only</strong> permissions for
            security.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="api-key">API Key</Label>
            <Input
              id="api-key"
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                setIsValidated(false);
              }}
              placeholder="Your Binance API Key"
              className="font-mono text-sm"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="api-secret">API Secret</Label>
            <div className="relative">
              <Input
                id="api-secret"
                type={showSecret ? "text" : "password"}
                value={apiSecret}
                onChange={(e) => {
                  setApiSecret(e.target.value);
                  setIsValidated(false);
                }}
                placeholder="Your Binance API Secret"
                className="font-mono text-sm pr-10"
              />
              <button
                type="button"
                onClick={() => setShowSecret(!showSecret)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Status Messages */}
          {validateMutation.isPending && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Validating credentials with Binance...
            </div>
          )}

          {isValidated && (
            <div className="flex items-center text-sm text-emerald-500">
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Credentials validated successfully!
            </div>
          )}

          {validateMutation.isError && (
            <div className="flex items-center text-sm text-red-500">
              <AlertCircle className="mr-2 h-4 w-4" />
              {validateMutation.error?.message || "Validation failed"}
            </div>
          )}

          {createMutation.isPending && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating connection and syncing balances...
            </div>
          )}

          {/* Security Notice */}
          <div className="rounded-md bg-amber-50 dark:bg-amber-950/30 p-3 text-sm text-amber-800 dark:text-amber-200">
            <strong>Security Tip:</strong> Create an API key with only "Read-Only" permissions.
            Never grant withdrawal rights.
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          {!isValidated ? (
            <Button
              onClick={handleValidate}
              disabled={!apiKey || !apiSecret || validateMutation.isPending}
            >
              {validateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Validate
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Connect & Sync
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
