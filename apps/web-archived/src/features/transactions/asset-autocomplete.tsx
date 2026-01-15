import * as React from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { Command } from "cmdk";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { useDebounce } from "@/hooks/use-debounce";
import { Assets } from "@workspace/database-types";
import { cn } from "@workspace/ui/lib/utils";
import { Button } from "@workspace/ui/components/button";
import { apiFetch } from "@/lib/api";

export function AssetAutocomplete({
  onSelect,
}: {
  onSelect: (asset: Assets) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [selectedAsset, setSelectedAsset] = React.useState<Assets | null>(null);
  const [query, setQuery] = React.useState("");
  const [assets, setAssets] = React.useState<Assets[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const debouncedQuery = useDebounce(query, 300);

  React.useEffect(() => {
    if (debouncedQuery.length < 1) {
      setAssets([]);
      setError(null);
      return;
    }

    async function fetchAssets() {
      setLoading(true);
      setError(null);
      try {
        const res = await apiFetch(
          `/assets/search?q=${encodeURIComponent(debouncedQuery)}`,
        );
        if (res.ok) {
          const data = await res.json();
          setAssets(data);
        } else if (res.status === 401) {
          setError("Please sign in to search assets");
        } else {
          setError("Failed to load assets");
        }
      } catch (e) {
        console.error("Asset search error:", e);
        setError("Network error");
      } finally {
        setLoading(false);
      }
    }

    fetchAssets();
  }, [debouncedQuery]);

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Select asset"
          className="w-full justify-between"
        >
          {selectedAsset ? selectedAsset.symbol : "Select asset..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverPrimitive.Trigger>

      <PopoverPrimitive.Content
        className="w-75 p-0 z-50 bg-popover text-popover-foreground shadow-md outline-none border rounded-md dark:bg-zinc-950"
        align="start"
      >
        <Command
          className="h-full w-full overflow-hidden rounded-md"
          shouldFilter={false}
        >
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Command.Input
              className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Search assets (e.g. AAPL, BTC)..."
              value={query}
              onValueChange={setQuery}
              aria-label="Search assets"
            />
          </div>
          <Command.List className="max-h-75 overflow-y-auto overflow-x-hidden p-1">
            {loading && (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Loading...
              </div>
            )}
            {error && (
              <div className="py-6 text-center text-sm text-red-500">
                {error}
              </div>
            )}
            {!loading && !error && assets.length === 0 && query.length > 0 && (
              <div className="py-6 text-center text-sm text-muted-foreground">
                No assets found.
              </div>
            )}

            {assets.map((asset) => (
              <Command.Item
                key={asset.id}
                value={asset.symbol}
                onSelect={() => {
                  setSelectedAsset(asset);
                  onSelect(asset);
                  setOpen(false);
                }}
                className={cn(
                  "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-zinc-100 dark:hover:bg-zinc-800",
                  selectedAsset?.id === asset.id &&
                    "bg-zinc-100 dark:bg-zinc-800",
                )}
              >
                <span className="font-bold w-12">{asset.symbol}</span>
                <span className="truncate flex-1">
                  {asset.name_en || asset.name_local}
                </span>
                <span className="text-xs text-muted-foreground ml-2 capitalize">
                  {asset.asset_class}
                </span>
                <Check
                  className={cn(
                    "ml-auto h-4 w-4",
                    selectedAsset?.id === asset.id
                      ? "opacity-100"
                      : "opacity-0",
                  )}
                />
              </Command.Item>
            ))}
          </Command.List>
        </Command>
      </PopoverPrimitive.Content>
    </PopoverPrimitive.Root>
  );
}
