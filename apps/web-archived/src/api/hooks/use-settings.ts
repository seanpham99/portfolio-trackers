import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/api/client";
import { UserSettingsDto, UpdateUserSettingsDto } from "@workspace/api-types";

export function useSettings() {
  return useQuery({
    queryKey: ["settings"],
    queryFn: async (): Promise<UserSettingsDto> => {
      const res = await apiFetch("/me/settings");
      if (!res.ok) {
        throw new Error("Failed to fetch settings");
      }
      return res.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      updates: UpdateUserSettingsDto,
    ): Promise<UserSettingsDto> => {
      const res = await apiFetch("/me/settings", {
        method: "PATCH",
        body: JSON.stringify(updates),
      });

      if (!res.ok) {
        throw new Error("Failed to update settings");
      }

      return res.json();
    },
    onSuccess: (data) => {
      // Update the cache immediately
      queryClient.setQueryData(["settings"], data);
    },
  });
}
