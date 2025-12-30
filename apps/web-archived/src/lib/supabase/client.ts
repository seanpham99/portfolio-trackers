import { createBrowserClient } from "@supabase/ssr";
import { Database } from "@workspace/database-types";

export function createClient() {
  return createBrowserClient<Database>(
    import.meta.env.VITE_SUPABASE_URL!,
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_OR_ANON_KEY!,
  );
}
