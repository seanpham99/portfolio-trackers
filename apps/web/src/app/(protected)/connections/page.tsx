"use client";

import { useState } from "react";
import { Button } from "@workspace/ui/components/button";
import { Separator } from "@workspace/ui/components/separator";
import { Plus, RefreshCw, Trash2 } from "lucide-react";
import { useConnections, useDeleteConnection } from "@/features/connections/hooks/use-connections";
import { BinanceConnectionForm } from "@/features/connections/components/binance-connection-form";
import { ConnectionDto } from "@workspace/shared-types/api";

function ConnectionCard({
  connection,
  onDelete,
}: {
  connection: ConnectionDto;
  onDelete: () => void;
}) {
  const deleteMutation = useDeleteConnection();

  const handleDelete = () => {
    if (confirm("Are you sure you want to remove this connection?")) {
      deleteMutation.mutate(connection.id);
      onDelete();
    }
  };

  return (
    <div className="glass-card p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center">
          <span className="text-lg font-bold text-amber-500">B</span>
        </div>
        <div>
          <p className="font-medium capitalize">{connection.exchange}</p>
          <p className="text-sm text-muted-foreground font-mono">{connection.apiKeyMasked}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span
          className={`text-xs px-2 py-1 rounded-full ${
            connection.status === "active"
              ? "bg-emerald-500/10 text-emerald-500"
              : "bg-red-500/10 text-red-500"
          }`}
        >
          {connection.status}
        </span>
        {connection.lastSyncedAt && (
          <span className="text-xs text-muted-foreground">
            Synced: {new Date(connection.lastSyncedAt).toLocaleDateString()}
          </span>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDelete}
          disabled={deleteMutation.isPending}
          className="text-muted-foreground hover:text-red-500"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default function ConnectionsPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { data: connections, isLoading, refetch } = useConnections();

  return (
    <div className="space-y-6 container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold font-sans tracking-tight">Connections</h3>
          <p className="text-muted-foreground">
            Connect your exchange accounts for automatic portfolio sync.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setIsFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Binance
          </Button>
        </div>
      </div>

      <Separator className="bg-border/50" />

      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading connections...</div>
        ) : !connections || connections.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <p className="text-lg font-medium mb-2">No connections yet</p>
            <p className="text-muted-foreground mb-4">
              Connect your Binance account to automatically sync your crypto holdings.
            </p>
            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Connection
            </Button>
          </div>
        ) : (
          connections.map((conn) => (
            <ConnectionCard key={conn.id} connection={conn} onDelete={() => refetch()} />
          ))
        )}
      </div>

      <BinanceConnectionForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} />
    </div>
  );
}
