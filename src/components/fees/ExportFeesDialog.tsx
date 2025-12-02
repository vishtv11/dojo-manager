import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";

interface ExportFeesDialogProps {
  students: any[];
  selectedMonth: number;
  selectedYear: number;
}

export const ExportFeesDialog = ({ students, selectedMonth, selectedYear }: ExportFeesDialogProps) => {
  const [open, setOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<string>("all");
  const [paymentStatus, setPaymentStatus] = useState<string>("all");
  const [exporting, setExporting] = useState(false);
  const { toast } = useToast();

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const handleExport = async () => {
    try {
      setExporting(true);

      // Build query
      let query = supabase
        .from("monthly_fees")
        .select("*, students(*)")
        .eq("month", selectedMonth)
        .eq("year", selectedYear);

      // Apply student filter
      if (selectedStudent !== "all") {
        query = query.eq("student_id", selectedStudent);
      }

      // Apply payment status filter
      if (paymentStatus !== "all") {
        query = query.eq("status", paymentStatus as "paid" | "unpaid" | "partial");
      }

      const { data, error } = await query;

      if (error) throw error;

      if (!data || data.length === 0) {
        toast({
          title: "No records found",
          description: "No fee records match the selected filters.",
          variant: "destructive",
        });
        return;
      }

      // Prepare data for export
      const exportData = data.map((fee: any) => {
        const student = fee.students;
        const feeAmount = student?.fee_structure === '4_classes_1000' ? 1000 : 700;
        const partialPaid = fee.partial_amount_paid || 0;
        const remaining = fee.status === 'partial' ? feeAmount - partialPaid : (fee.status === 'paid' ? 0 : feeAmount);

        return {
          "Student Name": student?.name || "N/A",
          "Registration Number": student?.registration_number || "N/A",
          "Month": months[selectedMonth - 1],
          "Year": selectedYear,
          "Fee Amount": `₹${feeAmount}`,
          "Partial Amount Paid": fee.status === 'partial' ? `₹${partialPaid}` : "-",
          "Remaining Balance": `₹${remaining}`,
          "Payment Status": fee.status.charAt(0).toUpperCase() + fee.status.slice(1),
          "Paid Date": fee.paid_date ? new Date(fee.paid_date).toLocaleDateString() : "-",
          "Notes": fee.notes || "-",
        };
      });

      // Create workbook and worksheet
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Fee Records");

      // Generate filename
      const filename = `Fee_Records_${months[selectedMonth - 1]}_${selectedYear}.xlsx`;

      // Download file
      XLSX.writeFile(wb, filename);

      toast({
        title: "Export successful",
        description: `Downloaded ${data.length} fee records.`,
      });

      setOpen(false);
    } catch (error: any) {
      toast({
        title: "Export failed",
        description: error.message || "Failed to export fee records",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export Fee Records</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Select Student</Label>
            <Select value={selectedStudent} onValueChange={setSelectedStudent}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Students</SelectItem>
                {students.map((student) => (
                  <SelectItem key={student.id} value={student.id}>
                    {student.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Payment Status</Label>
            <Select value={paymentStatus} onValueChange={setPaymentStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="unpaid">Unpaid</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleExport} disabled={exporting}>
              {exporting ? "Exporting..." : "Export to Excel"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
