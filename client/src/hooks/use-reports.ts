import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type DashboardResponse } from "@shared/routes";
import { parseWithLogging } from "@/lib/utils";

export function useDashboardMetrics() {
  return useQuery({
    queryKey: [api.reports.dashboard.path],
    queryFn: async () => {
      const res = await fetch(api.reports.dashboard.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch dashboard metrics");
      const data = await res.json();
      return parseWithLogging<DashboardResponse>(api.reports.dashboard.responses[200], data, "reports.dashboard");
    },
  });
}

export function useDailyReports() {
  return useQuery({
    queryKey: [api.reports.daily.path],
    queryFn: async () => {
      const res = await fetch(api.reports.daily.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch daily reports");
      const data = await res.json();
      return parseWithLogging<any[]>(api.reports.daily.responses[200], data, "reports.daily");
    },
  });
}

export function useGenerateReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (date: string) => {
      const res = await fetch(api.reports.generate.path, {
        method: api.reports.generate.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to generate report");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.reports.daily.path] });
    }
  });
}
