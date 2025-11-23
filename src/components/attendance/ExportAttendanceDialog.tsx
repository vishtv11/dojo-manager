import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";

interface ExportAttendanceDialogProps {
  students: any[];
}

export const ExportAttendanceDialog = ({ students }: ExportAttendanceDialogProps) => {
  const [open, setOpen] = useState(false);
  const [fromDate, setFromDate] = useState(new Date().toISOString().split("T")[0]);
  const [toDate, setToDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedStudent, setSelectedStudent] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [exporting, setExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = async () => {
    try {
      setExporting(true);

      // Build query
      let query = supabase
        .from("attendance")
        .select(`
          *,
          students (
            name,
            instructor_name
          )
        `)
        .gte("date", fromDate)
        .lte("date", toDate);

      // Apply student filter if selected
      if (selectedStudent !== "all") {
        query = query.eq("student_id", selectedStudent);
      }

      // Apply status filter
      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter as "present" | "absent" | "late");
      }

      const { data, error } = await query.order("date", { ascending: true });

      if (error) throw error;

      if (!data || data.length === 0) {
        toast({
          title: "No Data",
          description: "No attendance records found for selected filters.",
          variant: "destructive",
        });
        return;
      }

      // Format data for export
      const exportData = data.map((record: any) => ({
        "Student Name": record.students?.name || "N/A",
        "Date": new Date(record.date).toLocaleDateString("en-IN"),
        "Attendance Status": record.status.charAt(0).toUpperCase() + record.status.slice(1),
        "Instructor Name": record.students?.instructor_name || "N/A",
        "Remarks": record.notes || "",
      }));

      // Create workbook and worksheet
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");

      // Set column widths
      const columnWidths = [
        { wch: 25 }, // Student Name
        { wch: 15 }, // Date
        { wch: 18 }, // Attendance Status
        { wch: 20 }, // Instructor Name
        { wch: 30 }, // Remarks
      ];
      worksheet["!cols"] = columnWidths;

      // Generate filename
      const filename = `Attendance_Report_${fromDate}_to_${toDate}.xlsx`;

      // Export file
      XLSX.writeFile(workbook, filename);

      toast({
        title: "Export Successful",
        description: `Downloaded ${data.length} records`,
      });

      setOpen(false);
    } catch (error: any) {
      toast({
        title: "Export Failed",
        description: error.message || "Failed to export attendance data",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export Attendance
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Export Attendance Report</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="fromDate">From Date</Label>
              <Input
                id="fromDate"
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="toDate">To Date</Label>
              <Input
                id="toDate"
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="student">Student (Optional)</Label>
              <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                <SelectTrigger id="student">
                  <SelectValue placeholder="Select student" />
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
              <Label htmlFor="status">Status *</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Students</SelectItem>
                  <SelectItem value="present">Present Only</SelectItem>
                  <SelectItem value="absent">Absent Only</SelectItem>
                  <SelectItem value="late">Late Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleExport} disabled={exporting}>
              {exporting ? "Exporting..." : "Export"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
