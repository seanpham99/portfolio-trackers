/**
 * Connections Settings Page
 * Story: 2.7 Connection Settings
 */

import { useState } from "react";
import { Link } from "react-router";
import { ArrowLeft, Link as LinkIcon } from "lucide-react";
import { ExchangeId, type ConnectionDto } from "@workspace/api-types";
import {
  useConnections,
  useDeleteConnection,
} from "@/features/crypto/use-connections";
import { IntegrationCard, ConnectionModal } from "@/features/crypto";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent } from "@workspace/ui/components/card";
import { Spinner } from "@workspace/ui/components/spinner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog";

export default function ConnectionsSettingsPage() {
  const [selectedExchange, setSelectedExchange] = useState<ExchangeId | null>(
    null,
  );
  const [deleteConnectionId, setDeleteConnectionId] = useState<string | null>(
    null,
  );

  const { data: connections, isLoading, error } = useConnections();
  const deleteMutation = useDeleteConnection();

  // All supported exchanges
  const exchanges: ExchangeId[] = [ExchangeId.BINANCE, ExchangeId.OKX];

  // Map connections by exchange for quick lookup
  const connectionsByExchange = (connections?.reduce(
    (acc, conn) => {
      acc[conn.exchange] = conn;
      return acc;
    },
    {} as Record<ExchangeId, ConnectionDto>,
  ) ?? {}) as Record<ExchangeId, ConnectionDto>;

  const handleConnect = (exchange: ExchangeId) => {
    setSelectedExchange(exchange);
  };

  const handleDisconnect = (connectionId: string) => {
    setDeleteConnectionId(connectionId);
  };

  const confirmDelete = async () => {
    if (!deleteConnectionId) return;

    try {
      await deleteMutation.mutateAsync(deleteConnectionId);
    } finally {
      setDeleteConnectionId(null);
    }
  };

  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <Button
            variant="ghost"
            asChild
            className="mb-4 -ml-3 text-muted-foreground hover:text-foreground"
          >
            <Link to="/settings">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Settings
            </Link>
          </Button>
          <h1 className="text-2xl font-semibold text-foreground sm:text-3xl lg:text-4xl">
            Exchange Connections
          </h1>
          <p className="text-muted-foreground mt-2">
            Connect your crypto exchange accounts to automatically sync your
            portfolio balances.
          </p>
        </div>

        {/* Error State */}
        {error && (
          <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-4 text-red-400 mb-6">
            Failed to load connections: {error.message}
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2].map((i) => (
              <Card key={i}>
                <CardContent className="flex items-center justify-center py-8">
                  <Spinner className="size-8" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Connections Grid */}
        {!isLoading && connections && connections.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2">
            {exchanges.map((exchange) => (
              <IntegrationCard
                key={exchange}
                exchange={exchange}
                connection={connectionsByExchange[exchange]}
                onConnect={handleConnect}
                onDisconnect={handleDisconnect}
                isLoading={deleteMutation.isPending}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && connections && connections.length === 0 && (
          <div className="text-center py-16">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-indigo-500/10 mb-4">
              <LinkIcon className="h-8 w-8 text-indigo-400" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">
              No connections yet
            </h3>
            <p className="text-zinc-400 mb-6 max-w-md mx-auto">
              Connect your first exchange to automatically sync your crypto
              portfolio balances.
            </p>
            <div className="grid gap-4 md:grid-cols-2 max-w-2xl mx-auto">
              {exchanges.map((exchange) => (
                <IntegrationCard
                  key={exchange}
                  exchange={exchange}
                  connection={connectionsByExchange[exchange]}
                  onConnect={handleConnect}
                  onDisconnect={handleDisconnect}
                  isLoading={deleteMutation.isPending}
                />
              ))}
            </div>
          </div>
        )}

        {/* Security Notice */}
        <Card className="mt-8">
          <CardContent>
            <h3 className="font-medium text-sm mb-2 text-white">
              🔒 Security Note
            </h3>
            <p className="text-sm text-zinc-400">
              Your API credentials are encrypted at rest using industry-standard
              AES-256-GCM encryption. We recommend using read-only API keys with
              IP restrictions for maximum security. Your API secret is never
              displayed after saving.
            </p>
          </CardContent>
        </Card>

        {/* Connection Modal */}
        <ConnectionModal
          exchange={selectedExchange}
          open={!!selectedExchange}
          onOpenChange={(open) => !open && setSelectedExchange(null)}
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          open={!!deleteConnectionId}
          onOpenChange={() => setDeleteConnectionId(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Disconnect Exchange?</AlertDialogTitle>
              <AlertDialogDescription>
                This will remove your API credentials and stop automatic
                syncing. You can reconnect at any time.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Disconnect
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
