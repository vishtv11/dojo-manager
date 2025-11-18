import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Database } from "@/integrations/supabase/types";

const BeltTestDialog = ({ open, test, students, onClose }: any) => {
  const [formData, setFormData] = useState({ student_id: "", test_date: new Date().toISOString().split("T")[0], tested_for_belt: "yellow", test_fee: "50", result: "pending", notes: "" });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (test) setFormData({ student_id: test.student_id, test_date: test.test_date, tested_for_belt: test.tested_for_belt, test_fee: test.test_fee.toString(), result: test.result, notes: test.notes || "" });
    else setFormData({ student_id: "", test_date: new Date().toISOString().split("T")[0], tested_for_belt: "yellow", test_fee: "50", result: "pending", notes: "" });
  }, [test, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = { 
        ...formData, 
        test_fee: parseFloat(formData.test_fee),
        result: formData.result as Database['public']['Enums']['test_result'],
        tested_for_belt: formData.tested_for_belt as Database['public']['Enums']['belt_level']
      };
      if (test) {
        const { error } = await supabase.from("belt_tests").update(data).eq("id", test.id);
        if (error) throw error;
        toast({ title: "Test updated" });
      } else {
        const { error } = await supabase.from("belt_tests").insert([data]);
        if (error) throw error;
        toast({ title: "Test scheduled" });
      }
      onClose(true);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => onClose(false)}>
      <DialogContent className="max-w-md"><DialogHeader><DialogTitle>{test ? "Edit Test" : "Schedule Test"}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2"><Label>Student *</Label><Select value={formData.student_id} onValueChange={(v) => setFormData({ ...formData, student_id: v })} required><SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger><SelectContent>{students.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-2"><Label>Test Date *</Label><Input type="date" value={formData.test_date} onChange={(e) => setFormData({ ...formData, test_date: e.target.value })} required /></div>
          <div className="space-y-2"><Label>Testing For *</Label><Select value={formData.tested_for_belt} onValueChange={(v) => setFormData({ ...formData, tested_for_belt: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="yellow">Yellow</SelectItem><SelectItem value="green">Green</SelectItem><SelectItem value="blue">Blue</SelectItem><SelectItem value="red">Red</SelectItem><SelectItem value="black_1st_dan">Black 1st Dan</SelectItem></SelectContent></Select></div>
          <div className="space-y-2"><Label>Test Fee *</Label><Input type="number" step="0.01" value={formData.test_fee} onChange={(e) => setFormData({ ...formData, test_fee: e.target.value })} required /></div>
          <div className="space-y-2"><Label>Result</Label><Select value={formData.result} onValueChange={(v) => setFormData({ ...formData, result: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="pending">Pending</SelectItem><SelectItem value="passed">Passed</SelectItem><SelectItem value="failed">Failed</SelectItem></SelectContent></Select></div>
          <div className="space-y-2"><Label>Notes</Label><Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={2} /></div>
          <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => onClose(false)}>Cancel</Button><Button type="submit" disabled={loading}>{loading ? "Saving..." : test ? "Update" : "Schedule"}</Button></div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BeltTestDialog;
