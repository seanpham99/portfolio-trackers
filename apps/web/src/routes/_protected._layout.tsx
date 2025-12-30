import { Outlet, Link, useLoaderData } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { getUser } from "@/lib/auth";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request);
  return { user };
}

export default function Layout() {
  const { user } = useLoaderData<typeof loader>();

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="border-b border-border bg-background/80 px-8 py-4 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10">
              <span className="text-lg font-semibold text-emerald-400">F</span>
            </div>
            <span className="font-serif text-xl font-light tracking-tight text-foreground">
              Portfolios Tracker
            </span>
          </div>

          <div className="flex items-center gap-6">
            <nav className="flex items-center gap-6 text-sm">
              <Link
                className="text-muted-foreground transition-colors hover:text-foreground"
                to="/"
              >
                Overview
              </Link>
              <Link
                className="text-muted-foreground transition-colors hover:text-foreground"
                to="/history"
              >
                History
              </Link>
              <Link
                className="text-muted-foreground transition-colors hover:text-foreground"
                to="/analytics"
              >
                Analytics
              </Link>
              <Link
                className="text-muted-foreground transition-colors hover:text-foreground"
                to="/settings"
              >
                Settings
              </Link>
            </nav>

            <div className="h-5 w-px bg-border" />

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-overlay-light text-xs font-medium text-muted-foreground">
                  {user?.email?.charAt(0).toUpperCase()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden py-8">
        <Outlet />
      </main>

      <footer className="border-t border-border px-8 py-4">
        <p className="text-xs text-muted-foreground">
          Portfolios Tracker – All your assets in one place. ©{" "}
          {new Date().getFullYear()} All rights reserved.
        </p>
      </footer>
    </div>
  );
}
