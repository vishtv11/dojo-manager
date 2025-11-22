-- Add new fields to students table
ALTER TABLE public.students 
ADD COLUMN tai_certification_number TEXT,
ADD COLUMN state TEXT,
ADD COLUMN instructor_name TEXT;