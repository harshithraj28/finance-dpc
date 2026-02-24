import { useDashboardMetrics, useDailyReports } from "@/hooks/use-reports";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { ArrowUpRight, ArrowDownRight, Activity, Wallet, CreditCard } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from "date-fns";
import { useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTransactions } from "@/hooks/use-transactions";

export default function Dashboard() {
  const queryClient = useQueryClient();
  const { data: metrics, isLoading: isLoadingMetrics } = useDashboardMetrics();
  const { data: reports, isLoading: isLoadingReports } = useDailyReports();
  const { data: transactions } = useTransactions();

  // Auto-seed data for new users
  const seedMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/seed', {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Seed failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      queryClient.invalidateQueries({ queryKey: ['/api/reports/dashboard'] });
    }
  });

  useEffect(() => {
    if (!transactions || transactions.length === 0) {
      seedMutation.mutate();
    }
  }, [transactions]);

  if (isLoadingMetrics || isLoadingReports) {
    return <div className="p-8 flex items-center justify-center h-full"><Activity className="w-8 h-8 animate-pulse text-primary" /></div>;
  }

  const chartData = reports?.map(r => ({
    date: format(new Date(r.reportDate), "MMM dd"),
    balance: parseFloat(r.totalCredit) - parseFloat(r.totalDebit),
    credit: parseFloat(r.totalCredit),
    debit: parseFloat(r.totalDebit),
  })).reverse() || [];

  return (
    <div className="p-6 md:p-8 space-y-8 animate-fade-in-up max-w-7xl mx-auto w-full">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back. Here's your financial overview.</p>
      </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
        <Card className="border-border/50 shadow-md shadow-black/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -z-10"></div>
          <CardHeader className="pb-2">
            <CardDescription className="font-semibold flex items-center gap-2">
              <Wallet className="w-4 h-4 text-primary" /> Outstanding Balance
            </CardDescription>
            <CardTitle className="text-4xl font-display tracking-tight text-foreground mt-2">
              {formatCurrency(metrics?.outstandingBalance || 0)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Net total across all time</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-md shadow-black/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-positive/5 rounded-bl-full -z-10"></div>
          <CardHeader className="pb-2">
            <CardDescription className="font-semibold flex items-center gap-2">
              <ArrowUpRight className="w-4 h-4 text-positive" /> Total Income
            </CardDescription>
            <CardTitle className="text-4xl font-display tracking-tight text-positive mt-2">
              {formatCurrency(metrics?.totalCredit || 0)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">+{formatCurrency(metrics?.todaySummary?.credit || 0)}</span> today
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-md shadow-black/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-destructive/5 rounded-bl-full -z-10"></div>
          <CardHeader className="pb-2">
            <CardDescription className="font-semibold flex items-center gap-2">
              <ArrowDownRight className="w-4 h-4 text-destructive" /> Total Expenses
            </CardDescription>
            <CardTitle className="text-4xl font-display tracking-tight text-destructive mt-2">
              {formatCurrency(metrics?.totalDebit || 0)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">-{formatCurrency(metrics?.todaySummary?.debit || 0)}</span> today
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50 shadow-lg shadow-black/5">
        <CardHeader>
          <CardTitle className="text-xl font-display">Net Balance Trend</CardTitle>
          <CardDescription>Your financial trajectory over recent reports</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(value) => `$${value}`}
                />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  formatter={(value: number) => [formatCurrency(value), "Balance"]}
                />
                <Area type="monotone" dataKey="balance" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorBalance)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
