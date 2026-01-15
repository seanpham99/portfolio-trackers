/**
 * Connection Modal Component
 * Modal form for entering API key and secret
 * Story: 2.7 Connection Settings
 */

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Alert, AlertDescription } from "@workspace/ui/components/alert";
import { Loader2, ShieldCheck, AlertCircle, CheckCircle2 } from "lucide-react";
import { ExchangeId } from "@workspace/api-types";
import { useValidateConnection, useCreateConnection } from "./use-connections";

const EXCHANGE_NAMES: Record<ExchangeId, string> = {
  [ExchangeId.BINANCE]: "Binance",
  [ExchangeId.OKX]: "OKX",
};

const connectionSchema = z.object({
  apiKey: z.string().min(1, "API Key is required"),
  apiSecret: z.string().min(1, "API Secret is required"),
});

type ConnectionFormData = z.infer<typeof connectionSchema>;

interface ConnectionModalProps {
  exchange: ExchangeId | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function ConnectionModal({
  exchange,
  open,
  onOpenChange,
  onSuccess,
}: ConnectionModalProps) {
  const [validationState, setValidationState] = useState<
    "idle" | "validating" | "valid" | "invalid"
  >("idle");
  const [validationError, setValidationError] = useState<string | null>(null);

  const validateMutation = useValidateConnection();
  const createMutation = useCreateConnection();

  const {
    register,
    handleSubmit,
    reset,
    getValues,
    formState: { errors },
  } = useForm<ConnectionFormData>({
    resolver: zodResolver(connectionSchema),
  });

  const handleClose = () => {
    reset();
    setValidationState("idle");
    setValidationError(null);
    onOpenChange(false);
  };

  const handleTestConnection = async () => {
    if (!exchange) return;

    const values = getValues();
    if (!values.apiKey || !values.apiSecret) {
      setValidationError("Please fill in both API Key and Secret");
      return;
    }

    setValidationState("validating");
    setValidationError(null);

    try {
      const result = await validateMutation.mutateAsync({
        exchange,
        apiKey: values.apiKey,
        apiSecret: values.apiSecret,
      });

      if (result.valid) {
        setValidationState("valid");
      } else {
        setValidationState("invalid");
        setValidationError(result.error || "Validation failed");
      }
    } catch (err: any) {
      setValidationState("invalid");
      setValidationError(err.message || "Connection test failed");
    }
  };

  const onSubmit = async (data: ConnectionFormData) => {
    if (!exchange) return;

    try {
      await createMutation.mutateAsync({
        exchange,
        apiKey: data.apiKey,
        apiSecret: data.apiSecret,
      });
      handleClose();
      onSuccess?.();
    } catch (err) {
      // Error is handled by mutation state
    }
  };

  if (!exchange) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-106.25">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Connect {EXCHANGE_NAMES[exchange]}
          </DialogTitle>
          <DialogDescription>
            Enter your read-only API credentials. We only need access to view
            your balances.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key</Label>
            <Input
              id="apiKey"
              placeholder="Enter your API Key"
              autoComplete="off"
              {...register("apiKey")}
            />
            {errors.apiKey && (
              <p className="text-sm text-destructive">
                {errors.apiKey.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="apiSecret">API Secret</Label>
            <Input
              id="apiSecret"
              type="password"
              placeholder="Enter your API Secret"
              autoComplete="off"
              {...register("apiSecret")}
            />
            {errors.apiSecret && (
              <p className="text-sm text-destructive">
                {errors.apiSecret.message}
              </p>
            )}
          </div>

          {/* Validation feedback */}
          {validationState === "valid" && (
            <Alert className="border-green-500/50 bg-green-500/10">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-500">
                Connection verified successfully!
              </AlertDescription>
            </Alert>
          )}

          {(validationState === "invalid" || createMutation.isError) && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {validationError ||
                  createMutation.error?.message ||
                  "Failed to connect"}
              </AlertDescription>
            </Alert>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={handleTestConnection}
              disabled={validateMutation.isPending}
            >
              {validateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing...
                </>
              ) : (
                "Test Connection"
              )}
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Connection"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
