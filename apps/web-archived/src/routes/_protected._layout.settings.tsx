import { useSettings, useUpdateSettings } from "@/api/hooks/use-settings";
import { Currency } from "@workspace/api-types";
import { ArrowRight, Link as LinkIcon } from "lucide-react";
import { Link } from "react-router";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@workspace/ui/components/card";
import { Spinner } from "@workspace/ui/components/spinner";
import { Slider } from "@workspace/ui/components/slider";

export default function SettingsPage() {
  const { data: settings, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="size-6" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-6">
      <div className="space-y-6">
        <div>
          <h2 className="font-serif text-2xl font-light text-foreground sm:text-3xl mb-2">
            Settings
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage your preferences and connected accounts
          </p>
        </div>

        {/* Currency Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Currency</CardTitle>
            <CardDescription>
              Select your preferred display currency
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              {(
                [
                  Currency.USD,
                  Currency.VND,
                  Currency.EUR,
                  Currency.GBP,
                ] as const
              ).map((currency) => (
                <Button
                  key={currency}
                  onClick={() => updateSettings.mutate({ currency })}
                  disabled={updateSettings.isPending}
                  variant={
                    settings?.currency === currency ? "default" : "outline"
                  }
                  size="sm"
                >
                  {currency}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Auto-refresh Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Auto-refresh Interval</CardTitle>
            <CardDescription>
              Update data every {settings?.refresh_interval || 60} seconds
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Slider
              defaultValue={[settings?.refresh_interval || 60]}
              onValueChange={([value]) =>
                updateSettings.mutate({ refresh_interval: value })
              }
              disabled={updateSettings.isPending}
              min={10}
              max={300}
              step={10}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>10s</span>
              <span>300s (5min)</span>
            </div>
          </CardContent>
        </Card>

        {/* Quick Links Section */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Links</CardTitle>
          </CardHeader>
          <CardContent>
            <Link to="/settings/connections">
              <Card className="hover:bg-accent transition-colors cursor-pointer border-0">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                      <LinkIcon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">
                        Exchange Connections
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Connect Binance, OKX for auto-sync
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
