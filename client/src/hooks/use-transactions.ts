import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type TransactionResponse } from "@shared/routes";
import { parseWithLogging } from "@/lib/utils";

type QueryParams = {
  type?: string;
  startDate?: string;
  endDate?: string;
  categoryId?: number;
};

export function useTransactions(params?: QueryParams) {
  return useQuery({
    queryKey: [api.transactions.list.path, params],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, val]) => {
          if (val !== undefined && val !== "") queryParams.append(key, String(val));
        });
      }
      const url = `${api.transactions.list.path}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch transactions");
      const data = await res.json();
      return parseWithLogging<TransactionResponse[]>(api.transactions.list.responses[200], data, "transactions.list");
    },
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(api.transactions.create.path, {
        method: api.transactions.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create transaction");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.transactions.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.reports.dashboard.path] });
      queryClient.invalidateQueries({ queryKey: [api.reports.daily.path] });
    },
  });
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: any & { id: number }) => {
      const url = buildUrl(api.transactions.update.path, { id });
      const res = await fetch(url, {
        method: api.transactions.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update transaction");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.transactions.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.reports.dashboard.path] });
      queryClient.invalidateQueries({ queryKey: [api.reports.daily.path] });
    },
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.transactions.delete.path, { id });
      const res = await fetch(url, {
        method: api.transactions.delete.method,
        credentials: "include"
      });
      if (!res.ok) throw new Error("Failed to delete transaction");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.transactions.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.reports.dashboard.path] });
      queryClient.invalidateQueries({ queryKey: [api.reports.daily.path] });
    },
  });
}
