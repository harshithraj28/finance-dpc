import { useState } from "react";
import { format } from "date-fns";
import { Trash2, Edit2, ArrowDownCircle, ArrowUpCircle, Search } from "lucide-react";
import { useTransactions, useDeleteTransaction } from "@/hooks/use-transactions";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TransactionModal } from "@/components/finance/TransactionModal";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Transactions() {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: transactions, isLoading } = useTransactions();
  const deleteMutation = useDeleteTransaction();

  const filteredTransactions = transactions?.filter(t => 
    t.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.category?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto w-full animate-fade-in-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Transactions</h1>
          <p className="text-muted-foreground mt-1">Manage your income and expenses.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <TransactionModal defaultType="credit" />
          <TransactionModal defaultType="debit" />
        </div>
      </div>

      <Card className="border-border/50 shadow-md shadow-black/5 overflow-hidden">
        <div className="p-4 border-b border-border/50 bg-muted/20">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search by notes or category..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-background"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    Loading transactions...
                  </TableCell>
                </TableRow>
              ) : filteredTransactions?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    No transactions found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredTransactions?.map((t) => (
                  <TableRow key={t.id} className="group hover:bg-muted/30 transition-colors">
                    <TableCell className="font-medium text-foreground">
                      {format(new Date(t.date), "MMM dd, yyyy")}
                    </TableCell>
                    <TableCell>
                      {t.type === "credit" ? (
                        <Badge variant="outline" className="bg-positive/10 text-positive border-positive/20 gap-1">
                          <ArrowUpCircle className="w-3 h-3" /> Income
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 gap-1">
                          <ArrowDownCircle className="w-3 h-3" /> Expense
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {t.category ? (
                        <span className="px-2 py-1 bg-secondary rounded-md text-xs font-medium">
                          {t.category.name}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-sm italic">Uncategorized</span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate" title={t.notes || ""}>
                      {t.notes || "-"}
                    </TableCell>
                    <TableCell className={`text-right font-bold tracking-tight ${t.type === "credit" ? "text-positive" : "text-negative"}`}>
                      {t.type === "credit" ? "+" : "-"}{formatCurrency(t.amount)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <TransactionModal transactionToEdit={t}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10 hover:text-primary">
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        </TransactionModal>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Transaction?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete this transaction and update your balances. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => deleteMutation.mutate(t.id)}
                                className="bg-destructive hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
