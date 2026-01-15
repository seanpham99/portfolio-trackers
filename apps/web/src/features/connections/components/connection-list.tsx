"use client";

import { useConnections } from "../hooks/use-connections";
import { ConnectionCard } from "./connection-card";
import { Button } from "@workspace/ui/components/button";
import { Plus } from "lucide-react";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
  EmptyMedia,
} from "@workspace/ui/components/empty";
import { Link2 } from "lucide-react";

interface ConnectionListProps {
  onAddClick: () => void;
}

export function ConnectionList({ onAddClick }: ConnectionListProps) {
  const { data: connections, isLoading, isError } = useConnections();

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-[180px] rounded-xl bg-zinc-900 animate-pulse" />
        ))}
      </div>
    );
  }

  if (isError) {
    return <div className="text-red-500">Failed to load connections</div>;
  }

  if (!connections?.length) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Link2 className="h-6 w-6" />
          </EmptyMedia>
          <EmptyTitle>No connections yet</EmptyTitle>
          <EmptyDescription>
            Connect your brokerage accounts or wallets to automatically sync your holdings.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button onClick={onAddClick}>
            <Plus className="mr-2 h-4 w-4" /> Add Connection
          </Button>
        </EmptyContent>
      </Empty>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {connections.map((connection) => (
        <ConnectionCard key={connection.id} connection={connection} />
      ))}
    </div>
  );
}
