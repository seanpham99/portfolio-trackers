"use client";

import { useState } from "react";
import { useForm, useWatch, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Plus, Search, ChevronLeft } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import {
  useSearchAssets,
  useAddTransaction,
} from "@/features/portfolio/hooks/use-portfolios";
import { usePopularAssets } from "@/api/hooks/use-popular-assets";
import { TransactionType } from "@workspace/api-types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { Field, FieldLabel, FieldError } from "@workspace/ui/components/field";
import { Input } from "@workspace/ui/components/input";
import { ScrollArea } from "@workspace/ui/components/scroll-area";

// --- Types & Data ---

interface AddAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  stageId: string;
  portfolioId: string;
}

const addAssetSchema = z.object({
  quantity: z
    .string()
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Ctq > 0"),
  pricePerUnit: z
    .string()
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Price > 0"),
});

type AddAssetFormValues = z.infer<typeof addAssetSchema>;

// --- Main Component ---

export function AddAssetModal({
  isOpen,
  onClose,
  stageId,
  portfolioId,
}: AddAssetModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAsset, setSelectedAsset] = useState<any | null>(null);

  // Forms
  const addForm = useForm<AddAssetFormValues>({
    resolver: zodResolver(addAssetSchema),
    defaultValues: { quantity: "", pricePerUnit: "" },
  });

  // Watch for totals calculation
  const qty = useWatch({ control: addForm.control, name: "quantity" });
  const price = useWatch({ control: addForm.control, name: "pricePerUnit" });
  const totalValue = Number(qty || 0) * Number(price || 0);

  // Hooks
  const { data: searchResults = [], isLoading: isSearching } =
    useSearchAssets(searchQuery);
  const { data: popularAssets = [], isLoading: isLoadingPopular } =
    usePopularAssets();
  const addTransaction = useAddTransaction(portfolioId);

  // Filter assets - show popular when not searching, search results when user types
  const displayAssets = searchQuery.length >= 2 ? searchResults : popularAssets;

  // Handlers
  const handleAddAsset = async (values: AddAssetFormValues) => {
    if (!selectedAsset || !portfolioId) return;

    try {
      await addTransaction.mutateAsync({
        asset_id: selectedAsset.id,
        type: TransactionType.BUY,
        quantity: Number(values.quantity),
        price: Number(values.pricePerUnit),
        transaction_date: new Date().toISOString(),
      });

      onClose();
    } catch (err: any) {
      console.error("Failed to add asset:", err);
      // toast.error(err.message || "Failed to add asset");
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setSearchQuery("");
      setSelectedAsset(null);
      addForm.reset();
      onClose();
    }
  };

  const canGoBack = !!selectedAsset;
  const handleBack = () => {
    setSelectedAsset(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg bg-surface border-border text-foreground p-0 gap-0 overflow-hidden flex flex-col h-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4 shrink-0">
          <div className="flex items-center gap-3">
            {canGoBack && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBack}
                className="h-10 w-10 rounded-xl bg-overlay-light text-muted-foreground hover:bg-overlay-medium hover:text-foreground"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
            )}
            <div>
              <DialogTitle className="font-serif text-xl font-light">
                {selectedAsset ? selectedAsset.symbol : "Add Asset"}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground capitalize">
                {selectedAsset
                  ? selectedAsset.name_en || selectedAsset.name
                  : stageId.replace("-", " ")}
              </DialogDescription>
            </div>
          </div>
        </div>

        <div className="p-6 flex-1 flex flex-col min-h-0">
          {!selectedAsset ? (
            <>
              {/* Search State */}
              <div className="relative mb-4 shrink-0">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by symbol or name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-overlay-light border-border focus-visible:ring-indigo-500/50"
                  autoFocus
                />
              </div>

              <ScrollArea className="flex-1 w-full rounded-md border border-border max-h-full min-h-0 flex flex-col *:data-[slot=scroll-area-viewport]:flex-1">
                {(isSearching && searchQuery.length >= 2) ||
                (isLoadingPopular && searchQuery.length < 2) ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
                  </div>
                ) : displayAssets.length > 0 ? (
                  <div className="space-y-2 p-2 pt-0">
                    {displayAssets.map((asset: any) => (
                      <button
                        key={asset.id || asset.symbol}
                        onClick={() => setSelectedAsset(asset)}
                        className="flex w-full items-center gap-3 rounded-xl bg-overlay-light p-3 transition-colors hover:bg-overlay-medium"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-overlay-medium text-sm font-medium text-foreground overflow-hidden">
                          {asset.logo_url ? (
                            <img
                              src={asset.logo_url}
                              alt={asset.symbol}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            asset.symbol.slice(0, 2)
                          )}
                        </div>
                        <div className="flex-1 text-left">
                          <p className="font-medium text-foreground">
                            {asset.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {asset.name_en || asset.name}
                          </p>
                        </div>
                        <Plus className="h-4 w-4 text-muted-foreground" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="py-6 text-center">
                    <p className="text-sm text-zinc-500">
                      No assets found for &quot;{searchQuery}&quot;
                    </p>
                    <p className="mt-2 text-xs text-zinc-600">
                      Try a different search term or contact support to request
                      tracking for a new asset.
                    </p>
                  </div>
                )}
              </ScrollArea>
            </>
          ) : (
            /* Add Asset Form (Input Quantity/Price) */
            <div className="space-y-6">
              {/* Removed the asset info card that had the Change button as it's now in header */}

              <form
                onSubmit={addForm.handleSubmit(handleAddAsset)}
                className="space-y-4"
              >
                <Controller
                  control={addForm.control}
                  name="quantity"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel
                        htmlFor={field.name}
                        className="text-zinc-400 font-normal"
                      >
                        Quantity
                      </FieldLabel>
                      <Input
                        id={field.name}
                        type="number"
                        {...field}
                        className="bg-white/3 border-white/8 focus-visible:ring-indigo-500/50"
                        placeholder="0.00"
                        aria-invalid={fieldState.invalid}
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
                <Controller
                  control={addForm.control}
                  name="pricePerUnit"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel
                        htmlFor={field.name}
                        className="text-zinc-400 font-normal"
                      >
                        Price per unit ($)
                      </FieldLabel>
                      <Input
                        id={field.name}
                        type="number"
                        {...field}
                        className="bg-white/3 border-white/8 focus-visible:ring-indigo-500/50"
                        placeholder="0.00"
                        aria-invalid={fieldState.invalid}
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />

                {totalValue > 0 && (
                  <div className="rounded-xl bg-overlay-light p-4 flex justify-between items-center">
                    <span className="text-sm text-zinc-400">Total Value</span>
                    <span className="text-xl font-semibold text-white">
                      $
                      {totalValue.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={
                    !addForm.formState.isValid || addTransaction.isPending
                  }
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-6 text-lg"
                >
                  {addTransaction.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    "Add to Portfolio"
                  )}
                </Button>
              </form>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
