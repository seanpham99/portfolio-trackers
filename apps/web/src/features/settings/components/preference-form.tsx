"use client";

import { useTheme } from "next-themes";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Monitor, Moon, Sun } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { useUserSettings, useUpdateUserSettings } from "../hooks/use-user-settings";
import { Currency } from "@workspace/shared-types/api";

export function PreferenceForm() {
  const { setTheme, theme } = useTheme();
  const { data: settings } = useUserSettings();
  const updateSettings = useUpdateUserSettings();

  const isUpdating = updateSettings.isPending;

  const handleCurrencyChange = (currency: Currency) => {
    updateSettings.mutate(
      { currency },
      {
        onSuccess: () => toast.success("Currency updated"),
        onError: () => toast.error("Failed to update currency"),
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h3 className="text-lg font-medium">Appearance</h3>
        <p className="text-sm text-muted-foreground">
          Customize the look and feel of the application.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <button
          className={`flex flex-col items-center justify-between rounded-md border-2 p-4 hover:bg-accent hover:text-accent-foreground ${
            theme === "light" ? "border-primary" : "border-muted"
          }`}
          onClick={() => {
            setTheme("light");
            toast.success("Theme set to Light");
          }}
        >
          <Sun className="mb-3 h-6 w-6" />
          <span className="text-sm font-medium">Light</span>
        </button>
        <button
          className={`flex flex-col items-center justify-between rounded-md border-2 p-4 hover:bg-accent hover:text-accent-foreground ${
            theme === "dark" ? "border-primary" : "border-muted"
          }`}
          onClick={() => {
            setTheme("dark");
            toast.success("Theme set to Dark");
          }}
        >
          <Moon className="mb-3 h-6 w-6" />
          <span className="text-sm font-medium">Dark</span>
        </button>
        <button
          className={`flex flex-col items-center justify-between rounded-md border-2 p-4 hover:bg-accent hover:text-accent-foreground ${
            theme === "system" ? "border-primary" : "border-muted"
          }`}
          onClick={() => {
            setTheme("system");
            toast.success("Theme set to System");
          }}
        >
          <Monitor className="mb-3 h-6 w-6" />
          <span className="text-sm font-medium">System</span>
        </button>
      </div>

      <div className="space-y-1 pt-6">
        <h3 className="text-lg font-medium">Currency</h3>
        <p className="text-sm text-muted-foreground">
          Set your preferred display currency (Currently USD only).
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Base Currency</CardTitle>
          <CardDescription>Global currency for portfolio aggregation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="w-[200px]">
              <Select
                value={settings?.currency || Currency.USD}
                onValueChange={(value) => handleCurrencyChange(value as Currency)}
                disabled={isUpdating}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={Currency.USD}>USD - US Dollar</SelectItem>
                  <SelectItem value={Currency.VND}>VND - Vietnamese Dong</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {isUpdating && (
              <span className="text-xs text-muted-foreground animate-pulse">Saving...</span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
