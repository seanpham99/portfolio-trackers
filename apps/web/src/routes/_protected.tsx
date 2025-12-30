import { Outlet, useLoaderData, useRevalidator } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createClient as createBrowserClient } from "@/lib/supabase/client";
import {
  getUserPreferences,
  hasAcceptedLatestPrivacy,
  upsertUserPreferences,
  generateAuditHash,
  MIN_REQUIRED_PRIVACY_VERSION,
  type AuditMetadata,
} from "@/lib/supabase/preferences";
import { PrivacyConsentModal } from "@/features/auth/privacy-consent-modal";
import { useState, useEffect } from "react";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireAuth(request);
  const { supabase } = createClient(request);

  try {
    const preferences = await getUserPreferences(supabase, user.id);
    const acceptedLatest = hasAcceptedLatestPrivacy(preferences);

    return {
      user,
      preferences,
      acceptedLatest,
      currentVersion: MIN_REQUIRED_PRIVACY_VERSION,
      error: null,
    };
  } catch (error) {
    console.error("Failed to load user preferences:", error);
    // On error, treat as if consent is not accepted (fail-safe)
    return {
      user,
      preferences: null,
      acceptedLatest: false,
      currentVersion: MIN_REQUIRED_PRIVACY_VERSION,
      error: "Failed to load preferences. Please try again.",
    };
  }
}

export default function ProtectedLayout() {
  const { user, acceptedLatest, currentVersion } =
    useLoaderData<typeof loader>();
  const revalidator = useRevalidator();
  const [showModal, setShowModal] = useState(!acceptedLatest);
  const [isPending, setIsPending] = useState(false);

  // Sync modal state with loader data
  useEffect(() => {
    setShowModal(!acceptedLatest);
  }, [acceptedLatest]);

  const handleAccept = async () => {
    setIsPending(true);
    try {
      const supabase = createBrowserClient();

      // Generate audit metadata
      const auditHash = await generateAuditHash(
        "client-ip",
        navigator.userAgent,
      );
      const auditMetadata: AuditMetadata = {
        hash: auditHash,
        ua: navigator.userAgent,
        locale: navigator.language || "en",
      };

      await upsertUserPreferences(supabase, user.id, {
        consent_granted: true,
        consent_version: currentVersion,
        consent_at: new Date().toISOString(),
        audit_metadata: auditMetadata,
      });

      //Revalidate to update loader data
      revalidator.revalidate();
      setShowModal(false);
    } catch (error) {
      console.error("Failed to save consent:", error);
      throw error;
    } finally {
      setIsPending(false);
    }
  };

  const handleDecline = async () => {
    const supabase = createBrowserClient();
    await supabase.auth.signOut();
    window.location.href = "/consent-required";
  };

  // CRITICAL FIX: Only render protected content when consent is accepted
  // This prevents bypass via timing/race conditions.
  // We wrap the modal in a full-screen container to ensure it's centered and blocks all content.
  if (showModal) {
    return (
      <main className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950 p-4">
        <div className="w-full max-w-md">
          <PrivacyConsentModal
            isOpen={showModal}
            onOpenChange={setShowModal}
            currentVersion={currentVersion}
            onAccept={handleAccept}
            onDecline={handleDecline}
          />
        </div>
      </main>
    );
  }

  return <Outlet />;
}
