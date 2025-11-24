-- Add certification_number field to belt_tests table to track TAI certification for each test
ALTER TABLE public.belt_tests 
ADD COLUMN certification_number text;

-- Add index for better query performance
CREATE INDEX idx_belt_tests_student_id ON public.belt_tests(student_id);
CREATE INDEX idx_attendance_student_id ON public.attendance(student_id);
CREATE INDEX idx_monthly_fees_student_id ON public.monthly_fees(student_id);