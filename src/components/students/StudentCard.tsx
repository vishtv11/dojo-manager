import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Phone, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface StudentCardProps {
  student: any;
  onEdit: (student: any) => void;
  onDelete: () => void;
}

const StudentCard = ({ student, onEdit, onDelete }: StudentCardProps) => {
  const { toast } = useToast();
  const { isAdmin } = useAuth();

  const getBeltColor = (belt: string) => {
    const colors: Record<string, string> = {
      white: "bg-gray-200 text-gray-800",
      yellow: "bg-yellow-400 text-yellow-900",
      green: "bg-green-500 text-white",
      blue: "bg-blue-500 text-white",
      red: "bg-red-500 text-white",
      black_1st_dan: "bg-gray-900 text-white",
      black_2nd_dan: "bg-gray-900 text-white",
      black_3rd_dan: "bg-gray-900 text-white",
      black_4th_dan: "bg-gray-900 text-white",
      black_5th_dan: "bg-gray-900 text-white",
    };
    return colors[belt] || "bg-gray-200 text-gray-800";
  };

  const formatBeltName = (belt: string) => {
    return belt.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from("students")
        .delete()
        .eq("id", student.id);

      if (error) throw error;

      toast({
        title: "Student deleted",
        description: "Student has been successfully removed",
      });

      onDelete();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete student",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="shadow-card hover:shadow-elevated transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-16 w-16">
              <AvatarImage src={student.profile_photo_url} />
              <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                {student.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-lg">{student.name}</h3>
              <p className="text-sm text-muted-foreground">
                {student.age} years • {student.gender}
              </p>
            </div>
          </div>
          <Badge
            className={getBeltColor(student.current_belt)}
            variant="secondary"
          >
            {formatBeltName(student.current_belt)}
          </Badge>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="h-4 w-4" />
            <span>{student.phone_number}</span>
          </div>
          {student.address && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span className="truncate">{student.address}</span>
            </div>
          )}
          <p className="text-muted-foreground">
            Guardian: <span className="font-medium">{student.guardian_name}</span>
          </p>
          <p className="text-muted-foreground">
            Joined: {new Date(student.admission_date).toLocaleDateString()}
          </p>
        </div>

        {isAdmin && (
          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => onEdit(student)}
            >
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Student</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete {student.name}? This action
                    cannot be undone and will also delete all associated fees,
                    attendance, and belt test records.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StudentCard;
