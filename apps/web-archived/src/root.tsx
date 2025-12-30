import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import "@repo/ui/styles/globals.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

import { Toaster } from "@repo/ui/components/sonner";
import { ThemeProvider, useTheme } from "next-themes";

function AppToaster() {
  const { theme } = useTheme();
  return <Toaster theme={theme as "light" | "dark" | "system" | undefined} />;
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Portfolios Tracker</title>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <Meta />
        <Links />
      </head>
      <body>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            storageKey="vite-ui-theme"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <AppToaster />
          </ThemeProvider>
        </QueryClientProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function Root() {
  return <Outlet />;
}
