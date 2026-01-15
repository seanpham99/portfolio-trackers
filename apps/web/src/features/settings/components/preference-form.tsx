"use client";

import { useTheme } from "next-themes";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Label } from "@workspace/ui/components/label";
import { Monitor, Moon, Sun } from "lucide-react";
import { toast } from "sonner";

export function PreferenceForm() {
  const { setTheme, theme } = useTheme();

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
      <Card className="opacity-50">
        <CardHeader>
          <CardTitle className="text-base">Base Currency</CardTitle>
          <CardDescription>Global currency for portfolio aggregation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <div className="text-sm font-medium">USD - United States Dollar</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
