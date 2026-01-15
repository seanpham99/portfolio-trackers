import {
  useActionState,
  useState,
  useEffect,
  useOptimistic,
  useId,
} from "react";
import { AssetAutocomplete } from "./asset-autocomplete";
import { Assets } from "@workspace/database-types";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { cn } from "@workspace/ui/lib/utils";
import { apiFetch } from "@/lib/api";

interface Transaction {
  id: string;
  portfolio_id: string;
  asset_id: string;
  type: "BUY" | "SELL";
  quantity: number;
  price: number;
  fee: number;
  notes?: string;
  asset_symbol?: string; // For display purposes
}

// Action function
async function submitTransactionAction(prevState: any, formData: FormData) {
  const portfolioId = formData.get("portfolioId") as string;
  const assetId = formData.get("assetId") as string;
  const type = formData.get("type") as string;
  const quantity = formData.get("quantity");
  const price = formData.get("price");
  const fee = formData.get("fee");
  const notes = formData.get("notes");

  if (!assetId) {
    return { error: "Please select an asset" };
  }

  if (!quantity || Number(quantity) <= 0) {
    return { error: "Quantity must be greater than 0" };
  }

  if (!price || Number(price) <= 0) {
    return { error: "Price must be greater than 0" };
  }

  try {
    const res = await apiFetch(`/portfolios/${portfolioId}/transactions`, {
      method: "POST",
      body: JSON.stringify({
        portfolio_id: portfolioId,
        asset_id: assetId,
        type: type || "BUY",
        quantity: Number(quantity),
        price: Number(price),
        fee: Number(fee || 0),
        notes: notes ? String(notes) : undefined,
      }),
    });

    if (!res.ok) {
      let errMessage = "Failed to create transaction";
      try {
        const err = await res.json();
        errMessage = err.message || err.error || errMessage;
      } catch {
        /* ignore parse error */
      }
      return { error: errMessage };
    }

    const transaction = await res.json();
    return { success: true, transaction };
  } catch (e) {
    return { error: "Network error" };
  }
}

export function TransactionForm({
  portfolioId,
  onSuccess,
  existingTransactions = [],
}: {
  portfolioId: string;
  onSuccess?: (transaction: Transaction) => void;
  existingTransactions?: Transaction[];
}) {
  const [state, formAction, isPending] = useActionState(
    submitTransactionAction,
    null,
  );
  const [selectedAsset, setSelectedAsset] = useState<Assets | null>(null);
  const [type, setType] = useState("BUY");

  // Optimistic UI: Show transaction immediately while API call is in flight
  const [optimisticTransactions, addOptimisticTransaction] = useOptimistic(
    existingTransactions,
    (current: Transaction[], newTransaction: Transaction) => [
      newTransaction,
      ...current,
    ],
  );

  // Generate unique IDs for form labels
  const quantityId = useId();
  const priceId = useId();
  const feeId = useId();
  const notesId = useId();

  useEffect(() => {
    if (state?.success && state?.transaction) {
      onSuccess?.(state.transaction);
    }
  }, [state?.success, state?.transaction, onSuccess]);

  // Wrap form action to add optimistic update
  const handleSubmit = (formData: FormData) => {
    if (selectedAsset) {
      // Add optimistic transaction
      const optimisticTx: Transaction = {
        id: `optimistic-${Date.now()}`,
        portfolio_id: portfolioId,
        asset_id: selectedAsset.id,
        type: type as "BUY" | "SELL",
        quantity: Number(formData.get("quantity")),
        price: Number(formData.get("price")),
        fee: Number(formData.get("fee") || 0),
        notes: formData.get("notes") as string | undefined,
        asset_symbol: selectedAsset.symbol,
      };
      addOptimisticTransaction(optimisticTx);
    }

    // Call actual form action
    formAction(formData);
  };

  return (
    <div className="space-y-6">
      <form action={handleSubmit} className="space-y-4 text-left">
        <input type="hidden" name="portfolioId" value={portfolioId} />
        <input type="hidden" name="assetId" value={selectedAsset?.id || ""} />
        <input type="hidden" name="type" value={type} />

        <fieldset disabled={isPending} className="space-y-4">
          <div className="space-y-2">
            <Label>Asset</Label>
            <AssetAutocomplete onSelect={setSelectedAsset} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={setType} disabled={isPending}>
                <SelectTrigger className="bg-white/5 border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BUY">Buy</SelectItem>
                  <SelectItem value="SELL">Sell</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor={quantityId}>Quantity</Label>
              <Input
                id={quantityId}
                name="quantity"
                type="number"
                step="any"
                min="0.00000001"
                placeholder="0.00"
                required
                className="bg-white/5 border-white/10"
                aria-describedby={`${quantityId}-hint`}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={priceId}>Price per Unit</Label>
              <Input
                id={priceId}
                name="price"
                type="number"
                step="any"
                min="0.01"
                placeholder="0.00"
                required
                className="bg-white/5 border-white/10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={feeId}>Fee (Optional)</Label>
              <Input
                id={feeId}
                name="fee"
                type="number"
                step="any"
                min="0"
                placeholder="0.00"
                className="bg-white/5 border-white/10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor={notesId}>Notes</Label>
            <Input
              id={notesId}
              name="notes"
              placeholder="Optional notes..."
              className="bg-white/5 border-white/10"
            />
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              className={cn(
                "w-full font-semibold transition-all",
                type === "BUY"
                  ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                  : "bg-rose-600 hover:bg-rose-500 text-white",
              )}
              disabled={isPending || !selectedAsset}
            >
              {isPending
                ? "Saving..."
                : type === "BUY"
                  ? "Confirm Purchase"
                  : "Confirm Sale"}
            </Button>
          </div>
        </fieldset>

        {state?.error && (
          <p
            className="text-red-500 text-sm font-medium text-center"
            role="alert"
          >
            {state.error}
          </p>
        )}
      </form>

      {/* Optimistic UI List */}
      {optimisticTransactions.length > 0 && (
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium mb-3 text-muted-foreground">
            Recent Activity
          </h4>
          <div className="space-y-3">
            {optimisticTransactions.slice(0, 3).map((tx) => (
              <div
                key={tx.id}
                className={cn(
                  "flex justify-between items-center text-sm p-3 rounded-md border transition-all",
                  tx.id.startsWith("optimistic")
                    ? "bg-muted/50 opacity-70 border-dashed animate-pulse"
                    : "bg-card",
                )}
              >
                <div className="flex flex-col">
                  <span
                    className={cn(
                      "font-semibold",
                      tx.type === "BUY" ? "text-emerald-500" : "text-rose-500",
                    )}
                  >
                    {tx.type} {tx.asset_symbol || "Asset"}
                  </span>
                  {tx.notes && (
                    <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                      {tx.notes}
                    </span>
                  )}
                </div>
                <div className="font-mono text-xs">
                  {tx.quantity} @ {tx.price}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
