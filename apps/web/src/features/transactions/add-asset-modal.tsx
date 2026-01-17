"use client";

import Image from "next/image";

import { useState } from "react";
import { useForm, useWatch, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Loader2,
  Plus,
  Search,
  ChevronLeft,
  Globe,
  Bitcoin,
  BarChart3,
  AlertCircle,
} from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { useSearchAssets, useAddTransaction } from "@/features/portfolio/hooks/use-portfolios";
import { usePopularAssets } from "@/api/hooks/use-popular-assets";
import { useDiscoverAssets, useSubmitAssetRequest } from "@/features/portfolio/hooks/use-discovery";
import { TransactionType } from "@workspace/shared-types/api";
import { DiscoverableAssetClass } from "@workspace/shared-types/database";
import type { DiscoveredAsset, DisplayableAsset } from "@/api/client";
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

type ModalState =
  | "SEARCH" // Initial search in internal registry
  | "NO_RESULTS_PICKER" // Select asset type when internal search fails
  | "EXTERNAL_SEARCH" // Searching external providers
  | "EXTERNAL_RESULTS" // Displaying external results
  | "QUEUE_SUBMIT" // Submit to pending queue
  | "ASSET_FORM"; // Selected asset, input quantity/price

const addAssetSchema = z.object({
  quantity: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Qty > 0"),
  pricePerUnit: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Price > 0"),
});

type AddAssetFormValues = z.infer<typeof addAssetSchema>;

const ASSET_TYPE_OPTIONS = [
  {
    value: DiscoverableAssetClass.VN_STOCK,
    label: "VN Stock",
    icon: BarChart3,
    description: "Vietnam (HOSE, HNX)",
  },
  {
    value: DiscoverableAssetClass.US_STOCK,
    label: "US Stock",
    icon: BarChart3,
    description: "NYSE, NASDAQ",
  },
  {
    value: DiscoverableAssetClass.GLOBAL_STOCK,
    label: "Global Stock",
    icon: Globe,
    description: "International markets",
  },
  {
    value: DiscoverableAssetClass.CRYPTO,
    label: "Crypto",
    icon: Bitcoin,
    description: "Bitcoin, Ethereum, etc.",
  },
];

// --- Main Component ---

export function AddAssetModal({ isOpen, onClose, stageId, portfolioId }: AddAssetModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [modalState, setModalState] = useState<ModalState>("SEARCH");
  const [selectedAssetClass, setSelectedAssetClass] = useState<DiscoverableAssetClass | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<DisplayableAsset | null>(null);

  // Forms
  const addForm = useForm<AddAssetFormValues>({
    resolver: zodResolver(addAssetSchema),
    defaultValues: { quantity: "", pricePerUnit: "" },
    mode: "onChange",
  });

  // Watch for totals calculation

  // Watch for totals calculation - Use safe simple math for display only
  const qty = useWatch({ control: addForm.control, name: "quantity" });
  const price = useWatch({ control: addForm.control, name: "pricePerUnit" });

  // Safe display check
  const hasValidValues = !isNaN(Number(qty)) && !isNaN(Number(price));
  const totalValueDisplay = hasValidValues
    ? (Number(qty) * Number(price)).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : "0.00";

  // Hooks
  const { data: searchResults = [], isLoading: isSearching } = useSearchAssets(searchQuery);
  const { data: popularAssets = [], isLoading: isLoadingPopular } = usePopularAssets();
  const addTransaction = useAddTransaction(portfolioId);

  // External discovery hooks
  const { data: externalResults = [], isLoading: isDiscovering } = useDiscoverAssets(
    searchQuery,
    selectedAssetClass
  );

  const submitAssetRequest = useSubmitAssetRequest();

  // Determine if internal search returned no results
  const hasSearchQuery = searchQuery.length >= 2;
  const internalSearchEmpty = hasSearchQuery && !isSearching && searchResults.length === 0;

  // Show external results when in external states
  const showExternalResults = modalState === "EXTERNAL_RESULTS" || modalState === "EXTERNAL_SEARCH";

  // Select which assets to display
  const displayAssets = showExternalResults
    ? externalResults
    : hasSearchQuery
      ? searchResults
      : popularAssets;

  const handleAddAsset = async (values: AddAssetFormValues) => {
    if (!selectedAsset || !portfolioId || !selectedAsset.id) return;

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
      // In a real app, use toast here. For now, we rely on the button state or add a local error state.
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetModal();
      onClose();
    }
  };

  const resetModal = () => {
    setSearchQuery("");
    setModalState("SEARCH");
    setSelectedAssetClass(null);
    setSelectedAsset(null);
    addForm.reset();
  };

  const handleBack = () => {
    if (modalState === "ASSET_FORM") {
      setSelectedAsset(null);
      // Go back to external results if we were there, otherwise search
      if (selectedAssetClass) {
        setModalState("EXTERNAL_RESULTS");
      } else {
        setModalState("SEARCH");
      }
    } else if (
      modalState === "EXTERNAL_RESULTS" ||
      modalState === "EXTERNAL_SEARCH" ||
      modalState === "QUEUE_SUBMIT"
    ) {
      setModalState("NO_RESULTS_PICKER");
      setSelectedAssetClass(null);
    } else if (modalState === "NO_RESULTS_PICKER") {
      setModalState("SEARCH");
    }
  };

  const handleAssetTypeSelect = (assetClass: DiscoverableAssetClass) => {
    setSelectedAssetClass(assetClass);
    setModalState("EXTERNAL_SEARCH");
  };

  const handleAssetSelect = (asset: DisplayableAsset) => {
    setSelectedAsset(asset);
    setModalState("ASSET_FORM");
  };

  const handleRequestTracking = async () => {
    if (!selectedAssetClass) return;

    try {
      await submitAssetRequest.mutateAsync({
        symbol: searchQuery.toUpperCase(),
        assetClass: selectedAssetClass,
      });
      setModalState("QUEUE_SUBMIT");
    } catch (err: any) {
      console.error("Failed to submit request:", err);
    }
  };

  // Effect: transition to results when external search completes
  if (modalState === "EXTERNAL_SEARCH" && !isDiscovering && selectedAssetClass) {
    // Show results (empty or populated)
    setModalState("EXTERNAL_RESULTS");
  }

  const canGoBack = modalState !== "SEARCH";

  // Get title based on state
  const getTitle = () => {
    if (selectedAsset) return selectedAsset.symbol;
    if (modalState === "NO_RESULTS_PICKER") return "Select Asset Type";
    if (modalState === "EXTERNAL_SEARCH") return "Searching...";
    if (modalState === "EXTERNAL_RESULTS") return "External Results";
    if (modalState === "QUEUE_SUBMIT") return "Request Submitted";
    return "Add Asset";
  };

  const getDescription = () => {
    if (selectedAsset) return selectedAsset.name_en;
    if (modalState === "NO_RESULTS_PICKER") return `No results for "${searchQuery}"`;
    if (modalState === "EXTERNAL_SEARCH") return `Searching for "${searchQuery}"`;
    if (modalState === "EXTERNAL_RESULTS") return `Found ${externalResults.length} results`;
    if (modalState === "QUEUE_SUBMIT") return "We'll add this asset soon";
    return stageId.replace("-", " ");
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
              <DialogTitle className="font-serif text-xl font-light">{getTitle()}</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground capitalize">
                {getDescription()}
              </DialogDescription>
            </div>
          </div>
        </div>

        <div className="p-6 flex-1 flex flex-col min-h-0">
          {/* SEARCH State */}
          {modalState === "SEARCH" && (
            <>
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
                {(isSearching && hasSearchQuery) || (isLoadingPopular && !hasSearchQuery) ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
                  </div>
                ) : displayAssets.length > 0 ? (
                  <div className="space-y-2 p-2 pt-0">
                    {(displayAssets as DisplayableAsset[]).map((asset) => (
                      <button
                        key={asset.id ?? asset.symbol}
                        onClick={() => handleAssetSelect(asset)}
                        className="flex w-full items-center gap-3 rounded-xl bg-overlay-light p-3 transition-colors hover:bg-overlay-medium"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-overlay-medium text-sm font-medium text-foreground overflow-hidden">
                          {asset.logo_url ? (
                            <Image
                              src={asset.logo_url}
                              alt={asset.symbol}
                              width={40}
                              height={40}
                              className="h-full w-full object-cover"
                              unoptimized
                            />
                          ) : (
                            asset.symbol.slice(0, 2)
                          )}
                        </div>
                        <div className="flex-1 text-left">
                          <p className="font-medium text-foreground">{asset.symbol}</p>
                          <p className="text-xs text-muted-foreground">{asset.name_en}</p>
                        </div>
                        <Plus className="h-4 w-4 text-muted-foreground" />
                      </button>
                    ))}
                  </div>
                ) : internalSearchEmpty ? (
                  <div className="py-6 text-center">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2 text-amber-500" />
                    <p className="text-sm text-foreground font-medium">
                      Asset not found in our registry
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Select an asset type to search external providers
                    </p>
                    <Button
                      onClick={() => setModalState("NO_RESULTS_PICKER")}
                      className="mt-4 bg-indigo-600 hover:bg-indigo-500 text-white"
                    >
                      Search External Providers
                    </Button>
                  </div>
                ) : (
                  <div className="py-6 text-center">
                    <p className="text-sm text-muted-foreground">Type to search assets...</p>
                  </div>
                )}
              </ScrollArea>
            </>
          )}

          {/* NO_RESULTS_PICKER State - Asset Type Selection */}
          {modalState === "NO_RESULTS_PICKER" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-center mb-6">
                What type of asset is{" "}
                <span className="font-semibold text-foreground">{searchQuery.toUpperCase()}</span>?
              </p>
              <div className="grid grid-cols-2 gap-3">
                {ASSET_TYPE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleAssetTypeSelect(option.value)}
                    className="flex flex-col items-center gap-2 rounded-xl bg-overlay-light p-4 transition-colors hover:bg-overlay-medium border border-border hover:border-indigo-500"
                  >
                    <option.icon className="h-8 w-8 text-indigo-400" />
                    <span className="font-medium text-foreground">{option.label}</span>
                    <span className="text-xs text-muted-foreground">{option.description}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* EXTERNAL_SEARCH State - Loading */}
          {modalState === "EXTERNAL_SEARCH" && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500 mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">
                  Searching{" "}
                  {selectedAssetClass === DiscoverableAssetClass.CRYPTO
                    ? "CoinGecko"
                    : "Yahoo Finance"}
                  ...
                </p>
              </div>
            </div>
          )}

          {/* EXTERNAL_RESULTS State */}
          {modalState === "EXTERNAL_RESULTS" && (
            <ScrollArea className="flex-1 w-full rounded-md border border-border max-h-full min-h-0 flex flex-col *:data-[slot=scroll-area-viewport]:flex-1">
              {externalResults.length > 0 ? (
                <div className="space-y-2 p-2 pt-0">
                  {externalResults.map((asset: DiscoveredAsset) => (
                    <button
                      key={`${asset.symbol}-${asset.market}`}
                      onClick={() => handleAssetSelect(asset)}
                      className="flex w-full items-center gap-3 rounded-xl bg-overlay-light p-3 transition-colors hover:bg-overlay-medium"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-overlay-medium text-sm font-medium text-foreground overflow-hidden">
                        {asset.logo_url ? (
                          <Image
                            src={asset.logo_url}
                            alt={asset.symbol}
                            width={40}
                            height={40}
                            className="h-full w-full object-cover"
                            unoptimized
                          />
                        ) : (
                          asset.symbol.slice(0, 2)
                        )}
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-medium text-foreground">{asset.symbol}</p>
                        <p className="text-xs text-muted-foreground">{asset.name_en}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded">
                          {asset.market || asset.asset_class}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2 text-amber-500" />
                  <p className="text-sm text-foreground font-medium">No external results found</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Request tracking for this asset?
                  </p>
                  <Button
                    onClick={handleRequestTracking}
                    disabled={submitAssetRequest.isPending}
                    className="mt-4 bg-amber-600 hover:bg-amber-500 text-white"
                  >
                    {submitAssetRequest.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Request Tracking"
                    )}
                  </Button>
                </div>
              )}
            </ScrollArea>
          )}

          {/* QUEUE_SUBMIT State - Success */}
          {modalState === "QUEUE_SUBMIT" && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="h-16 w-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="h-8 w-8 text-emerald-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <p className="text-lg font-medium text-foreground">Request Submitted!</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  We&apos;ll add <span className="font-semibold">{searchQuery.toUpperCase()}</span>{" "}
                  to our registry soon.
                </p>
                <Button
                  onClick={() => resetModal()}
                  className="mt-6 bg-surface hover:bg-overlay-light border border-border"
                >
                  Search for another asset
                </Button>
              </div>
            </div>
          )}

          {/* ASSET_FORM State */}
          {modalState === "ASSET_FORM" && selectedAsset && (
            <div className="space-y-6">
              <form onSubmit={addForm.handleSubmit(handleAddAsset)} className="space-y-4">
                <Controller
                  control={addForm.control}
                  name="quantity"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel
                        htmlFor={field.name}
                        className="text-muted-foreground font-normal"
                      >
                        Quantity
                      </FieldLabel>
                      <Input
                        id={field.name}
                        type="number"
                        {...field}
                        className="bg-overlay-light border-border focus-visible:ring-indigo-500/50"
                        placeholder="0.00"
                        aria-invalid={fieldState.invalid}
                        autoFocus
                      />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
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
                        className="text-muted-foreground font-normal"
                      >
                        Price per unit ({selectedAsset.currency || "USD"})
                      </FieldLabel>
                      <Input
                        id={field.name}
                        type="number"
                        {...field}
                        className="bg-overlay-light border-border focus-visible:ring-indigo-500/50"
                        placeholder="0.00"
                        aria-invalid={fieldState.invalid}
                      />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />

                {hasValidValues && Number(qty) * Number(price) > 0 && (
                  <div className="rounded-xl bg-overlay-light p-4 flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Value</span>
                    <span className="text-xl font-semibold text-foreground">
                      {selectedAsset.currency || "$"}
                      {selectedAsset.currency || "$"}
                      {totalValueDisplay}
                    </span>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={!addForm.formState.isValid || addTransaction.isPending}
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
