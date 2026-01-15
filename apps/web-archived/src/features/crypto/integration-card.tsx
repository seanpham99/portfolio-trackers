/**
 * Integration Card Component
 * Displays exchange connection status with connect/disconnect actions
 * Story: 2.7 Connection Settings
 */

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Button } from "@workspace/ui/components/button";
import { Badge } from "@workspace/ui/components/badge";
import {
  ExchangeId,
  ConnectionStatus,
  type ConnectionDto,
} from "@workspace/api-types";
import { cn } from "@workspace/ui/lib/utils";

// Exchange logos as simple SVG icons
const EXCHANGE_LOGOS: Record<ExchangeId, React.ReactNode> = {
  [ExchangeId.BINANCE]: (
    <svg viewBox="0 0 126.61 126.61" className="h-8 w-8">
      <g fill="currentColor">
        <polygon points="38.17 53.54 63.3 28.41 88.44 53.54 103.44 38.54 63.3 -1.6 23.17 38.54 38.17 53.54" />
        <polygon points="63.3 98.29 38.17 73.16 23.17 88.16 63.3 128.29 103.44 88.16 88.44 73.16 63.3 98.29" />
        <polygon points="0 63.3 15 78.3 30 63.3 15 48.3 0 63.3" />
        <polygon points="111.61 48.3 96.61 63.3 111.61 78.3 126.61 63.3 111.61 48.3" />
        <polygon points="63.3 48.3 48.3 63.3 63.3 78.3 78.3 63.3 63.3 48.3" />
      </g>
    </svg>
  ),
  [ExchangeId.OKX]: (
    <svg viewBox="0 0 256 256" className="h-8 w-8">
      <g fill="currentColor">
        <rect x="0" y="0" width="76" height="76" rx="4" />
        <rect x="90" y="0" width="76" height="76" rx="4" />
        <rect x="180" y="0" width="76" height="76" rx="4" />
        <rect x="0" y="90" width="76" height="76" rx="4" />
        <rect x="180" y="90" width="76" height="76" rx="4" />
        <rect x="0" y="180" width="76" height="76" rx="4" />
        <rect x="90" y="180" width="76" height="76" rx="4" />
        <rect x="180" y="180" width="76" height="76" rx="4" />
      </g>
    </svg>
  ),
};

const EXCHANGE_NAMES: Record<ExchangeId, string> = {
  [ExchangeId.BINANCE]: "Binance",
  [ExchangeId.OKX]: "OKX",
};

const EXCHANGE_DESCRIPTIONS: Record<ExchangeId, string> = {
  [ExchangeId.BINANCE]:
    "Connect your Binance account to automatically sync spot balances.",
  [ExchangeId.OKX]:
    "Connect your OKX account to automatically sync spot balances.",
};

interface IntegrationCardProps {
  exchange: ExchangeId;
  connection?: ConnectionDto;
  onConnect: (exchange: ExchangeId) => void;
  onDisconnect: (connectionId: string) => void;
  isLoading?: boolean;
}

export function IntegrationCard({
  exchange,
  connection,
  onConnect,
  onDisconnect,
  isLoading = false,
}: IntegrationCardProps) {
  const isConnected = !!connection;
  const status = connection?.status ?? ConnectionStatus.DISCONNECTED;

  const statusColors: Record<ConnectionStatus, string> = {
    [ConnectionStatus.ACTIVE]:
      "bg-green-500/10 text-green-500 border-green-500/20",
    [ConnectionStatus.INVALID]: "bg-red-500/10 text-red-500 border-red-500/20",
    [ConnectionStatus.DISCONNECTED]:
      "bg-muted text-muted-foreground border-muted",
  };

  const statusLabels: Record<ConnectionStatus, string> = {
    [ConnectionStatus.ACTIVE]: "Connected",
    [ConnectionStatus.INVALID]: "Error",
    [ConnectionStatus.DISCONNECTED]: "Not Connected",
  };

  return (
    <Card className="relative overflow-hidden bg-white/5 border-white/10 hover:bg-white/[0.07] transition-colors">
      <CardHeader className="flex flex-row items-center gap-4 pb-2">
        <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-white/5 text-zinc-300">
          {EXCHANGE_LOGOS[exchange]}
        </div>
        <div className="flex-1">
          <CardTitle className="text-lg text-white">
            {EXCHANGE_NAMES[exchange]}
          </CardTitle>
          <CardDescription className="text-sm text-zinc-400">
            {EXCHANGE_DESCRIPTIONS[exchange]}
          </CardDescription>
        </div>
        <Badge
          variant="outline"
          className={cn("capitalize", statusColors[status])}
        >
          {statusLabels[status]}
        </Badge>
      </CardHeader>
      <CardContent className="pt-2">
        {isConnected && (
          <div className="mb-3 space-y-1 text-xs text-zinc-500">
            {connection.apiKeyMasked && (
              <p>API Key: {connection.apiKeyMasked}</p>
            )}
            {connection.lastSyncedAt && (
              <p>
                Last synced:{" "}
                {new Date(connection.lastSyncedAt).toLocaleString()}
              </p>
            )}
          </div>
        )}
        <div className="flex items-center justify-end">
          <div className="flex gap-2">
            {isConnected ? (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onDisconnect(connection.id)}
                disabled={isLoading}
              >
                Disconnect
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => onConnect(exchange)}
                disabled={isLoading}
                className="bg-indigo-500 hover:bg-indigo-600 text-white"
              >
                Connect
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
