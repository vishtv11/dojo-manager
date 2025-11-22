import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Upload } from "lucide-react";
import { z } from "zod";
import { Database } from "@/integrations/supabase/types";

interface StudentDialogProps {
  open: boolean;
  student: any | null;
  onClose: (refresh: boolean) => void;
}

const studentSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  age: z.number().min(1, "Age must be at least 1").max(99, "Age must be less than 100"),
  gender: z.enum(["male", "female", "other"]),
  guardian_name: z.string().trim().min(1, "Guardian name is required").max(100),
  phone_number: z.string().trim().min(1, "Phone number is required").max(20),
  address: z.string().max(500).optional(),
  current_belt: z.string(),
  fee_structure: z.enum(["2_classes_700", "4_classes_1000"]),
  date_of_birth: z.string().min(1, "Date of birth is required"),
});

const StudentDialog = ({ open, student, onClose }: StudentDialogProps) => {
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "male",
    guardian_name: "",
    phone_number: "",
    address: "",
    current_belt: "white",
    admission_date: new Date().toISOString().split("T")[0],
    fee_structure: "2_classes_700",
    date_of_birth: "",
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (student) {
      setFormData({
        name: student.name || "",
        age: student.age?.toString() || "",
        gender: student.gender || "male",
        guardian_name: student.guardian_name || "",
        phone_number: student.phone_number || "",
        address: student.address || "",
        current_belt: student.current_belt || "white",
        admission_date: student.admission_date || new Date().toISOString().split("T")[0],
        fee_structure: student.fee_structure || "2_classes_700",
        date_of_birth: student.date_of_birth || "",
      });
    } else {
      setFormData({
        name: "",
        age: "",
        gender: "male",
        guardian_name: "",
        phone_number: "",
        address: "",
        current_belt: "white",
        admission_date: new Date().toISOString().split("T")[0],
        fee_structure: "2_classes_700",
        date_of_birth: "",
      });
    }
    setPhotoFile(null);
  }, [student, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const validatedData = studentSchema.parse({
        ...formData,
        age: parseInt(formData.age),
      });

      setLoading(true);

      let photoUrl = student?.profile_photo_url || null;

      // Upload photo if selected
      if (photoFile) {
        const fileExt = photoFile.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("student-photos")
          .upload(filePath, photoFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("student-photos")
          .getPublicUrl(filePath);

        photoUrl = publicUrl;
      }

      const studentData = {
        name: validatedData.name,
        age: validatedData.age,
        gender: validatedData.gender,
        guardian_name: validatedData.guardian_name,
        phone_number: validatedData.phone_number,
        address: validatedData.address,
        current_belt: formData.current_belt as Database['public']['Enums']['belt_level'],
        admission_date: formData.admission_date,
        profile_photo_url: photoUrl,
        is_active: true,
        fee_structure: validatedData.fee_structure as Database['public']['Enums']['fee_structure'],
        date_of_birth: validatedData.date_of_birth,
      };

      if (student) {
        const { error } = await supabase
          .from("students")
          .update(studentData)
          .eq("id", student.id);

        if (error) throw error;

        toast({
          title: "Student updated",
          description: "Student information has been updated successfully",
        });
      } else {
        const { error } = await supabase
          .from("students")
          .insert([studentData]);

        if (error) throw error;

        toast({
          title: "Student added",
          description: "New student has been added successfully",
        });
      }

      onClose(true);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation error",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to save student",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => onClose(false)}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {student ? "Edit Student" : "Add New Student"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                maxLength={100}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="age">Age *</Label>
              <Input
                id="age"
                type="number"
                min="1"
                max="99"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="gender">Gender *</Label>
              <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="current_belt">Current Belt *</Label>
              <Select value={formData.current_belt} onValueChange={(value) => setFormData({ ...formData, current_belt: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="white">White</SelectItem>
                  <SelectItem value="yellow_stripe">Yellow Stripe</SelectItem>
                  <SelectItem value="yellow">Yellow</SelectItem>
                  <SelectItem value="green_stripe">Green Stripe</SelectItem>
                  <SelectItem value="green">Green</SelectItem>
                  <SelectItem value="blue_stripe">Blue Stripe</SelectItem>
                  <SelectItem value="blue">Blue</SelectItem>
                  <SelectItem value="red_stripe">Red Stripe</SelectItem>
                  <SelectItem value="red">Red</SelectItem>
                  <SelectItem value="red_black">Red Black</SelectItem>
                  <SelectItem value="black_1st_dan">Black 1st Dan</SelectItem>
                  <SelectItem value="black_2nd_dan">Black 2nd Dan</SelectItem>
                  <SelectItem value="black_3rd_dan">Black 3rd Dan</SelectItem>
                  <SelectItem value="black_4th_dan">Black 4th Dan</SelectItem>
                  <SelectItem value="black_5th_dan">Black 5th Dan</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="guardian_name">Guardian Name *</Label>
              <Input
                id="guardian_name"
                value={formData.guardian_name}
                onChange={(e) => setFormData({ ...formData, guardian_name: e.target.value })}
                maxLength={100}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone_number">Phone Number *</Label>
              <Input
                id="phone_number"
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                maxLength={20}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              maxLength={500}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="admission_date">Admission Date *</Label>
            <Input
              id="admission_date"
              type="date"
              value={formData.admission_date}
              onChange={(e) => setFormData({ ...formData, admission_date: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date_of_birth">Date of Birth *</Label>
              <Input
                id="date_of_birth"
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fee_structure">Fee Structure *</Label>
              <Select value={formData.fee_structure} onValueChange={(value) => setFormData({ ...formData, fee_structure: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2_classes_700">2 classes/week - ₹700</SelectItem>
                  <SelectItem value="4_classes_1000">4 classes/week - ₹1000</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="photo">Profile Photo</Label>
            <div className="flex items-center gap-2">
              <Input
                id="photo"
                type="file"
                accept="image/*"
                onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById("photo")?.click()}
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                {photoFile ? photoFile.name : "Choose Photo"}
              </Button>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onClose(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : student ? "Update" : "Add Student"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default StudentDialog;
