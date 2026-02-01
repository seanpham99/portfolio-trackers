import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { User } from "@supabase/supabase-js";

// Define a more specific user type for our app context
export interface AppUser extends User {
  subscription_tier?: "free" | "pro";
}

const getUser = async (): Promise<AppUser | null> => {
  try {
    const response = await apiFetch("/auth/user");
    if (!response.ok) {
      // If the response is not ok, the user is likely not authenticated
      return null;
    }
    const data = await response.json();
    return data as AppUser;
  } catch (error) {
    // Errors can happen if the network fails or if the server is down
    console.error("Failed to fetch user:", error);
    return null;
  }
};

export const useUser = () => {
  return useQuery({
    queryKey: ["user"],
    queryFn: getUser,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
