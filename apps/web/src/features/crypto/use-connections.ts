/**
 * React Query hooks for connections
 * Story: 2.7 Connection Settings
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getConnections,
  createConnection,
  deleteConnection,
  validateConnection,
} from "@/api/client";
import type {
  ConnectionDto,
  CreateConnectionDto,
  ValidationResultDto,
} from "@repo/api-types";

const CONNECTIONS_KEY = ["connections"];

/**
 * Hook to fetch all user connections
 */
export function useConnections() {
  return useQuery<ConnectionDto[], Error>({
    queryKey: CONNECTIONS_KEY,
    queryFn: getConnections,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to create a new connection
 */
export function useCreateConnection() {
  const queryClient = useQueryClient();

  return useMutation<ConnectionDto, Error, CreateConnectionDto>({
    mutationFn: createConnection,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONNECTIONS_KEY });
    },
  });
}

/**
 * Hook to delete a connection
 */
export function useDeleteConnection() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: deleteConnection,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONNECTIONS_KEY });
    },
  });
}

/**
 * Hook to validate connection credentials (dry-run)
 */
export function useValidateConnection() {
  return useMutation<ValidationResultDto, Error, CreateConnectionDto>({
    mutationFn: validateConnection,
  });
}
