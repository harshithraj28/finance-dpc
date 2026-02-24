import { useRef, useState } from "react";
import { format } from "date-fns";
import { Download, FileText, Printer, FileDown, Loader2 } from "lucide-react";
import { useDailyReports, useGenerateReport } from "@/hooks/use-reports";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

// Dynamic import of heavier libraries so they don't block initial load
const getExportLibs = async () => {
  const html2canvas = (await import("html2canvas")).default;
  const { jsPDF } = await import("jspdf");
  return { html2canvas, jsPDF };
};

export default function Reports() {
  const { data: reports, isLoading } = useDailyReports();
  const generateMutation = useGenerateReport();
  const reportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleGenerateToday = () => {
    generateMutation.mutate(format(new Date(), "yyyy-MM-dd"), {
      onSuccess: () => toast({ title: "Report generated successfully" }),
      onError: (err: any) => toast({ title: "Failed", description: err.message, variant: "destructive" })
    });
  };

  const exportToPDF = async () => {
    if (!reportRef.current) return;
    try {
      setIsExporting(true);
      const { html2canvas, jsPDF } = await getExportLibs();
      
      const canvas = await html2canvas(reportRef.current, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`FinTrack_Report_${format(new Date(), "yyyy-MM-dd")}.pdf`);
      
      toast({ title: "PDF exported successfully" });
    } catch (err) {
      toast({ title: "Export failed", variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  const exportToPNG = async () => {
    if (!reportRef.current) return;
    try {
      setIsExporting(true);
      const { html2canvas } = await getExportLibs();
      
      const canvas = await html2canvas(reportRef.current, { scale: 2 });
      const link = document.createElement('a');
      link.download = `FinTrack_Report_${format(new Date(), "yyyy-MM-dd")}.png`;
      link.href = canvas.toDataURL();
      link.click();
      
      toast({ title: "PNG exported successfully" });
    } catch (err) {
      toast({ title: "Export failed", variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto w-full animate-fade-in-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Daily Reports</h1>
          <p className="text-muted-foreground mt-1">Review and export your financial summaries.</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={handleGenerateToday} disabled={generateMutation.isPending}>
            {generateMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Printer className="w-4 h-4 mr-2" />}
            Generate Today
          </Button>
          <Button variant="outline" onClick={exportToPNG} disabled={isExporting || isLoading || !reports?.length}>
            <FileDown className="w-4 h-4 mr-2" /> PNG
          </Button>
          <Button onClick={exportToPDF} disabled={isExporting || isLoading || !reports?.length} className="shadow-lg shadow-primary/20">
            {isExporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
            Export PDF
          </Button>
        </div>
      </div>

      <div ref={reportRef} className="bg-card rounded-2xl border border-border/50 shadow-xl shadow-black/5 p-8 relative overflow-hidden">
        {/* Printable Header */}
        <div className="flex items-center justify-between mb-8 pb-6 border-b border-border/60">
          <div className="flex items-center gap-2 text-primary">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-bold text-xl text-foreground">FinTrack Report</h2>
              <p className="text-sm text-muted-foreground">Generated on {format(new Date(), "MMMM dd, yyyy")}</p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="py-20 text-center text-muted-foreground">Loading reports...</div>
        ) : !reports?.length ? (
          <div className="py-20 text-center flex flex-col items-center">
            <FileText className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-semibold">No reports available</h3>
            <p className="text-muted-foreground">Generate a report to see your summaries here.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {reports.map((report) => {
              const netChange = parseFloat(report.netChange);
              const isPositive = netChange >= 0;
              
              return (
                <div key={report.id} className="p-6 rounded-xl border border-border/40 bg-muted/10">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold font-display">
                      {format(new Date(report.reportDate), "EEEE, MMMM dd, yyyy")}
                    </h3>
                    <div className={`px-4 py-1.5 rounded-full text-sm font-bold ${isPositive ? 'bg-positive/10 text-positive' : 'bg-destructive/10 text-destructive'}`}>
                      Net: {isPositive ? '+' : ''}{formatCurrency(netChange)}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-card border border-border/50">
                      <p className="text-sm text-muted-foreground font-medium mb-1">Total Income</p>
                      <p className="text-2xl font-bold text-positive">{formatCurrency(report.totalCredit)}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-card border border-border/50">
                      <p className="text-sm text-muted-foreground font-medium mb-1">Total Expenses</p>
                      <p className="text-2xl font-bold text-destructive">{formatCurrency(report.totalDebit)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
