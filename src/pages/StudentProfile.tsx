import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, User, Phone, MapPin, Calendar, Award, GraduationCap, Save, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";

const StudentProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<any>(null);
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [filteredAttendance, setFilteredAttendance] = useState<any[]>([]);
  const [feeData, setFeeData] = useState<any[]>([]);
  const [beltTests, setBeltTests] = useState<any[]>([]);
  const [editingCertNumber, setEditingCertNumber] = useState<Record<string, string>>({});
  const [savingCertNumber, setSavingCertNumber] = useState<Record<string, boolean>>({});
  const [attendanceMonth, setAttendanceMonth] = useState<string>("all");
  const [attendanceYear, setAttendanceYear] = useState<string>(new Date().getFullYear().toString());
  const [attendanceStats, setAttendanceStats] = useState({
    present: 0,
    absent: 0,
    total: 0,
    percentage: 0,
  });
  const [feeStats, setFeeStats] = useState({
    totalPaid: 0,
    totalPending: 0,
  });

  useEffect(() => {
    if (id) {
      fetchStudentProfile();
    }
  }, [id]);

  // Filter attendance based on month/year selection
  useEffect(() => {
    if (attendanceMonth === "all") {
      setFilteredAttendance(attendanceData);
      const present = attendanceData.filter((a) => a.status === "present").length;
      const absent = attendanceData.filter((a) => a.status === "absent").length;
      const total = attendanceData.length;
      const percentage = total > 0 ? (present / total) * 100 : 0;
      setAttendanceStats({ present, absent, total, percentage });
    } else {
      const filtered = attendanceData.filter((record) => {
        const recordDate = new Date(record.date);
        return (
          recordDate.getMonth() + 1 === parseInt(attendanceMonth) &&
          recordDate.getFullYear() === parseInt(attendanceYear)
        );
      });
      setFilteredAttendance(filtered);
      const present = filtered.filter((a) => a.status === "present").length;
      const absent = filtered.filter((a) => a.status === "absent").length;
      const total = filtered.length;
      const percentage = total > 0 ? (present / total) * 100 : 0;
      setAttendanceStats({ present, absent, total, percentage });
    }
  }, [attendanceMonth, attendanceYear, attendanceData]);

  const fetchStudentProfile = async () => {
    try {
      setLoading(true);

      // Fetch student details
      const { data: studentData, error: studentError } = await supabase
        .from("students")
        .select("*")
        .eq("id", id)
        .single();

      if (studentError) throw studentError;
      setStudent(studentData);

      // Fetch attendance records
      const { data: attendanceRecords, error: attendanceError } = await supabase
        .from("attendance")
        .select("*")
        .eq("student_id", id)
        .order("date", { ascending: false });

      if (attendanceError) throw attendanceError;
      setAttendanceData(attendanceRecords || []);

      // Calculate attendance stats
      const present = attendanceRecords?.filter((a) => a.status === "present").length || 0;
      const absent = attendanceRecords?.filter((a) => a.status === "absent").length || 0;
      const total = attendanceRecords?.length || 0;
      const percentage = total > 0 ? (present / total) * 100 : 0;

      setAttendanceStats({ present, absent, total, percentage });

      // Fetch fee records
      const { data: feeRecords, error: feeError } = await supabase
        .from("monthly_fees")
        .select("*")
        .eq("student_id", id)
        .order("year", { ascending: false })
        .order("month", { ascending: false });

      if (feeError) throw feeError;
      setFeeData(feeRecords || []);

      // Calculate fee stats
      const totalPaid = feeRecords
        ?.filter((f) => f.status === "paid")
        .reduce((sum, f) => sum + Number(f.amount), 0) || 0;
      const totalPending = feeRecords
        ?.filter((f) => f.status === "unpaid")
        .reduce((sum, f) => sum + Number(f.amount), 0) || 0;

      setFeeStats({ totalPaid, totalPending });

      // Fetch belt tests
      const { data: testData, error: testError } = await supabase
        .from("belt_tests")
        .select("*")
        .eq("student_id", id)
        .order("test_date", { ascending: false });

      if (testError) throw testError;
      setBeltTests(testData || []);
      
      // Initialize editing state with current certification numbers
      const certNumbers: Record<string, string> = {};
      testData?.forEach((test) => {
        certNumbers[test.id] = test.certification_number || "";
      });
      setEditingCertNumber(certNumbers);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load student profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getBeltColor = (belt: string) => {
    const colors: Record<string, string> = {
      white: "bg-gray-200 text-gray-800",
      yellow_stripe: "bg-yellow-300 text-yellow-900",
      yellow: "bg-yellow-400 text-yellow-900",
      green_stripe: "bg-green-400 text-white",
      green: "bg-green-500 text-white",
      blue_stripe: "bg-blue-400 text-white",
      blue: "bg-blue-500 text-white",
      red_stripe: "bg-red-400 text-white",
      red: "bg-red-500 text-white",
      red_black: "bg-gradient-to-r from-red-600 to-gray-900 text-white",
      black_1st_dan: "bg-gray-900 text-white",
      black_2nd_dan: "bg-gray-900 text-white",
      black_3rd_dan: "bg-gray-900 text-white",
      black_4th_dan: "bg-gray-900 text-white",
      black_5th_dan: "bg-gray-900 text-white",
    };
    return colors[belt] || "bg-gray-200 text-gray-800";
  };

  const formatBeltName = (belt: string) => {
    const beltMap: Record<string, string> = {
      white: "White",
      yellow_stripe: "Yellow Stripe",
      yellow: "Yellow",
      green_stripe: "Green Stripe",
      green: "Green",
      blue_stripe: "Blue Stripe",
      blue: "Blue",
      red_stripe: "Red Stripe",
      red: "Red",
      red_black: "Red Black",
      black_1st_dan: "Black 1st Dan",
      black_2nd_dan: "Black 2nd Dan",
      black_3rd_dan: "Black 3rd Dan",
      black_4th_dan: "Black 4th Dan",
      black_5th_dan: "Black 5th Dan",
    };
    return beltMap[belt] || belt.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const getMonthName = (month: number) => {
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    return months[month - 1];
  };

  const handleCertNumberChange = (testId: string, value: string) => {
    // Validate: alphanumeric and hyphens only, max 20 chars
    const sanitized = value.slice(0, 20).replace(/[^a-zA-Z0-9-]/g, "");
    setEditingCertNumber((prev) => ({
      ...prev,
      [testId]: sanitized,
    }));
  };

  const handleSaveCertNumber = async (testId: string) => {
    try {
      setSavingCertNumber((prev) => ({ ...prev, [testId]: true }));
      
      const { error } = await supabase
        .from("belt_tests")
        .update({ certification_number: editingCertNumber[testId] || null })
        .eq("id", testId);

      if (error) throw error;

      // Update local state
      setBeltTests((prev) =>
        prev.map((test) =>
          test.id === testId
            ? { ...test, certification_number: editingCertNumber[testId] }
            : test
        )
      );

      toast({
        title: "Success",
        description: "Certification number updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update certification number",
        variant: "destructive",
      });
    } finally {
      setSavingCertNumber((prev) => ({ ...prev, [testId]: false }));
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      present: "bg-green-500/10 text-green-700 dark:text-green-400",
      absent: "bg-red-500/10 text-red-700 dark:text-red-400",
      late: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
      paid: "bg-green-500/10 text-green-700 dark:text-green-400",
      unpaid: "bg-red-500/10 text-red-700 dark:text-red-400",
      partial: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
      passed: "bg-green-500/10 text-green-700 dark:text-green-400",
      failed: "bg-red-500/10 text-red-700 dark:text-red-400",
      pending: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
    };
    return styles[status] || "";
  };

  const exportToPDF = () => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      let yPosition = 20;

      // Title
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("Student Profile Report", pageWidth / 2, yPosition, { align: "center" });
      yPosition += 15;

      // Basic Information Section
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Basic Information", 14, yPosition);
      yPosition += 8;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const basicInfo = [
        ["Student Name:", student.name],
        ["Registration Number:", student.registration_number || "N/A"],
        ["Gender:", student.gender.charAt(0).toUpperCase() + student.gender.slice(1)],
        ["Date of Birth:", new Date(student.date_of_birth).toLocaleDateString('en-GB')],
        ["Age:", `${student.age} years`],
        ["Guardian Name:", student.guardian_name],
        ["Phone Number:", student.phone_number],
        ["Address:", student.address || "Not provided"],
        ["State:", student.state || "N/A"],
        ["Admission Date:", new Date(student.admission_date).toLocaleDateString('en-GB')],
        ["Current Belt:", formatBeltName(student.current_belt)],
        ["Instructor Name:", student.instructor_name || "N/A"],
        ["TAI Certification:", student.tai_certification_number || "N/A"],
        ["Fee Structure:", student.fee_structure === '2_classes_700' ? '2 classes/week - ₹700' : '4 classes/week - ₹1000'],
      ];

      basicInfo.forEach(([label, value]) => {
        doc.setFont("helvetica", "bold");
        doc.text(label, 14, yPosition);
        doc.setFont("helvetica", "normal");
        doc.text(value, 70, yPosition);
        yPosition += 6;
      });

      yPosition += 5;

      // Attendance Overview Section
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Attendance Overview", 14, yPosition);
      yPosition += 8;

      autoTable(doc, {
        startY: yPosition,
        head: [['Metric', 'Value']],
        body: [
          ['Total Present Days', attendanceStats.present.toString()],
          ['Total Absent Days', attendanceStats.absent.toString()],
          ['Total Classes', attendanceStats.total.toString()],
          ['Attendance Percentage', `${attendanceStats.percentage.toFixed(2)}%`],
        ],
        theme: 'grid',
        headStyles: { fillColor: [220, 38, 38], textColor: 255 },
        styles: { fontSize: 10 },
      });

      yPosition = (doc as any).lastAutoTable.finalY + 10;

      // Attendance History
      if (attendanceData.length > 0) {
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("Attendance History", 14, yPosition);
        yPosition += 5;

        autoTable(doc, {
          startY: yPosition,
          head: [['Date', 'Status', 'Notes']],
          body: attendanceData.map(record => [
            new Date(record.date).toLocaleDateString('en-GB'),
            record.status.charAt(0).toUpperCase() + record.status.slice(1),
            record.notes || '-'
          ]),
          theme: 'striped',
          headStyles: { fillColor: [220, 38, 38], textColor: 255 },
          styles: { fontSize: 9 },
        });

        yPosition = (doc as any).lastAutoTable.finalY + 10;
      }

      // Check if we need a new page
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }

      // Fee Summary Section
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Fee Summary", 14, yPosition);
      yPosition += 8;

      autoTable(doc, {
        startY: yPosition,
        head: [['Metric', 'Value']],
        body: [
          ['Total Paid', `₹${feeStats.totalPaid.toFixed(2)}`],
          ['Total Pending', `₹${feeStats.totalPending.toFixed(2)}`],
          ['Monthly Fee', student.fee_structure === '2_classes_700' ? '₹700' : '₹1000'],
        ],
        theme: 'grid',
        headStyles: { fillColor: [220, 38, 38], textColor: 255 },
        styles: { fontSize: 10 },
      });

      yPosition = (doc as any).lastAutoTable.finalY + 10;

      // Fee History
      if (feeData.length > 0) {
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("Fee History", 14, yPosition);
        yPosition += 5;

        autoTable(doc, {
          startY: yPosition,
          head: [['Month/Year', 'Amount', 'Status', 'Payment Date']],
          body: feeData.map(fee => [
            `${getMonthName(fee.month)} ${fee.year}`,
            `₹${Number(fee.amount).toFixed(2)}`,
            fee.status.charAt(0).toUpperCase() + fee.status.slice(1),
            fee.paid_date ? new Date(fee.paid_date).toLocaleDateString('en-GB') : '-'
          ]),
          theme: 'striped',
          headStyles: { fillColor: [220, 38, 38], textColor: 255 },
          styles: { fontSize: 9 },
        });

        yPosition = (doc as any).lastAutoTable.finalY + 10;
      }

      // Check if we need a new page
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }

      // Belt Progress & Certification History
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Belt Progress & Certification History", 14, yPosition);
      yPosition += 8;

      if (lastBeltTest) {
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text("Last Belt Test:", 14, yPosition);
        yPosition += 6;

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(`Date: ${new Date(lastBeltTest.test_date).toLocaleDateString('en-GB')}`, 14, yPosition);
        yPosition += 5;
        doc.text(`Tested For: ${formatBeltName(lastBeltTest.tested_for_belt)}`, 14, yPosition);
        yPosition += 5;
        doc.text(`Result: ${lastBeltTest.result.charAt(0).toUpperCase() + lastBeltTest.result.slice(1)}`, 14, yPosition);
        yPosition += 5;
        if (lastBeltTest.certification_number) {
          doc.text(`Certification: ${lastBeltTest.certification_number}`, 14, yPosition);
          yPosition += 5;
        }
        yPosition += 5;
      }

      if (beltTests.length > 0) {
        autoTable(doc, {
          startY: yPosition,
          head: [['Belt Level', 'Date Issued', 'Result', 'Certification Number']],
          body: beltTests.map(test => [
            formatBeltName(test.tested_for_belt),
            new Date(test.test_date).toLocaleDateString('en-GB'),
            test.result.charAt(0).toUpperCase() + test.result.slice(1),
            test.certification_number || '-'
          ]),
          theme: 'striped',
          headStyles: { fillColor: [220, 38, 38], textColor: 255 },
          styles: { fontSize: 9 },
        });
      }

      // Footer
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont("helvetica", "italic");
        doc.text(
          `Page ${i} of ${totalPages}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: "center" }
        );
        doc.text(
          `Generated on ${new Date().toLocaleDateString('en-GB')}`,
          pageWidth - 14,
          doc.internal.pageSize.getHeight() - 10,
          { align: "right" }
        );
      }

      // Save the PDF
      const fileName = `${student.name.replace(/\s+/g, '_')}_ProfileReport.pdf`;
      doc.save(fileName);

      toast({
        title: "Success",
        description: "Student profile exported successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to export PDF",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Student not found</p>
      </div>
    );
  }

  const lastBeltTest = beltTests.length > 0 ? beltTests[0] : null;
  const passedTests = beltTests.filter((test) => test.result === "passed");

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header with Back Button */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        <div className="flex gap-2 flex-col sm:flex-row">
          <Button variant="outline" size="sm" onClick={() => navigate("/students")} className="w-full sm:w-auto">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Students
          </Button>
          <Button variant="default" size="sm" onClick={exportToPDF} className="w-full sm:w-auto">
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold">Student Profile</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Students → {student.name} → Profile
          </p>
        </div>
      </div>

      {/* Basic Information Card */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <User className="h-5 w-5" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 sm:gap-6">
            <div className="flex flex-col items-center gap-3 sm:gap-4">
              <Avatar className="h-24 w-24 sm:h-32 sm:w-32">
                <AvatarImage src={student.profile_photo_url} />
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl sm:text-3xl">
                  {student.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <Badge className={`${getBeltColor(student.current_belt)} text-sm sm:text-base px-3 sm:px-4 py-1`}>
                {formatBeltName(student.current_belt)}
              </Badge>
            </div>
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Student Name</p>
                <p className="font-semibold text-base sm:text-lg break-words">{student.name}</p>
              </div>
              {student.registration_number && (
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Registration Number</p>
                  <p className="font-semibold text-base sm:text-lg text-primary break-words">{student.registration_number}</p>
                </div>
              )}
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Gender</p>
                <p className="font-semibold text-sm sm:text-base capitalize">{student.gender}</p>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Date of Birth</p>
                <p className="font-semibold text-sm sm:text-base">
                  {new Date(student.date_of_birth).toLocaleDateString('en-GB')}
                </p>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Age</p>
                <p className="font-semibold text-sm sm:text-base">{student.age} years</p>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-2">
                  <Phone className="h-3 w-3 sm:h-4 sm:w-4" />
                  Phone Number
                </p>
                <p className="font-semibold text-sm sm:text-base">{student.phone_number}</p>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Guardian Name</p>
                <p className="font-semibold text-sm sm:text-base break-words">{student.guardian_name}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-2">
                  <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
                  Address
                </p>
                <p className="font-semibold text-sm sm:text-base break-words">{student.address || "Not provided"}</p>
              </div>
              {student.state && (
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">State</p>
                  <p className="font-semibold text-sm sm:text-base">{student.state}</p>
                </div>
              )}
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                  Admission Date
                </p>
                <p className="font-semibold text-sm sm:text-base">
                  {new Date(student.admission_date).toLocaleDateString('en-GB')}
                </p>
              </div>
              {student.instructor_name && (
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-2">
                    <GraduationCap className="h-3 w-3 sm:h-4 sm:w-4" />
                    Instructor Name
                  </p>
                  <p className="font-semibold text-sm sm:text-base">{student.instructor_name}</p>
                </div>
              )}
              {student.tai_certification_number && (
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-2">
                    <Award className="h-3 w-3 sm:h-4 sm:w-4" />
                    Latest TAI Certification
                  </p>
                  <p className="font-semibold text-sm sm:text-base break-all">{student.tai_certification_number}</p>
                </div>
              )}
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Fee Structure</p>
                <p className="font-semibold text-sm sm:text-base">
                  {student.fee_structure === '2_classes_700' 
                    ? '2 classes/week - ₹700' 
                    : '4 classes/week - ₹1000'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Overview */}
      <Card className="shadow-card">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="text-lg sm:text-xl">Attendance Overview</CardTitle>
            <div className="flex gap-2">
              <Select value={attendanceMonth} onValueChange={setAttendanceMonth}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Months</SelectItem>
                  <SelectItem value="1">January</SelectItem>
                  <SelectItem value="2">February</SelectItem>
                  <SelectItem value="3">March</SelectItem>
                  <SelectItem value="4">April</SelectItem>
                  <SelectItem value="5">May</SelectItem>
                  <SelectItem value="6">June</SelectItem>
                  <SelectItem value="7">July</SelectItem>
                  <SelectItem value="8">August</SelectItem>
                  <SelectItem value="9">September</SelectItem>
                  <SelectItem value="10">October</SelectItem>
                  <SelectItem value="11">November</SelectItem>
                  <SelectItem value="12">December</SelectItem>
                </SelectContent>
              </Select>
              <Select value={attendanceYear} onValueChange={setAttendanceYear}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((year) => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="text-center p-3 sm:p-4 rounded-lg bg-green-500/10">
              <p className="text-xl sm:text-2xl font-bold text-green-700 dark:text-green-400">
                {attendanceStats.present}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground">Present Days</p>
            </div>
            <div className="text-center p-3 sm:p-4 rounded-lg bg-red-500/10">
              <p className="text-xl sm:text-2xl font-bold text-red-700 dark:text-red-400">
                {attendanceStats.absent}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground">Absent Days</p>
            </div>
            <div className="text-center p-3 sm:p-4 rounded-lg bg-blue-500/10">
              <p className="text-xl sm:text-2xl font-bold text-blue-700 dark:text-blue-400">
                {attendanceStats.total}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground">Total Classes</p>
            </div>
            <div className="text-center p-3 sm:p-4 rounded-lg bg-primary/10">
              <p className="text-xl sm:text-2xl font-bold text-primary">
                {attendanceStats.percentage.toFixed(2)}%
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground">Attendance Rate</p>
            </div>
          </div>

          <Collapsible>
            <CollapsibleTrigger className="flex items-center gap-2 font-semibold text-xs sm:text-sm mb-2 hover:text-primary">
              <ChevronDown className="h-4 w-4" />
              Attendance History
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="border rounded-lg overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAttendance.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground">
                          No attendance records found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredAttendance.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell>
                            {new Date(record.date).toLocaleDateString('en-GB')}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={getStatusBadge(record.status)}
                              variant="secondary"
                            >
                              {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {record.notes || "-"}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      {/* Fee Details Section */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Fee Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="text-center p-3 sm:p-4 rounded-lg bg-green-500/10">
              <p className="text-xl sm:text-2xl font-bold text-green-700 dark:text-green-400">
                ₹{feeStats.totalPaid.toFixed(2)}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground">Total Paid</p>
            </div>
            <div className="text-center p-3 sm:p-4 rounded-lg bg-red-500/10">
              <p className="text-xl sm:text-2xl font-bold text-red-700 dark:text-red-400">
                ₹{feeStats.totalPending.toFixed(2)}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground">Total Pending</p>
            </div>
            <div className="text-center p-3 sm:p-4 rounded-lg bg-blue-500/10 sm:col-span-2 lg:col-span-1">
              <p className="text-xl sm:text-2xl font-bold text-blue-700 dark:text-blue-400">
                {student.fee_structure === '2_classes_700' ? '₹700' : '₹1000'}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground">Monthly Fee</p>
            </div>
          </div>

          <Collapsible>
            <CollapsibleTrigger className="flex items-center gap-2 font-semibold text-xs sm:text-sm mb-2 hover:text-primary">
              <ChevronDown className="h-4 w-4" />
              Fee History
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="border rounded-lg overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Month/Year</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payment Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {feeData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground">
                          No fee records found
                        </TableCell>
                      </TableRow>
                    ) : (
                      feeData.map((fee) => (
                        <TableRow key={fee.id}>
                          <TableCell>
                            {getMonthName(fee.month)} {fee.year}
                          </TableCell>
                          <TableCell>₹{Number(fee.amount).toFixed(2)}</TableCell>
                          <TableCell>
                            <Badge
                              className={getStatusBadge(fee.status)}
                              variant="secondary"
                            >
                              {fee.status.charAt(0).toUpperCase() + fee.status.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {fee.paid_date
                              ? new Date(fee.paid_date).toLocaleDateString('en-GB')
                              : "-"}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      {/* Belt Test & Certification History */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Belt Progress & Certification History</CardTitle>
        </CardHeader>
        <CardContent>
          {lastBeltTest && (
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 rounded-lg bg-muted/50">
              <h3 className="font-semibold text-sm sm:text-base mb-2 sm:mb-3">Last Belt Test Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Test Date</p>
                  <p className="font-semibold text-sm sm:text-base">
                    {new Date(lastBeltTest.test_date).toLocaleDateString('en-GB')}
                  </p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Tested For</p>
                  <p className="font-semibold text-sm sm:text-base">{formatBeltName(lastBeltTest.tested_for_belt)}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Result</p>
                  <Badge
                    className={getStatusBadge(lastBeltTest.result)}
                    variant="secondary"
                  >
                    {lastBeltTest.result.charAt(0).toUpperCase() + lastBeltTest.result.slice(1)}
                  </Badge>
                </div>
                {lastBeltTest.certification_number && (
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground">Certification Number</p>
                    <p className="font-semibold text-sm sm:text-base break-all">{lastBeltTest.certification_number}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Belt Level</TableHead>
                  <TableHead>Date Issued</TableHead>
                  <TableHead>Result</TableHead>
                  <TableHead>Certification Number</TableHead>
                  <TableHead className="w-24">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {beltTests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No belt test records found
                    </TableCell>
                  </TableRow>
                ) : (
                  beltTests.map((test) => (
                    <TableRow key={test.id}>
                      <TableCell className="min-w-[120px]">
                        <Badge
                          className={`${getBeltColor(test.tested_for_belt)} text-xs sm:text-sm`}
                          variant="secondary"
                        >
                          {formatBeltName(test.tested_for_belt)}
                        </Badge>
                      </TableCell>
                      <TableCell className="min-w-[100px] text-xs sm:text-sm">
                        {new Date(test.test_date).toLocaleDateString('en-GB')}
                      </TableCell>
                      <TableCell className="min-w-[90px]">
                        <Badge
                          className={`${getStatusBadge(test.result)} text-xs sm:text-sm`}
                          variant="secondary"
                        >
                          {test.result.charAt(0).toUpperCase() + test.result.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="min-w-[150px]">
                        <input
                          type="text"
                          value={editingCertNumber[test.id] || ""}
                          onChange={(e) => handleCertNumberChange(test.id, e.target.value)}
                          placeholder="Enter cert number"
                          className="w-full px-2 py-1 border rounded text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                          maxLength={20}
                        />
                      </TableCell>
                      <TableCell className="min-w-[100px]">
                        <Button
                          size="sm"
                          onClick={() => handleSaveCertNumber(test.id)}
                          disabled={savingCertNumber[test.id]}
                          className="w-full text-xs sm:text-sm"
                        >
                          <Save className="h-3 w-3 sm:mr-1" />
                          <span className="hidden sm:inline">{savingCertNumber[test.id] ? "Saving..." : "Save"}</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentProfile;
