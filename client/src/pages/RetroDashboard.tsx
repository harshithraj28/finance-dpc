import { useState, useMemo } from "react";
import { useTransactions, useCreateTransaction, useUpdateTransaction, useDeleteTransaction } from "@/hooks/use-transactions";
import { useDashboardMetrics } from "@/hooks/use-reports";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableTableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";

export default function RetroDashboard() {
  const { data: transactions, isLoading: isLoadingTxs } = useTransactions();
  const { data: metrics, isLoading: isLoadingMetrics } = useDashboardMetrics();
  const createTx = useCreateTransaction();
  const updateTx = useUpdateTransaction();
  const deleteTx = useDeleteTransaction();

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    amount: "",
    less: "0",
    type: "credit",
    notes: "",
    date: format(new Date(), "yyyy-MM-dd"),
  });

  const handleRowClick = (tx: any) => {
    setSelectedId(tx.id);
    setFormData({
      code: tx.code || "",
      name: tx.name || "",
      amount: tx.amount.toString(),
      less: (tx.less || "0").toString(),
      type: tx.type,
      notes: tx.notes || "",
      date: format(new Date(tx.date), "yyyy-MM-dd"),
    });
  };

  const handleSave = () => {
    if (selectedId) {
      updateTx.mutate({ id: selectedId, ...formData });
    } else {
      createTx.mutate(formData);
    }
    handleClear();
  };

  const handleClear = () => {
    setSelectedId(null);
    setFormData({
      code: "",
      name: "",
      amount: "",
      less: "0",
      type: "credit",
      notes: "",
      date: format(new Date(), "yyyy-MM-dd"),
    });
  };

  const handleDelete = () => {
    if (selectedId) {
      deleteTx.mutate(selectedId);
      handleClear();
    }
  };

  const sortedTransactions = useMemo(() => {
    return transactions ? [...transactions].sort((a, b) => b.id - a.id) : [];
  }, [transactions]);

  if (isLoadingTxs || isLoadingMetrics) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#3a6ea5]">
        <Loader2 className="w-10 h-10 animate-spin text-white" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#3a6ea5] p-4 font-mono text-sm overflow-auto">
      <div className="max-w-5xl mx-auto bg-[#c0c0c0] border-2 border-white border-r-[#808080] border-b-[#808080] shadow-[2px_2px_0_0_#000]">
        {/* Title Bar */}
        <div className="bg-[#000080] text-white p-1 flex justify-between items-center px-2 font-bold">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-[#c0c0c0] border border-white border-r-[#808080] border-b-[#808080]" />
            <span>Receipts/Payments</span>
          </div>
          <div className="flex gap-1">
            <button className="w-5 h-5 bg-[#c0c0c0] text-black flex items-center justify-center border border-white border-r-[#808080] border-b-[#808080] text-xs">_</button>
            <button className="w-5 h-5 bg-[#c0c0c0] text-black flex items-center justify-center border border-white border-r-[#808080] border-b-[#808080] text-xs">□</button>
            <button className="w-5 h-5 bg-red-600 text-white flex items-center justify-center border border-white border-r-[#808080] border-b-[#808080] text-xs">X</button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          <h1 className="text-center text-2xl font-bold underline decoration-double text-[#000080] mb-4">RECEIPTS</h1>

          {/* Form Area */}
          <div className="border-2 border-[#808080] border-r-white border-b-white p-4 space-y-4 bg-[#d4d4d4] rounded-xl shadow-inner">
            <div className="grid grid-cols-12 gap-4 items-center">
              <div className="col-span-2 flex items-center gap-2">
                <span className="font-bold">Serial</span>
                <div className="flex-1 bg-orange-400 border border-black p-1 text-center font-bold">
                  {selectedId || "NEW"}
                </div>
              </div>
              <div className="col-span-10 flex justify-end items-center gap-2">
                <span className="font-bold">Date</span>
                <input 
                  type="date" 
                  className="bg-white border border-black p-1"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-12 gap-4 items-center">
              <div className="col-span-4 flex items-center gap-2">
                <span className="font-bold w-12">Code</span>
                <input 
                  className="flex-1 bg-orange-300 border border-black p-1"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                />
              </div>
              <div className="col-span-8 flex items-center gap-2">
                <span className="font-bold w-12">Name</span>
                <input 
                  className="flex-1 bg-orange-400 border border-black p-1"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-12 gap-4 items-center">
              <div className="col-span-4 flex items-center gap-2">
                <span className="font-bold w-12">Amount</span>
                <input 
                  type="number"
                  className="flex-1 bg-yellow-200 border border-black p-1 font-bold"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                />
              </div>
              <div className="col-span-4 flex items-center gap-2">
                <span className="font-bold w-12">Less</span>
                <input 
                  type="number"
                  className="flex-1 bg-purple-400 border border-black p-1 text-white font-bold"
                  value={formData.less}
                  onChange={(e) => setFormData({ ...formData, less: e.target.value })}
                />
              </div>
              <div className="col-span-4 flex items-center gap-2">
                <span className="font-bold w-12">Type</span>
                <select 
                  className={`flex-1 border border-black p-1 font-bold ${formData.type === 'credit' ? 'bg-green-500 text-black' : 'bg-red-500 text-white'}`}
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                  <option value="credit">Credit</option>
                  <option value="debit">Debit</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-bold w-12">Detail</span>
              <input 
                className="flex-1 bg-cyan-200 border border-black p-1"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button onClick={handleSave} className="bg-[#c0c0c0] border-2 border-white border-r-[#808080] border-b-[#808080] px-6 py-1 font-bold active:border-[#808080] active:border-r-white active:border-b-white">Save</button>
            <button onClick={handleClear} className="bg-[#c0c0c0] border-2 border-white border-r-[#808080] border-b-[#808080] px-6 py-1 font-bold active:border-[#808080] active:border-r-white active:border-b-white">Edit</button>
            <button onClick={handleDelete} className="bg-[#c0c0c0] border-2 border-white border-r-[#808080] border-b-[#808080] px-6 py-1 font-bold active:border-[#808080] active:border-r-white active:border-b-white disabled:opacity-50" disabled={!selectedId}>Delete</button>
            <button className="bg-[#c0c0c0] border-2 border-white border-r-[#808080] border-b-[#808080] px-6 py-1 font-bold active:border-[#808080] active:border-r-white active:border-b-white">Close</button>
            <button className="bg-[#c0c0c0] border-2 border-white border-r-[#808080] border-b-[#808080] px-6 py-1 font-bold active:border-[#808080] active:border-r-white active:border-b-white">Date Modify</button>
          </div>

          {/* Data Grid */}
          <div className="border-2 border-[#808080] bg-white h-80 overflow-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-cyan-400 sticky top-0 font-bold border-b-2 border-black">
                <tr>
                  <th className="border-r border-black p-1">S No</th>
                  <th className="border-r border-black p-1">Name</th>
                  <th className="border-r border-black p-1">Detail</th>
                  <th className="border-r border-black p-1 text-right">Credit</th>
                  <th className="border-r border-black p-1 text-right">Debit</th>
                  <th className="p-1 text-right">Less</th>
                </tr>
              </thead>
              <tbody>
                {sortedTransactions.map((tx, idx) => (
                  <tr 
                    key={tx.id} 
                    onClick={() => handleRowClick(tx)}
                    className={`cursor-pointer border-b border-[#c0c0c0] hover:bg-blue-100 ${selectedId === tx.id ? 'bg-blue-200' : ''}`}
                  >
                    <td className="border-r border-[#c0c0c0] p-1 font-bold text-blue-800">{tx.id}</td>
                    <td className="border-r border-[#c0c0c0] p-1 font-bold uppercase">{tx.name || "N/A"}</td>
                    <td className="border-r border-[#c0c0c0] p-1">{tx.notes || "Cash"}</td>
                    <td className="border-r border-[#c0c0c0] p-1 text-right font-bold">{tx.type === 'credit' ? tx.amount : '0'}</td>
                    <td className="border-r border-[#c0c0c0] p-1 text-right font-bold">{tx.type === 'debit' ? tx.amount : '0'}</td>
                    <td className="p-1 text-right font-bold">{tx.less || '0'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer Summary */}
          <div className="grid grid-cols-5 gap-0 border-2 border-[#808080] font-bold text-center bg-[#d4d4d4]">
            <div className="border-r border-[#808080] p-1">
              <div className="text-xs uppercase">Opening Balance</div>
              <div className="bg-white border border-black mt-1 p-1">0.00</div>
            </div>
            <div className="border-r border-[#808080] p-1">
              <div className="text-xs uppercase">Credit</div>
              <div className="bg-white border border-black mt-1 p-1 text-blue-800">{metrics?.totalCredit.toFixed(2)}</div>
            </div>
            <div className="border-r border-[#808080] p-1">
              <div className="text-xs uppercase">Debit</div>
              <div className="bg-white border border-black mt-1 p-1 text-red-600">{metrics?.totalDebit.toFixed(2)}</div>
            </div>
            <div className="border-r border-[#808080] p-1">
              <div className="text-xs uppercase">Balance</div>
              <div className="bg-white border border-black mt-1 p-1">{(metrics?.outstandingBalance || 0).toFixed(2)}</div>
            </div>
            <div className="p-1 bg-[#d4d4d4]">
              <div className="text-xs uppercase text-right mr-2 italic">Less</div>
              <div className="bg-white border border-black mt-1 p-1 text-red-600">{metrics?.totalLess?.toFixed(2) || "0.00"}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
