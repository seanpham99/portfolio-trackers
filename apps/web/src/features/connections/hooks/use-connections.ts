import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getConnections,
  createConnection,
  validateConnection,
  deleteConnection,
} from "@/api/client";
import { CreateConnectionDto } from "@workspace/shared-types/api";
import { toast } from "sonner";

export const useConnections = () => {
  return useQuery({
    queryKey: ["connections"],
    queryFn: getConnections,
  });
};

export const useCreateConnection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateConnectionDto) => createConnection(data),
    onSuccess: () => {
      toast.success("Connection added successfully");
      queryClient.invalidateQueries({ queryKey: ["connections"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

export const useValidateConnection = () => {
  return useMutation({
    mutationFn: (data: CreateConnectionDto) => validateConnection(data),
    onError: (error: Error) => {
      // Validation errors are handled in the UI usually, but toast here just in case
      // toast.error(error.message);
      // We might not want to toast on validation failure if it's just a form check
    },
  });
};

export const useDeleteConnection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteConnection(id),
    onSuccess: () => {
      toast.success("Connection removed");
      queryClient.invalidateQueries({ queryKey: ["connections"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};
