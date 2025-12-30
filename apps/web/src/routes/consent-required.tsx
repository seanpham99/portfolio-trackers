import { Link } from "react-router";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@repo/ui/components/card";
import { Button } from "@repo/ui/components/button";
import { ShieldAlert } from "lucide-react";

export default function ConsentRequired() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 p-4">
      <Card className="glass-card max-w-md">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-amber-500/10 ring-1 ring-amber-500/20">
              <ShieldAlert className="h-8 w-8 text-amber-500" />
            </div>
          </div>
          <CardTitle className="font-serif text-2xl font-light text-foreground tracking-tight">
            Privacy Consent Required
          </CardTitle>
          <CardDescription className="text-muted-foreground mt-2">
            Access to Fin-Sight requires your consent to our privacy policy.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pb-8">
          <div className="p-4 rounded-lg bg-overlay-light border border-border text-sm text-foreground">
            <p className="leading-relaxed">
              You declined to provide privacy consent, which is required by{" "}
              <span className="text-amber-400 font-medium">
                PDPL (Vietnam 2026)
              </span>{" "}
              and <span className="text-amber-400 font-medium">GDPR</span>{" "}
              regulations.
            </p>
          </div>

          <div className="space-y-2 text-sm text-muted-foreground">
            <p>Without consent, we cannot:</p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>Process your portfolio data</li>
              <li>Store your preferences</li>
              <li>Provide personalized analytics</li>
            </ul>
          </div>

          <div className="pt-4 space-y-3">
            <Link to="/login" className="block">
              <Button className="w-full h-11 bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-lg shadow-emerald-900/20">
                Return to Login
              </Button>
            </Link>
            <p className="text-center text-xs text-muted-foreground">
              You can accept our privacy policy when you sign in again
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
