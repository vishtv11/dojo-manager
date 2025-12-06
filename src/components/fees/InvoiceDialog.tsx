import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FileText } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useToast } from "@/hooks/use-toast";

interface InvoiceDialogProps {
  fee: {
    id: string;
    month: number;
    year: number;
    status: string;
    paid_date: string | null;
    partial_amount_paid: number | null;
  };
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

export const InvoiceDialog = ({ fee, student }: InvoiceDialogProps) => {
  const [open, setOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const feeAmount = student.fee_structure === '4_classes_1000' ? 1000 : 700;
  const partialPaid = fee.partial_amount_paid || 0;
  const amountPaid = fee.status === 'paid' ? feeAmount : partialPaid;
  const balanceDue = feeAmount - amountPaid;

  const generateInvoice = async () => {
    setGenerating(true);
    
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Load logo
      const logoUrl = '/images/mta-logo.jpeg';
      let logoLoaded = false;
      
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        await new Promise<void>((resolve, reject) => {
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
      doc.setTextColor(139, 0, 0); // Deep crimson
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
      
      const invoiceNumber = `INV-${fee.year}${String(fee.month).padStart(2, '0')}-${student.registration_number || student.id.slice(0, 8).toUpperCase()}`;
      const invoiceDate = new Date().toLocaleDateString('en-GB');
      const periodMonth = months[fee.month - 1];
      
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
      doc.text(`${periodMonth} ${fee.year}`, 50, yPos);
      
      // Payment Status
      doc.setFont("helvetica", "bold");
      doc.text("Status:", pageWidth - 60, yPos);
      const statusText = fee.status.charAt(0).toUpperCase() + fee.status.slice(1);
      if (fee.status === 'paid') {
        doc.setTextColor(0, 128, 0);
      } else if (fee.status === 'partial') {
        doc.setTextColor(200, 150, 0);
      } else {
        doc.setTextColor(200, 0, 0);
      }
      doc.setFont("helvetica", "normal");
      doc.text(statusText, pageWidth - 42, yPos);
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
      
      // Fee Details Table
      const feeStructureText = student.fee_structure === '4_classes_1000' 
        ? '4 classes per week' 
        : '2 classes per week';
      
      autoTable(doc, {
        startY: yPos,
        head: [['Description', 'Fee Structure', 'Amount (Rs.)']],
        body: [
          [`Monthly Training Fee - ${periodMonth} ${fee.year}`, feeStructureText, `Rs.${feeAmount.toFixed(2)}`]
        ],
        styles: {
          fontSize: 10,
          cellPadding: 5,
        },
        headStyles: {
          fillColor: [139, 0, 0],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
        },
        columnStyles: {
          0: { cellWidth: 80 },
          1: { cellWidth: 50, halign: 'center' },
          2: { cellWidth: 40, halign: 'right' },
        },
        margin: { left: 20, right: 20 },
      });
      
      yPos = (doc as any).lastAutoTable.finalY + 10;
      
      // Payment Summary
      const summaryX = pageWidth - 80;
      
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.line(summaryX - 10, yPos - 3, pageWidth - 20, yPos - 3);
      
      doc.setFont("helvetica", "bold");
      doc.text("Sub Total:", summaryX, yPos);
      doc.text(`Rs.${feeAmount.toFixed(2)}`, pageWidth - 22, yPos, { align: 'right' });
      
      if (fee.status === 'partial' || fee.status === 'paid') {
        yPos += 7;
        doc.setTextColor(0, 128, 0);
        doc.text("Amount Paid:", summaryX, yPos);
        doc.text(`Rs.${amountPaid.toFixed(2)}`, pageWidth - 22, yPos, { align: 'right' });
        doc.setTextColor(0, 0, 0);
      }
      
      yPos += 7;
      doc.setDrawColor(139, 0, 0);
      doc.setLineWidth(1);
      doc.line(summaryX - 10, yPos - 3, pageWidth - 20, yPos - 3);
      
      doc.setFontSize(12);
      if (balanceDue > 0) {
        doc.setTextColor(200, 0, 0);
        doc.text("Balance Due:", summaryX, yPos + 2);
        doc.text(`Rs.${balanceDue.toFixed(2)}`, pageWidth - 22, yPos + 2, { align: 'right' });
      } else {
        doc.setTextColor(0, 128, 0);
        doc.text("PAID IN FULL", summaryX, yPos + 2);
        doc.text(`Rs.0.00`, pageWidth - 22, yPos + 2, { align: 'right' });
      }
      doc.setTextColor(0, 0, 0);
      
      // Payment Date if paid
      if (fee.paid_date) {
        yPos += 12;
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(`Payment received on: ${new Date(fee.paid_date).toLocaleDateString('en-GB')}`, summaryX - 10, yPos);
      }
      
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
      const fileName = `Invoice_${student.name.replace(/\s+/g, '_')}_${periodMonth}_${fee.year}.pdf`;
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1">
          <FileText className="h-4 w-4" />
          <span className="hidden sm:inline">Invoice</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Generate Invoice</DialogTitle>
          <DialogDescription>
            Generate a PDF invoice for {student.name}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-lg border border-border p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Student:</span>
              <span className="font-medium">{student.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Period:</span>
              <span className="font-medium">{months[fee.month - 1]} {fee.year}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fee Amount:</span>
              <span className="font-medium">₹{feeAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status:</span>
              <span className={`font-medium ${
                fee.status === 'paid' ? 'text-green-600' : 
                fee.status === 'partial' ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {fee.status.charAt(0).toUpperCase() + fee.status.slice(1)}
              </span>
            </div>
            {fee.status === 'partial' && (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount Paid:</span>
                  <span className="font-medium text-green-600">₹{partialPaid.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Balance Due:</span>
                  <span className="font-medium text-red-600">₹{balanceDue.toFixed(2)}</span>
                </div>
              </>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={generateInvoice} disabled={generating}>
              {generating ? "Generating..." : "Download Invoice"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
