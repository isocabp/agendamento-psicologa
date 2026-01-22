import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type InsertAvailability } from "@shared/routes";

export function useAvailability() {
  return useQuery({
    queryKey: [api.availability.list.path],
    queryFn: async () => {
      const res = await fetch(api.availability.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch availability");
      return api.availability.list.responses[200].parse(await res.json());
    },
  });
}

export function useUpdateAvailability() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertAvailability[]) => {
      const res = await fetch(api.availability.update.path, {
        method: api.availability.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update availability");
      return api.availability.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.availability.list.path] });
    },
  });
}
