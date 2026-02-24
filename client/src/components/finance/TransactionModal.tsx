import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateTransaction, useUpdateTransaction } from "@/hooks/use-transactions";
import { useCategories, useCreateCategory } from "@/hooks/use-categories";
import { Loader2, Plus, ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  amount: z.coerce.string().min(1, "Amount is required"),
  type: z.enum(["debit", "credit"]),
  categoryId: z.coerce.number().optional(),
  notes: z.string().optional(),
});

type TransactionFormValues = z.infer<typeof formSchema>;

export function TransactionModal({ 
  children,
  transactionToEdit,
  defaultType = "debit"
}: { 
  children?: React.ReactNode, 
  transactionToEdit?: any,
  defaultType?: "debit" | "credit"
}) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const createMutation = useCreateTransaction();
  const updateMutation = useUpdateTransaction();
  const { data: categories } = useCategories();
  
  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: "",
      type: defaultType,
      categoryId: undefined,
      notes: "",
    },
  });

  const type = form.watch("type");

  useEffect(() => {
    if (transactionToEdit && open) {
      form.reset({
        amount: transactionToEdit.amount,
        type: transactionToEdit.type,
        categoryId: transactionToEdit.categoryId,
        notes: transactionToEdit.notes || "",
      });
    } else if (!transactionToEdit && open) {
      form.reset({
        amount: "",
        type: defaultType,
        categoryId: undefined,
        notes: "",
      });
    }
  }, [transactionToEdit, open, form, defaultType]);

  const onSubmit = async (values: TransactionFormValues) => {
    try {
      if (transactionToEdit) {
        await updateMutation.mutateAsync({ id: transactionToEdit.id, ...values });
        toast({ title: "Transaction updated" });
      } else {
        await createMutation.mutateAsync(values);
        toast({ title: "Transaction created" });
      }
      setOpen(false);
    } catch (error: any) {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to save transaction",
        variant: "destructive"
      });
    }
  };

  const filteredCategories = categories?.filter(c => c.type === type) || [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant={defaultType === "credit" ? "outline" : "default"} className={cn(
            "gap-2",
            defaultType === "credit" && "text-positive border-positive/30 hover:bg-positive/10 hover:text-positive",
            defaultType === "debit" && "bg-destructive text-destructive-foreground hover:bg-destructive/90"
          )}>
            {defaultType === "credit" ? <ArrowUpCircle className="w-4 h-4" /> : <ArrowDownCircle className="w-4 h-4" />}
            Add {defaultType === "credit" ? "Income" : "Expense"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            {transactionToEdit ? "Edit Transaction" : `New ${type === "credit" ? "Income" : "Expense"}`}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="debit">Expense (Debit)</SelectItem>
                      <SelectItem value="credit">Income (Credit)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                      <Input 
                        type="number" 
                        step="0.01" 
                        placeholder="0.00" 
                        className={cn("pl-7 text-lg font-medium", type === "credit" ? "text-positive" : "text-negative")}
                        {...field} 
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={(v) => field.onChange(parseInt(v))} value={field.value?.toString()}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {filteredCategories.map((c) => (
                        <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Grocery, Salary, etc..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="pt-4 flex justify-end">
              <Button 
                type="button" 
                variant="ghost" 
                className="mr-2"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createMutation.isPending || updateMutation.isPending}
                className={cn(type === "credit" ? "bg-positive hover:bg-positive/90" : "bg-destructive hover:bg-destructive/90")}
              >
                {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {transactionToEdit ? "Update" : "Save"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
