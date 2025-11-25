import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, User, Phone, MapPin, Calendar, Award, GraduationCap, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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
  const [feeData, setFeeData] = useState<any[]>([]);
  const [beltTests, setBeltTests] = useState<any[]>([]);
  const [editingCertNumber, setEditingCertNumber] = useState<Record<string, string>>({});
  const [savingCertNumber, setSavingCertNumber] = useState<Record<string, boolean>>({});
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
        <Button variant="outline" size="sm" onClick={() => navigate("/students")} className="w-full sm:w-auto">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Students
        </Button>
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
          <CardTitle className="text-lg sm:text-xl">Attendance Overview</CardTitle>
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
                    {attendanceData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground">
                          No attendance records found
                        </TableCell>
                      </TableRow>
                    ) : (
                      attendanceData.map((record) => (
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
