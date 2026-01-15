"use client";

import { ConnectionDto } from "@workspace/shared-types/api";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import { Trash2, RefreshCw, CheckCircle, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useDeleteConnection } from "../hooks/use-connections";
import { useState } from "react";
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

interface ConnectionCardProps {
  connection: ConnectionDto;
}

export function ConnectionCard({ connection }: ConnectionCardProps) {
  const { mutate: deleteConnection, isPending: isDeleting } = useDeleteConnection();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleDelete = () => {
    deleteConnection(connection.id);
    setIsDeleteDialogOpen(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20";
      case "ERROR":
        return "bg-red-500/10 text-red-500 hover:bg-red-500/20";
      default:
        return "bg-zinc-500/10 text-zinc-500 hover:bg-zinc-500/20";
    }
  };

  const statusIcon = {
    ACTIVE: <CheckCircle className="mr-1 h-3 w-3" />,
    ERROR: <AlertCircle className="mr-1 h-3 w-3" />,
    SYNCING: <RefreshCw className="mr-1 h-3 w-3 animate-spin" />,
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="space-y-1">
            <CardTitle className="text-base font-medium">
              {connection.institution_name}
            </CardTitle>
            <CardDescription className="text-xs">
              ID: {connection.institution_id}
            </CardDescription>
          </div>
          <Badge
            variant="outline"
            className={`border-0 ${getStatusColor(connection.status)}`}
          >
            {statusIcon[connection.status as keyof typeof statusIcon]}
            {connection.status}
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="text-xs text-muted-foreground">
            <p>Last synced: {connection.last_synced_at ? formatDistanceToNow(new Date(connection.last_synced_at), { addSuffix: true }) : 'Never'}</p>
          </div>
        </CardContent>
        <CardFooter className="justify-end pt-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-red-500"
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Remove
          </Button>
        </CardFooter>
      </Card>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Connection?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the connection to {connection.institution_name} and stop syncing data. 
              Existing data may be preserved but no new updates will be received.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Removing..." : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
