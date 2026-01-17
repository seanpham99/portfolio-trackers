import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getUserSettings, updateUserSettings } from "@/api/client";
import { UpdateUserSettingsDto, UserSettingsDto } from "@workspace/shared-types/api";

export const useUserSettings = () => {
  return useQuery({
    queryKey: ["user-settings"],
    queryFn: getUserSettings,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useUpdateUserSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateUserSettingsDto) => updateUserSettings(data),
    onMutate: async (newData) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ["user-settings"] });

      // Snapshot the previous value
      const previousSettings = queryClient.getQueryData(["user-settings"]);

      // Optimistically update to the new value
      queryClient.setQueryData(["user-settings"], (old: UserSettingsDto | undefined) => ({
        ...old,
        ...newData,
      }));

      // Return a context object with the snapshotted value
      return { previousSettings };
    },
    onError: (err, newData, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousSettings) {
        queryClient.setQueryData(["user-settings"], context.previousSettings);
      }
    },
    onSettled: () => {
      // Always refetch after error or success to ensure data is in sync
      queryClient.invalidateQueries({ queryKey: ["user-settings"] });
    },
  });
};
