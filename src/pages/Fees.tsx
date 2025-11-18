import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, DollarSign } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Database } from "@/integrations/supabase/types";

const Fees = () => {
  const [fees, setFees] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { isAdmin } = useAuth();

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    if (students.length > 0) {
      fetchFees();
    }
  }, [selectedMonth, selectedYear, students]);

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      setStudents(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load students",
        variant: "destructive",
      });
    }
  };

  const fetchFees = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("monthly_fees")
        .select("*")
        .eq("month", selectedMonth)
        .eq("year", selectedYear);

      if (error) throw error;

      // Create fee records for students who don't have one
      const existingStudentIds = new Set(data?.map((f: any) => f.student_id) || []);
      const missingFees = students
        .filter((s) => !existingStudentIds.has(s.id))
        .map((s) => ({
          student_id: s.id,
          month: selectedMonth,
          year: selectedYear,
          amount: 50, // Default fee amount
          status: "unpaid" as Database['public']['Enums']['payment_status'],
        }));

      if (missingFees.length > 0 && isAdmin) {
        await supabase.from("monthly_fees").insert(missingFees);
        fetchFees(); // Refresh
        return;
      }

      setFees(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load fees",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateFeeStatus = async (feeId: string, status: Database['public']['Enums']['payment_status'], amount: number) => {
    if (!isAdmin) return;

    try {
      const updateData: any = { status };
      if (status === "paid") {
        updateData.paid_date = new Date().toISOString().split("T")[0];
      }

      const { error } = await supabase
        .from("monthly_fees")
        .update(updateData)
        .eq("id", feeId);

      if (error) throw error;

      toast({
        title: "Fee updated",
        description: `Fee status changed to ${status}`,
      });

      fetchFees();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update fee",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      paid: "bg-green-100 text-green-800 border-green-300",
      unpaid: "bg-red-100 text-red-800 border-red-300",
      partial: "bg-yellow-100 text-yellow-800 border-yellow-300",
    };
    return styles[status as keyof typeof styles] || styles.unpaid;
  };

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  const totalAmount = fees.reduce((sum, fee) => sum + parseFloat(fee.amount || 0), 0);
  const paidAmount = fees
    .filter((f) => f.status === "paid")
    .reduce((sum, fee) => sum + parseFloat(fee.amount || 0), 0);
  const unpaidCount = fees.filter((f) => f.status === "unpaid").length;

  if (loading && fees.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Monthly Fees</h1>
        <p className="text-muted-foreground">Track and manage student fee payments</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="text-2xl font-bold">${totalAmount.toFixed(2)}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Collected</p>
                <p className="text-2xl font-bold text-green-600">${paidAmount.toFixed(2)}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-red-600">{unpaidCount}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Filter by Month & Year</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month, index) => (
                    <SelectItem key={index} value={(index + 1).toString()}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Fee Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {fees.map((fee) => {
              const student = students.find((s) => s.id === fee.student_id);
              if (!student) return null;

              return (
                <div
                  key={fee.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/10 transition-colors"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold">{student.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Amount: ${parseFloat(fee.amount).toFixed(2)}
                      {fee.paid_date && ` • Paid on ${new Date(fee.paid_date).toLocaleDateString()}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={getStatusBadge(fee.status)} variant="outline">
                      {fee.status.charAt(0).toUpperCase() + fee.status.slice(1)}
                    </Badge>
                    {isAdmin && (
                      <Select
                        value={fee.status}
                        onValueChange={(value) => updateFeeStatus(fee.id, value as Database['public']['Enums']['payment_status'], fee.amount)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unpaid">Unpaid</SelectItem>
                          <SelectItem value="paid">Paid</SelectItem>
                          <SelectItem value="partial">Partial</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Fees;
