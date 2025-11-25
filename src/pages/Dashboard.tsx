import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, DollarSign, Calendar, Award } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DashboardStats {
  totalStudents: number;
  activeStudents: number;
  pendingFees: number;
  todayAttendance: number;
  upcomingTests: number;
}

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    activeStudents: 0,
    pendingFees: 0,
    todayAttendance: 0,
    upcomingTests: 0,
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      // Get total and active students
      const { data: students, error: studentsError } = await supabase
        .from("students")
        .select("id, is_active");

      if (studentsError) throw studentsError;

      const totalStudents = students?.length || 0;
      const activeStudents = students?.filter((s) => s.is_active).length || 0;

      // Get pending fees for current month
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();

      const { data: fees, error: feesError } = await supabase
        .from("monthly_fees")
        .select("id")
        .eq("month", currentMonth)
        .eq("year", currentYear)
        .eq("status", "unpaid");

      if (feesError) throw feesError;

      // Get today's attendance
      const today = new Date().toISOString().split("T")[0];
      const { data: attendance, error: attendanceError } = await supabase
        .from("attendance")
        .select("id")
        .eq("date", today)
        .eq("status", "present");

      if (attendanceError) throw attendanceError;

      // Get upcoming belt tests (next 30 days)
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      const { data: tests, error: testsError } = await supabase
        .from("belt_tests")
        .select("id")
        .gte("test_date", today)
        .lte("test_date", thirtyDaysFromNow.toISOString().split("T")[0])
        .eq("result", "pending");

      if (testsError) throw testsError;

      setStats({
        totalStudents,
        activeStudents,
        pendingFees: fees?.length || 0,
        todayAttendance: attendance?.length || 0,
        upcomingTests: tests?.length || 0,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load dashboard statistics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: "Total Students",
      value: stats.totalStudents,
      subtitle: `${stats.activeStudents} active`,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Pending Fees",
      value: stats.pendingFees,
      subtitle: "This month",
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Today's Attendance",
      value: stats.todayAttendance,
      subtitle: "Students present",
      icon: Calendar,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "Upcoming Tests",
      value: stats.upcomingTests,
      subtitle: "Next 30 days",
      icon: Award,
      color: "text-primary",
      bgColor: "bg-red-100",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Welcome to your Taekwondo Institute management system
        </p>
      </div>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title} className="shadow-card hover:shadow-elevated transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${card.bgColor}`}>
                  <Icon className={`h-5 w-5 ${card.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{card.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {card.subtitle}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <a
              href="/students"
              className="p-4 border border-border rounded-lg hover:border-primary hover:bg-accent/10 transition-colors text-center"
            >
              <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
              <h3 className="font-semibold">Manage Students</h3>
              <p className="text-sm text-muted-foreground">Add or edit student records</p>
            </a>
            <a
              href="/fees"
              className="p-4 border border-border rounded-lg hover:border-primary hover:bg-accent/10 transition-colors text-center"
            >
              <DollarSign className="h-8 w-8 mx-auto mb-2 text-primary" />
              <h3 className="font-semibold">Track Fees</h3>
              <p className="text-sm text-muted-foreground">Manage monthly payments</p>
            </a>
            <a
              href="/attendance"
              className="p-4 border border-border rounded-lg hover:border-primary hover:bg-accent/10 transition-colors text-center"
            >
              <Calendar className="h-8 w-8 mx-auto mb-2 text-primary" />
              <h3 className="font-semibold">Mark Attendance</h3>
              <p className="text-sm text-muted-foreground">Track daily attendance</p>
            </a>
            <a
              href="/belt-tests"
              className="p-4 border border-border rounded-lg hover:border-primary hover:bg-accent/10 transition-colors text-center"
            >
              <Award className="h-8 w-8 mx-auto mb-2 text-primary" />
              <h3 className="font-semibold">Belt Tests</h3>
              <p className="text-sm text-muted-foreground">Schedule and record tests</p>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
