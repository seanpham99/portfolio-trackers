"use client";

import { useState } from "react";
import { ConnectionList } from "@/features/connections/components/connection-list";
import { AddConnectionModal } from "@/features/connections/components/add-connection-modal";
import { Separator } from "@workspace/ui/components/separator";

export default function ConnectionsPage() {
  const [isAddOpen, setIsAddOpen] = useState(false);

  return (
    <div className="space-y-6 container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
       <div>
        <h3 className="text-lg font-medium">Connections</h3>
        <p className="text-sm text-muted-foreground">
           Connect your brokerage accounts, wallets, and exchanges to automatically import holdings.
        </p>
      </div>
      <Separator />
      
      <ConnectionList onAddClick={() => setIsAddOpen(true)} />
      
      <AddConnectionModal 
        isOpen={isAddOpen} 
        onClose={() => setIsAddOpen(false)} 
      />
    </div>
  );
}
