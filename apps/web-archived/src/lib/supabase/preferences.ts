import type { SupabaseClient } from "@supabase/supabase-js";
import type { UserPreferences } from "@repo/database-types";

// Type-safe audit metadata structure for PDPA compliance
export interface AuditMetadata {
  hash: string; // SHA-256 hash of salted IP+UA
  ua: string; // User agent string
  locale: string; // Accept-Language header
  [key: string]: string | number | boolean | null | undefined;
}

/**
 * Fetches user preferences for a specific user.
 */
export async function getUserPreferences(
  supabase: SupabaseClient,
  userId: string,
) {
  const { data, error } = await supabase
    .from("user_preferences")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Error fetching user preferences:", error);
    return null;
  }

  return data;
}

/**
 * Upserts user preferences (used for privacy consent).
 */
export async function upsertUserPreferences(
  supabase: SupabaseClient,
  userId: string,
  preferences: Partial<
    Omit<UserPreferences, "id" | "user_id" | "created_at" | "updated_at">
  > & {
    consent_version: string;
  },
) {
  const { data, error } = await supabase
    .from("user_preferences")
    .upsert(
      {
        user_id: userId,
        ...preferences,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    )
    .select()
    .single();

  if (error) {
    console.error("Error upserting user preferences:", error);
    throw new Error(error.message);
  }

  return data;
}

/**
 * Generates an anonymized audit hash for compliance.
 * Uses Web Crypto API for hashing.
 * In browser context, uses a client-side salt. For production,
 * audit hashes should be generated server-side.
 */
export async function generateAuditHash(ip: string, userAgent: string) {
  // Use Vite's import.meta.env for browser or fallback to timestamp-based salt
  const salt =
    typeof import.meta !== "undefined"
      ? import.meta.env?.VITE_AUDIT_SALT || `client-${Date.now()}`
      : `client-${Date.now()}`;

  const data = `${ip}:${userAgent}:${salt}`;

  // Web Crypto API (available in Node 20+ and most browsers)
  const encoder = new TextEncoder();
  const encodedData = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest("SHA-256", encodedData);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return hashHex;
}

/**
 * Check if the user has accepted the required privacy version.
 */
export const MIN_REQUIRED_PRIVACY_VERSION = "2025-12-a";

export function hasAcceptedLatestPrivacy(preferences: UserPreferences | null) {
  if (!preferences) return false;
  if (!preferences.consent_granted) return false;

  // Simple string comparison for versions, or more complex semver if needed
  return preferences.consent_version >= MIN_REQUIRED_PRIVACY_VERSION;
}
