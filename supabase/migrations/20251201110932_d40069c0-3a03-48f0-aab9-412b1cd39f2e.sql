-- Add registration_number column to students table
ALTER TABLE public.students 
ADD COLUMN registration_number TEXT UNIQUE;

-- Add comment to explain the format
COMMENT ON COLUMN public.students.registration_number IS 'Auto-generated registration number in format: MTA + DOB (DDMMYYYY)';