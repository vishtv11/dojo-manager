import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FileText, Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface FeeRecord {
  id: string;
  month: number;
  year: number;
  status: string;
  paid_date: string | null;
  partial_amount_paid: number | null;
}

interface InvoiceDialogProps {
  fee: FeeRecord;
  student: {
    id: string;
    name: string;
    guardian_name: string;
    phone_number: string;
    address: string | null;
    registration_number: string | null;
    fee_structure: string;
  };
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export const InvoiceDialog = ({ fee, student }: InvoiceDialogProps) => {
  const [open, setOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selectedMonths, setSelectedMonths] = useState<{ month: number; year: number }[]>([]);
  const [availableFees, setAvailableFees] = useState<FeeRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const feeAmount = student.fee_structure === '4_classes_1000' ? 1000 : 700;

  // Fetch all fee records for this student when dialog opens
  useEffect(() => {
    if (open) {
      fetchStudentFees();
      // Pre-select the current fee's month
      setSelectedMonths([{ month: fee.month, year: fee.year }]);
    }
  }, [open, fee.month, fee.year, student.id]);

  const fetchStudentFees = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('monthly_fees')
        .select('id, month, year, status, paid_date, partial_amount_paid')
        .eq('student_id', student.id)
        .order('year', { ascending: false })
        .order('month', { ascending: false });

      if (error) throw error;
      setAvailableFees(data || []);
    } catch (error) {
      console.error('Error fetching fees:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleMonth = (month: number, year: number) => {
    setSelectedMonths(prev => {
      const exists = prev.some(m => m.month === month && m.year === year);
      if (exists) {
        return prev.filter(m => !(m.month === month && m.year === year));
      } else {
        return [...prev, { month, year }];
      }
    });
  };

  const isMonthSelected = (month: number, year: number) => {
    return selectedMonths.some(m => m.month === month && m.year === year);
  };

  const getSelectedFees = () => {
    return availableFees.filter(f => 
      selectedMonths.some(m => m.month === f.month && m.year === f.year)
    ).sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });
  };

  const calculateTotals = () => {
    const selected = getSelectedFees();
    let totalAmount = 0;
    let totalPaid = 0;

    selected.forEach(f => {
      totalAmount += feeAmount;
      if (f.status === 'paid') {
        totalPaid += feeAmount;
      } else if (f.status === 'partial') {
        totalPaid += f.partial_amount_paid || 0;
      }
    });

    return {
      totalAmount,
      totalPaid,
      balanceDue: totalAmount - totalPaid
    };
  };

  const generateInvoice = async () => {
    if (selectedMonths.length === 0) {
      toast({
        title: "No months selected",
        description: "Please select at least one month",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);
    
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const selectedFees = getSelectedFees();
      const totals = calculateTotals();
      
      // Load logo
      const logoUrl = '/images/mta-logo.jpeg';
      let logoLoaded = false;
      
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        await new Promise<void>((resolve) => {
          img.onload = () => {
            logoLoaded = true;
            resolve();
          };
          img.onerror = () => {
            console.warn('Logo could not be loaded');
            resolve();
          };
          img.src = logoUrl;
        });
        
        if (logoLoaded) {
          const logoWidth = 25;
          const logoHeight = 25;
          const logoX = (pageWidth - logoWidth) / 2;
          doc.addImage(img, 'JPEG', logoX, 10, logoWidth, logoHeight);
        }
      } catch (error) {
        console.warn('Error loading logo:', error);
      }
      
      let yPos = logoLoaded ? 40 : 15;
      
      // Institution Header
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(139, 0, 0);
      doc.text("Master's Taekwon-Do Academy", pageWidth / 2, yPos, { align: "center" });
      
      yPos += 8;
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text("FEE INVOICE", pageWidth / 2, yPos, { align: "center" });
      
      // Red separator line
      yPos += 5;
      doc.setDrawColor(139, 0, 0);
      doc.setLineWidth(1);
      doc.line(20, yPos, pageWidth - 20, yPos);
      
      yPos += 12;
      
      // Invoice Details Section
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      
      // Generate invoice number based on selected months
      const firstMonth = selectedFees[0];
      const lastMonth = selectedFees[selectedFees.length - 1];
      const invoiceNumber = selectedMonths.length === 1
        ? `INV-${firstMonth.year}${String(firstMonth.month).padStart(2, '0')}-${student.registration_number || student.id.slice(0, 8).toUpperCase()}`
        : `INV-${firstMonth.year}${String(firstMonth.month).padStart(2, '0')}-${lastMonth.year}${String(lastMonth.month).padStart(2, '0')}-${student.registration_number || student.id.slice(0, 8).toUpperCase()}`;
      
      const invoiceDate = new Date().toLocaleDateString('en-GB');
      
      // Period text
      const periodText = selectedMonths.length === 1
        ? `${MONTHS[firstMonth.month - 1]} ${firstMonth.year}`
        : `${MONTHS[firstMonth.month - 1]} ${firstMonth.year} - ${MONTHS[lastMonth.month - 1]} ${lastMonth.year}`;
      
      // Left side - Invoice info
      doc.setFont("helvetica", "bold");
      doc.text("Invoice No:", 20, yPos);
      doc.setFont("helvetica", "normal");
      doc.text(invoiceNumber, 50, yPos);
      
      // Right side - Date
      doc.setFont("helvetica", "bold");
      doc.text("Date:", pageWidth - 60, yPos);
      doc.setFont("helvetica", "normal");
      doc.text(invoiceDate, pageWidth - 42, yPos);
      
      yPos += 7;
      doc.setFont("helvetica", "bold");
      doc.text("Period:", 20, yPos);
      doc.setFont("helvetica", "normal");
      doc.text(periodText, 50, yPos);
      
      // Overall Status
      const overallStatus = totals.balanceDue === 0 ? 'Paid' : totals.balanceDue < totals.totalAmount ? 'Partial' : 'Unpaid';
      doc.setFont("helvetica", "bold");
      doc.text("Status:", pageWidth - 60, yPos);
      if (overallStatus === 'Paid') {
        doc.setTextColor(0, 128, 0);
      } else if (overallStatus === 'Partial') {
        doc.setTextColor(200, 150, 0);
      } else {
        doc.setTextColor(200, 0, 0);
      }
      doc.setFont("helvetica", "normal");
      doc.text(overallStatus, pageWidth - 42, yPos);
      doc.setTextColor(0, 0, 0);
      
      yPos += 15;
      
      // Bill To Section
      doc.setFillColor(245, 245, 245);
      doc.rect(20, yPos - 5, pageWidth - 40, 35, 'F');
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("BILL TO:", 25, yPos + 2);
      
      doc.setFontSize(10);
      yPos += 10;
      doc.setFont("helvetica", "bold");
      doc.text("Student Name:", 25, yPos);
      doc.setFont("helvetica", "normal");
      doc.text(student.name, 65, yPos);
      
      if (student.registration_number) {
        doc.setFont("helvetica", "bold");
        doc.text("Reg. No:", pageWidth / 2, yPos);
        doc.setFont("helvetica", "normal");
        doc.text(student.registration_number, pageWidth / 2 + 25, yPos);
      }
      
      yPos += 7;
      doc.setFont("helvetica", "bold");
      doc.text("Guardian:", 25, yPos);
      doc.setFont("helvetica", "normal");
      doc.text(student.guardian_name, 65, yPos);
      
      doc.setFont("helvetica", "bold");
      doc.text("Phone:", pageWidth / 2, yPos);
      doc.setFont("helvetica", "normal");
      doc.text(student.phone_number, pageWidth / 2 + 25, yPos);
      
      if (student.address) {
        yPos += 7;
        doc.setFont("helvetica", "bold");
        doc.text("Address:", 25, yPos);
        doc.setFont("helvetica", "normal");
        const addressLines = doc.splitTextToSize(student.address, pageWidth - 90);
        doc.text(addressLines, 65, yPos);
      }
      
      yPos += 20;
      
      // Fee Details Table with all selected months
      const feeStructureText = student.fee_structure === '4_classes_1000' 
        ? '4 classes/week' 
        : '2 classes/week';
      
      const tableBody = selectedFees.map(f => {
        const monthName = MONTHS[f.month - 1];
        const partialPaid = f.partial_amount_paid || 0;
        const amountPaid = f.status === 'paid' ? feeAmount : partialPaid;
        const balance = feeAmount - amountPaid;
        const statusText = f.status.charAt(0).toUpperCase() + f.status.slice(1);
        
        return [
          `${monthName} ${f.year}`,
          feeStructureText,
          `Rs.${feeAmount.toFixed(2)}`,
          `Rs.${amountPaid.toFixed(2)}`,
          `Rs.${balance.toFixed(2)}`,
          statusText
        ];
      });
      
      autoTable(doc, {
        startY: yPos,
        head: [['Month', 'Fee Type', 'Amount', 'Paid', 'Balance', 'Status']],
        body: tableBody,
        styles: {
          fontSize: 9,
          cellPadding: 4,
        },
        headStyles: {
          fillColor: [139, 0, 0],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
        },
        columnStyles: {
          0: { cellWidth: 35 },
          1: { cellWidth: 32, halign: 'center' },
          2: { cellWidth: 28, halign: 'right' },
          3: { cellWidth: 28, halign: 'right' },
          4: { cellWidth: 28, halign: 'right' },
          5: { cellWidth: 22, halign: 'center' },
        },
        margin: { left: 20, right: 20 },
        didParseCell: (data) => {
          if (data.section === 'body' && data.column.index === 5) {
            const status = data.cell.raw?.toString().toLowerCase();
            if (status === 'paid') {
              data.cell.styles.textColor = [0, 128, 0];
            } else if (status === 'partial') {
              data.cell.styles.textColor = [200, 150, 0];
            } else {
              data.cell.styles.textColor = [200, 0, 0];
            }
          }
        }
      });
      
      yPos = (doc as any).lastAutoTable.finalY + 10;
      
      // Payment Summary
      const summaryX = pageWidth - 80;
      
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.line(summaryX - 10, yPos - 3, pageWidth - 20, yPos - 3);
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("Total Amount:", summaryX, yPos);
      doc.text(`Rs.${totals.totalAmount.toFixed(2)}`, pageWidth - 22, yPos, { align: 'right' });
      
      yPos += 7;
      doc.setTextColor(0, 128, 0);
      doc.text("Total Paid:", summaryX, yPos);
      doc.text(`Rs.${totals.totalPaid.toFixed(2)}`, pageWidth - 22, yPos, { align: 'right' });
      doc.setTextColor(0, 0, 0);
      
      yPos += 7;
      doc.setDrawColor(139, 0, 0);
      doc.setLineWidth(1);
      doc.line(summaryX - 10, yPos - 3, pageWidth - 20, yPos - 3);
      
      doc.setFontSize(12);
      if (totals.balanceDue > 0) {
        doc.setTextColor(200, 0, 0);
        doc.text("Balance Due:", summaryX, yPos + 2);
        doc.text(`Rs.${totals.balanceDue.toFixed(2)}`, pageWidth - 22, yPos + 2, { align: 'right' });
      } else {
        doc.setTextColor(0, 128, 0);
        doc.text("PAID IN FULL", summaryX, yPos + 2);
        doc.text(`Rs.0.00`, pageWidth - 22, yPos + 2, { align: 'right' });
      }
      doc.setTextColor(0, 0, 0);
      
      // Footer
      const footerY = doc.internal.pageSize.getHeight() - 30;
      
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.line(20, footerY, pageWidth - 20, footerY);
      
      doc.setFontSize(9);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(100, 100, 100);
      doc.text("Thank you for being a part of Master's Taekwon-Do Academy!", pageWidth / 2, footerY + 8, { align: "center" });
      doc.text("This is a computer-generated invoice.", pageWidth / 2, footerY + 14, { align: "center" });
      
      // Save PDF
      const fileName = selectedMonths.length === 1
        ? `Invoice_${student.name.replace(/\s+/g, '_')}_${MONTHS[firstMonth.month - 1]}_${firstMonth.year}.pdf`
        : `Invoice_${student.name.replace(/\s+/g, '_')}_${MONTHS[firstMonth.month - 1]}-${MONTHS[lastMonth.month - 1]}_${firstMonth.year}.pdf`;
      
      doc.save(fileName);
      
      toast({
        title: "Invoice Generated",
        description: `Invoice saved as ${fileName}`,
      });
      
      setOpen(false);
    } catch (error) {
      console.error('Error generating invoice:', error);
      toast({
        title: "Error",
        description: "Failed to generate invoice",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const totals = calculateTotals();

  // Group fees by year
  const feesByYear = availableFees.reduce((acc, f) => {
    if (!acc[f.year]) acc[f.year] = [];
    acc[f.year].push(f);
    return acc;
  }, {} as Record<number, FeeRecord[]>);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1">
          <FileText className="h-4 w-4" />
          <span className="hidden sm:inline">Invoice</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate Invoice</DialogTitle>
          <DialogDescription>
            Select months to include in the invoice for {student.name}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Month Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Select Months</label>
            {loading ? (
              <div className="text-center py-4 text-muted-foreground">Loading...</div>
            ) : (
              <div className="space-y-3 max-h-48 overflow-y-auto border border-border rounded-lg p-3">
                {Object.entries(feesByYear)
                  .sort(([a], [b]) => Number(b) - Number(a))
                  .map(([year, fees]) => (
                    <div key={year} className="space-y-2">
                      <div className="text-sm font-medium text-muted-foreground">{year}</div>
                      <div className="flex flex-wrap gap-2">
                        {fees
                          .sort((a, b) => b.month - a.month)
                          .map(f => {
                            const isSelected = isMonthSelected(f.month, f.year);
                            const statusColor = f.status === 'paid' 
                              ? 'bg-green-100 text-green-800 border-green-300' 
                              : f.status === 'partial'
                              ? 'bg-yellow-100 text-yellow-800 border-yellow-300'
                              : 'bg-red-100 text-red-800 border-red-300';
                            
                            return (
                              <button
                                key={f.id}
                                type="button"
                                onClick={() => toggleMonth(f.month, f.year)}
                                className={`px-3 py-1.5 text-sm rounded-md border transition-all ${
                                  isSelected 
                                    ? 'bg-primary text-primary-foreground border-primary ring-2 ring-primary/30' 
                                    : `${statusColor} hover:opacity-80`
                                }`}
                              >
                                <span className="flex items-center gap-1.5">
                                  {isSelected && <Check className="h-3 w-3" />}
                                  {MONTHS[f.month - 1].slice(0, 3)}
                                </span>
                              </button>
                            );
                          })}
                      </div>
                    </div>
                  ))}
              </div>
            )}
            
            {selectedMonths.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                <span className="text-sm text-muted-foreground">Selected:</span>
                {selectedMonths
                  .sort((a, b) => a.year - b.year || a.month - b.month)
                  .map(m => (
                    <Badge 
                      key={`${m.month}-${m.year}`} 
                      variant="secondary"
                      className="gap-1 cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => toggleMonth(m.month, m.year)}
                    >
                      {MONTHS[m.month - 1].slice(0, 3)} {m.year}
                      <X className="h-3 w-3" />
                    </Badge>
                  ))}
              </div>
            )}
          </div>

          {/* Summary */}
          {selectedMonths.length > 0 && (
            <div className="rounded-lg border border-border p-4 space-y-2 bg-muted/30">
              <div className="text-sm font-medium mb-2">Invoice Summary</div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Months Selected:</span>
                <span className="font-medium">{selectedMonths.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Amount:</span>
                <span className="font-medium">₹{totals.totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Paid:</span>
                <span className="font-medium text-green-600">₹{totals.totalPaid.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm border-t pt-2">
                <span className="text-muted-foreground font-medium">Balance Due:</span>
                <span className={`font-bold ${totals.balanceDue > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  ₹{totals.balanceDue.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={generateInvoice} 
              disabled={generating || selectedMonths.length === 0}
            >
              {generating ? "Generating..." : "Download Invoice"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
