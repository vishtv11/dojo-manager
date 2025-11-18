import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, Check, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Database } from "@/integrations/supabase/types";

const Attendance = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<Map<string, string>>(new Map());
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { isAdmin } = useAuth();

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    fetchAttendance();
  }, [selectedDate, students]);

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

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("attendance")
        .select("*")
        .eq("date", selectedDate);

      if (error) throw error;

      const attendanceMap = new Map();
      data?.forEach((record: any) => {
        attendanceMap.set(record.student_id, record.status);
      });

      setAttendance(attendanceMap);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load attendance",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const markAttendance = async (studentId: string, status: Database['public']['Enums']['attendance_status']) => {
    if (!isAdmin) return;

    try {
      const existingStatus = attendance.get(studentId);

      if (existingStatus) {
        // Update existing record
        const { error } = await supabase
          .from("attendance")
          .update({ status })
          .eq("student_id", studentId)
          .eq("date", selectedDate);

        if (error) throw error;
      } else {
        // Insert new record
        const { error } = await supabase
          .from("attendance")
          .insert([{ student_id: studentId, date: selectedDate, status }]);

        if (error) throw error;
      }

      const newAttendance = new Map(attendance);
      newAttendance.set(studentId, status);
      setAttendance(newAttendance);

      toast({
        title: "Attendance marked",
        description: `Marked as ${status}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to mark attendance",
        variant: "destructive",
      });
    }
  };

  const markAllPresent = async () => {
    if (!isAdmin) return;

    try {
      setSaving(true);
      for (const student of students) {
        if (!attendance.has(student.id)) {
          await markAttendance(student.id, "present");
        }
      }
      toast({
        title: "Success",
        description: "Marked all remaining students as present",
      });
      fetchAttendance();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to mark all as present",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status?: string) => {
    if (!status) return null;

    const styles = {
      present: "bg-green-100 text-green-800 border-green-300",
      absent: "bg-red-100 text-red-800 border-red-300",
      late: "bg-yellow-100 text-yellow-800 border-yellow-300",
    };

    const icons = {
      present: <Check className="h-3 w-3" />,
      absent: <X className="h-3 w-3" />,
      late: <CalendarIcon className="h-3 w-3" />,
    };

    return (
      <Badge className={styles[status as keyof typeof styles]} variant="outline">
        <span className="flex items-center gap-1">
          {icons[status as keyof typeof icons]}
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      </Badge>
    );
  };

  const presentCount = Array.from(attendance.values()).filter(s => s === "present").length;
  const absentCount = Array.from(attendance.values()).filter(s => s === "absent").length;
  const lateCount = Array.from(attendance.values()).filter(s => s === "late").length;

  if (loading && students.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Attendance</h1>
        <p className="text-muted-foreground">Mark and track student attendance</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Students</p>
                <p className="text-2xl font-bold">{students.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Present</p>
                <p className="text-2xl font-bold text-green-600">{presentCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Absent</p>
                <p className="text-2xl font-bold text-red-600">{absentCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Late</p>
                <p className="text-2xl font-bold text-yellow-600">{lateCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Select Date</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-center">
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="max-w-xs"
            />
            {isAdmin && (
              <Button onClick={markAllPresent} disabled={saving} variant="outline">
                {saving ? "Saving..." : "Mark All Present"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Mark Attendance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {students.map((student) => {
              const status = attendance.get(student.id);

              return (
                <div
                  key={student.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/10 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                      {student.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold">{student.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {student.current_belt.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase())}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {getStatusBadge(status)}
                    {isAdmin && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={status === "present" ? "default" : "outline"}
                          onClick={() => markAttendance(student.id, "present")}
                          className="gap-1"
                        >
                          <Check className="h-4 w-4" />
                          Present
                        </Button>
                        <Button
                          size="sm"
                          variant={status === "absent" ? "destructive" : "outline"}
                          onClick={() => markAttendance(student.id, "absent")}
                          className="gap-1"
                        >
                          <X className="h-4 w-4" />
                          Absent
                        </Button>
                        <Button
                          size="sm"
                          variant={status === "late" ? "secondary" : "outline"}
                          onClick={() => markAttendance(student.id, "late")}
                          className="gap-1"
                        >
                          Late
                        </Button>
                      </div>
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

export default Attendance;
