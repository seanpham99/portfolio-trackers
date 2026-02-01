"use client";

import { useHoldings } from "@/features/portfolio/hooks/use-holdings";
import { useUser } from "@/hooks/use-user";
import { validateAssetCount } from "@workspace/shared-types";
import { UpgradeModal } from "@/components/upgrade-modal";
import Image from "next/image";

import { useState, useEffect } from "react";
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
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import {
  useSearchAssets,
  useAddTransaction,
  usePortfolio,
} from "@/features/portfolio/hooks/use-portfolios";
import { useExchangeRate } from "@/features/portfolio/hooks/use-exchange-rate"; // [NEW]
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
import { toast } from "sonner";

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
  | "CONFIRMATION" // [NEW] Verify asset before form
  | "QUEUE_SUBMIT" // Submit to pending queue
  | "ASSET_FORM"; // Selected asset, input quantity/price

const addAssetSchema = z.object({
  quantity: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Qty > 0"),
  pricePerUnit: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Price > 0"),
  fee: z
    .string()
    .optional()
    .refine((val) => !val || (!isNaN(Number(val)) && Number(val) >= 0), "Fee >= 0"),
  exchangeRate: z
    .string()
    .optional()
    .refine((val) => !val || (!isNaN(Number(val)) && Number(val) > 0), "Rate > 0"),
  transactionDate: z.string().optional(),
  notes: z.string().optional(),
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

  const { data: user } = useUser();
  const { data: holdings } = useHoldings(); // Fetches all holdings for the user
  const { data: searchResults = [], isLoading: isSearching } = useSearchAssets(searchQuery);
  const { data: popularAssets = [], isLoading: isLoadingPopular } = usePopularAssets();
  const { data: portfolio } = usePortfolio(portfolioId);
  const addTransaction = useAddTransaction(portfolioId);
  const { data: externalResults = [], isLoading: isDiscovering } = useDiscoverAssets(
    searchQuery,
    selectedAssetClass
  );
  const submitAssetRequest = useSubmitAssetRequest();

  const addForm = useForm<AddAssetFormValues>({
    resolver: zodResolver(addAssetSchema),
    defaultValues: {
      quantity: "",
      pricePerUnit: "",
      fee: "0",
      exchangeRate: "1",
      notes: "",
      transactionDate: new Date().toISOString().slice(0, 16),
    },
    mode: "onChange",
  });

  const qty = useWatch({ control: addForm.control, name: "quantity" });
  const price = useWatch({ control: addForm.control, name: "pricePerUnit" });
  const transactionDate = useWatch({ control: addForm.control, name: "transactionDate" });

  const assetCurrency = selectedAsset?.currency || "USD";
  const portfolioCurrency = portfolio?.data?.base_currency || "VND";

  const { data: automatedRate, isLoading: isLoadingRate } = useExchangeRate(
    assetCurrency,
    portfolioCurrency,
    transactionDate || new Date().toISOString(),
    !!selectedAsset
  );

  const validation = validateAssetCount(
    holdings?.data?.length || 0,
    user?.subscription_tier || "free"
  );

  useEffect(() => {
    if (automatedRate) {
      addForm.setValue("exchangeRate", automatedRate.toString(), {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  }, [automatedRate, addForm]);

  if (!validation.valid && validation.error) {
    return <UpgradeModal isOpen={isOpen} onClose={onClose} error={validation.error} />;
  }

  const hasValidValues = !isNaN(Number(qty)) && !isNaN(Number(price));
  const totalValueDisplay = hasValidValues
    ? (Number(qty) * Number(price)).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : "0.00";

  const handleAddAsset = async (values: AddAssetFormValues) => {
    if (!selectedAsset || !portfolioId || !selectedAsset.id) return;

    try {
      await addTransaction.mutateAsync({
        asset_id: selectedAsset.id,
        type: TransactionType.BUY,
        quantity: Number(values.quantity),
        price: Number(values.pricePerUnit),
        fee: values.fee ? Number(values.fee) : 0,
        exchange_rate: values.exchangeRate ? Number(values.exchangeRate) : 1,
        transaction_date: values.transactionDate
          ? new Date(values.transactionDate).toISOString()
          : new Date().toISOString(),
        notes: values.notes,
      });

      toast.success("Asset added successfully");
      onClose();
    } catch (err) {
      console.error("Failed to action:", err);
      toast.error(err instanceof Error ? err.message : "An error occurred");
    }
  };
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
    // Reset form with NEW date
    addForm.reset({
      quantity: "",
      pricePerUnit: "",
      fee: "0",
      exchangeRate: "1",
      notes: "",
      transactionDate: new Date().toISOString().slice(0, 16),
    });
  };

  const handleBack = () => {
    if (modalState === "ASSET_FORM") {
      setModalState("CONFIRMATION"); // Back to confirmation
    } else if (modalState === "CONFIRMATION") {
      setSelectedAsset(null);
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
    setModalState("CONFIRMATION"); // [UX Fix]: Confirm before form
  };

  const handleConfirmAsset = () => {
    setModalState("ASSET_FORM");
  };

  // Auto-fill exchange rate when fetched

  const handleRequestTracking = async () => {
    if (!selectedAssetClass) return;

    try {
      await submitAssetRequest.mutateAsync({
        symbol: searchQuery.toUpperCase(),
        assetClass: selectedAssetClass,
      });
      setModalState("QUEUE_SUBMIT");
    } catch (err) {
      console.error("Failed to submit request:", err);
      toast.error(err instanceof Error ? err.message : "Failed to submit request");
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
    if (modalState === "CONFIRMATION") return "Confirm Asset";
    if (modalState === "ASSET_FORM" && selectedAsset) return "Add Transaction"; // Simpler title
    if (modalState === "NO_RESULTS_PICKER") return "Select Asset Type";
    if (modalState === "EXTERNAL_SEARCH") return "Searching...";
    if (modalState === "EXTERNAL_RESULTS") return "External Results";
    if (modalState === "QUEUE_SUBMIT") return "Request Submitted";
    return "Add Asset";
  };

  const getDescription = () => {
    if (modalState === "CONFIRMATION") return "Is this the asset you want to add?";
    if (modalState === "ASSET_FORM" && selectedAsset) return selectedAsset.symbol;
    if (modalState === "NO_RESULTS_PICKER") return `No results for "${searchQuery}"`;
    if (modalState === "EXTERNAL_SEARCH") return `Searching for "${searchQuery}"`;
    if (modalState === "EXTERNAL_RESULTS") return `Found ${externalResults.length} results`;
    if (modalState === "QUEUE_SUBMIT") return "We'll add this asset soon";
    return stageId.replace("-", " ");
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md bg-surface border-border text-foreground p-0 gap-0 overflow-hidden flex flex-col h-[600px] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4 shrink-0 bg-surface/50 backdrop-blur-md">
          <div className="flex items-center gap-3">
            {canGoBack && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBack}
                className="h-8 w-8 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
            )}
            <div>
              <DialogTitle
                className="text-lg font-bold tracking-tight"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {getTitle()}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground capitalize">
                {getDescription()}
              </DialogDescription>
            </div>
          </div>
        </div>

        <div className="p-6 flex-1 flex flex-col min-h-0 overflow-y-auto">
          {/* SEARCH State */}
          {modalState === "SEARCH" && (
            <>
              <div className="relative mb-6 shrink-0">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search symbol (e.g., AAPL, NVDA)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-muted/50 border-border focus-visible:ring-emerald-500/50 h-11"
                  autoFocus
                />
              </div>

              <div className="flex-1 min-h-0 flex flex-col">
                <h4
                  className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  {hasSearchQuery ? "Results" : "Popular Assets"}
                </h4>

                <ScrollArea className="flex-1 -mx-2 px-2">
                  {(isSearching && hasSearchQuery) || (isLoadingPopular && !hasSearchQuery) ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
                    </div>
                  ) : displayAssets.length > 0 ? (
                    <div className="space-y-1">
                      {(displayAssets as DisplayableAsset[]).map((asset) => (
                        <button
                          key={asset.id ?? asset.symbol}
                          onClick={() => handleAssetSelect(asset)}
                          className="flex w-full items-center gap-3 rounded-lg p-3 transition-all hover:bg-muted group cursor-pointer border border-transparent hover:border-border-subtle"
                        >
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-elevated text-sm font-bold text-foreground overflow-hidden border border-border-subtle shadow-sm">
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
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-foreground font-mono">
                                {asset.symbol}
                              </span>
                              {asset.asset_class && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-medium uppercase">
                                  {asset.asset_class}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {asset.name_en}
                            </p>
                          </div>
                          <Plus className="h-4 w-4 text-muted-foreground group-hover:text-emerald-500 transition-colors" />
                        </button>
                      ))}

                      {/* Footer CTA for Missing Assets */}
                      {hasSearchQuery && (
                        <div className="pt-4 pb-2">
                          <Button
                            variant="ghost"
                            onClick={() => {
                              // If search query exists, keep it.
                              setModalState("NO_RESULTS_PICKER");
                            }}
                            className="w-full text-xs text-muted-foreground hover:text-emerald-500 flex items-center justify-center gap-2 h-auto py-2"
                          >
                            <span className="truncate">
                              Can&apos;t find &quot;{searchQuery}&quot;? Search external providers.
                            </span>
                            <ArrowRight className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : internalSearchEmpty ? (
                    <div className="py-12 text-center">
                      <div className="h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="h-6 w-6 text-amber-500" />
                      </div>
                      <p className="text-foreground font-medium">No results found</p>
                      <p className="mt-1 text-xs text-muted-foreground mb-6">
                        Try searching external providers
                      </p>
                      <Button
                        onClick={() => setModalState("NO_RESULTS_PICKER")}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white w-full shadow-lg shadow-emerald-500/20"
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
              </div>
            </>
          )}

          {/* NO_RESULTS_PICKER State */}
          {modalState === "NO_RESULTS_PICKER" && (
            <div className="py-4">
              {!searchQuery ? (
                <div className="mb-6">
                  <p className="text-sm text-muted-foreground text-center mb-3">
                    Enter the symbol you are looking for:
                  </p>
                  <Input
                    placeholder="e.g. AAPL, BTC, VCB..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-muted/50 border-border focus-visible:ring-emerald-500/50 h-11 text-center font-mono uppercase"
                    autoFocus
                  />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center mb-6">
                  What type of asset is{" "}
                  <span className="font-bold text-foreground">{searchQuery.toUpperCase()}</span>?
                </p>
              )}

              <div className="grid grid-cols-2 gap-4">
                {ASSET_TYPE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      if (!searchQuery) {
                        toast.error("Please enter a symbol first");
                        return;
                      }
                      handleAssetTypeSelect(option.value);
                    }}
                    className="flex flex-col items-center gap-3 rounded-xl bg-surface-elevated p-6 transition-all hover:bg-muted border border-border hover:border-emerald-500/50 cursor-pointer group"
                  >
                    <div className="h-10 w-10 rounded-full bg-muted group-hover:bg-emerald-500/10 flex items-center justify-center transition-colors">
                      <option.icon className="h-5 w-5 text-muted-foreground group-hover:text-emerald-500" />
                    </div>
                    <div className="text-center">
                      <span className="block font-medium text-foreground">{option.label}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {option.description}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* EXTERNAL_SEARCH State */}
          {modalState === "EXTERNAL_SEARCH" && (
            <div className="flex-1 flex flex-col items-center justify-center">
              <Loader2 className="h-10 w-10 animate-spin text-emerald-500 mb-4" />
              <p className="font-medium text-foreground">Searching Providers...</p>
              <p className="text-sm text-muted-foreground mt-1">
                Checking{" "}
                {selectedAssetClass === DiscoverableAssetClass.CRYPTO
                  ? "CoinGecko"
                  : "Yahoo Finance"}
              </p>
            </div>
          )}

          {/* EXTERNAL_RESULTS State */}
          {modalState === "EXTERNAL_RESULTS" && (
            <ScrollArea className="flex-1 -mx-2 px-2">
              {externalResults.length > 0 ? (
                <div className="space-y-1">
                  {externalResults.map((asset: DiscoveredAsset) => (
                    <button
                      key={`${asset.symbol}-${asset.market}`}
                      onClick={() => handleAssetSelect(asset)}
                      className="flex w-full items-center gap-3 rounded-lg p-3 transition-all hover:bg-muted group cursor-pointer border border-transparent hover:border-border-subtle"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-elevated text-sm font-bold text-foreground overflow-hidden border border-border-subtle shadow-sm">
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
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-foreground font-mono">
                            {asset.symbol}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-medium uppercase border border-emerald-500/20">
                            {asset.market || asset.asset_class}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {asset.name_en}
                        </p>
                      </div>
                      <Plus className="h-4 w-4 text-muted-foreground group-hover:text-emerald-500 transition-colors" />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <div className="h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="h-6 w-6 text-amber-500" />
                  </div>
                  <p className="text-foreground font-medium">No external results found</p>
                  <p className="mt-1 text-xs text-muted-foreground mb-6">
                    Request tracking for this asset?
                  </p>
                  <Button
                    onClick={handleRequestTracking}
                    disabled={submitAssetRequest.isPending}
                    className="bg-amber-600 hover:bg-amber-500 text-white w-full"
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

          {/* CONFIRMATION State [NEW] */}
          {modalState === "CONFIRMATION" && selectedAsset && (
            <div className="flex-1 flex flex-col items-center justify-center p-4">
              <div className="h-20 w-20 rounded-full bg-surface-elevated border border-border shadow-2xl flex items-center justify-center mb-6 overflow-hidden">
                {selectedAsset.logo_url ? (
                  <Image
                    src={selectedAsset.logo_url}
                    alt={selectedAsset.symbol}
                    width={80}
                    height={80}
                    className="h-full w-full object-cover"
                    unoptimized
                  />
                ) : (
                  <span className="text-2xl font-bold font-heading">
                    {selectedAsset.symbol.slice(0, 2)}
                  </span>
                )}
              </div>

              <h3 className="text-2xl font-bold font-heading mb-1">{selectedAsset.symbol}</h3>
              <p className="text-muted-foreground text-center mb-8 max-w-[280px]">
                {selectedAsset.name_en}
              </p>

              <div className="w-full space-y-3">
                <Button
                  onClick={handleConfirmAsset}
                  className="w-full h-12 text-base font-medium bg-linear-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white shadow-lg shadow-emerald-500/20"
                >
                  Yes, Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => handleBack()}
                  className="w-full text-muted-foreground hover:text-foreground"
                >
                  No, search again
                </Button>

                {/* [UX Fix]: Add "Can't find asset?" prompt here too if they clicked the wrong one */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    // Pre-fill query with current symbol if available
                    if (selectedAsset) {
                      setSearchQuery(selectedAsset.symbol);
                    }
                    setSelectedAsset(null);
                    setModalState("NO_RESULTS_PICKER");
                  }}
                  className="w-full text-xs text-muted-foreground hover:text-emerald-500 mt-2"
                >
                  Can&apos;t find your asset? Search external.
                </Button>
              </div>
            </div>
          )}

          {/* QUEUE_SUBMIT State */}
          {modalState === "QUEUE_SUBMIT" && (
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4 border border-emerald-500/20">
                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
              </div>
              <p className="text-lg font-bold text-foreground font-heading">Request Submitted!</p>
              <p className="mt-2 text-sm text-muted-foreground text-center max-w-[260px]">
                <span className="font-semibold text-foreground">{searchQuery.toUpperCase()}</span>{" "}
                will be reviewed and added shortly.
              </p>
              <Button
                onClick={() => resetModal()}
                variant="outline"
                className="mt-8 border-border hover:bg-muted"
              >
                Search for another asset
              </Button>
            </div>
          )}

          {/* ASSET_FORM State */}
          {modalState === "ASSET_FORM" && selectedAsset && (
            <div className="space-y-6">
              <form onSubmit={addForm.handleSubmit(handleAddAsset)} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
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
                          className="bg-muted/30 border-border focus-visible:ring-emerald-500/50 font-mono text-lg"
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
                          Price ({selectedAsset.currency || "USD"})
                        </FieldLabel>
                        <Input
                          id={field.name}
                          type="number"
                          {...field}
                          className="bg-muted/30 border-border focus-visible:ring-emerald-500/50 font-mono text-lg"
                          placeholder="0.00"
                          aria-invalid={fieldState.invalid}
                        />
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />
                </div>

                {hasValidValues && Number(qty) * Number(price) > 0 && (
                  <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-4 flex justify-between items-center">
                    <span className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                      Total Value
                    </span>
                    <span className="text-xl font-bold text-emerald-700 dark:text-emerald-300 font-mono">
                      {selectedAsset.currency || "$"}
                      {totalValueDisplay}
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <Controller
                    control={addForm.control}
                    name="fee"
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel
                          htmlFor={field.name}
                          className="text-muted-foreground font-normal"
                        >
                          Fee
                        </FieldLabel>
                        <Input
                          id={field.name}
                          type="number"
                          {...field}
                          className="bg-muted/30 border-border focus-visible:ring-emerald-500/50"
                          placeholder="0.00"
                        />
                      </Field>
                    )}
                  />
                  <Controller
                    control={addForm.control}
                    name="exchangeRate"
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel
                          htmlFor={field.name}
                          className="text-muted-foreground font-normal"
                        >
                          Ex. Rate
                        </FieldLabel>
                        <div className="relative">
                          <Input
                            id={field.name}
                            type="number"
                            step="any"
                            {...field}
                            className={`bg-muted/30 border-border focus-visible:ring-emerald-500/50 pr-8 transition-colors ${
                              isLoadingRate ? "border-emerald-500/50 bg-emerald-500/5" : ""
                            }`}
                            placeholder="1.0"
                          />
                          {isLoadingRate && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                              <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-500" />
                            </div>
                          )}
                        </div>
                        {assetCurrency !== portfolioCurrency && (
                          <p className="text-[10px] text-muted-foreground mt-1.5 font-mono flex items-center justify-between">
                            <span>
                              1 {assetCurrency} ≈ {field.value} {portfolioCurrency}
                            </span>
                            {isLoadingRate && <span className="text-emerald-500">Updating...</span>}
                          </p>
                        )}
                      </Field>
                    )}
                  />
                </div>

                <Controller
                  control={addForm.control}
                  name="transactionDate"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel
                        htmlFor={field.name}
                        className="text-muted-foreground font-normal"
                      >
                        Date
                      </FieldLabel>
                      <Input
                        id={field.name}
                        type="datetime-local"
                        step="60"
                        {...field}
                        className="bg-muted/30 border-border focus-visible:ring-emerald-500/50"
                      />
                    </Field>
                  )}
                />

                <Controller
                  control={addForm.control}
                  name="notes"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel
                        htmlFor={field.name}
                        className="text-muted-foreground font-normal"
                      >
                        Notes
                      </FieldLabel>
                      <Input
                        id={field.name}
                        {...field}
                        className="bg-muted/30 border-border focus-visible:ring-emerald-500/50"
                        placeholder="Add a note (optional)..."
                      />
                    </Field>
                  )}
                />

                <Button
                  type="submit"
                  disabled={!addForm.formState.isValid || addTransaction.isPending}
                  className="w-full bg-linear-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white font-bold py-6 text-lg shadow-lg shadow-emerald-500/20 mt-4"
                >
                  {addTransaction.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
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
