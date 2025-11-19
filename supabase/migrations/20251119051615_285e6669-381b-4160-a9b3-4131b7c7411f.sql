-- Create fee structure enum
CREATE TYPE public.fee_structure AS ENUM ('2_classes_700', '4_classes_1000');

-- Add new columns to students table
ALTER TABLE public.students 
ADD COLUMN fee_structure public.fee_structure NOT NULL DEFAULT '2_classes_700',
ADD COLUMN date_of_birth DATE NOT NULL DEFAULT CURRENT_DATE;

-- Add comment for clarity
COMMENT ON COLUMN public.students.fee_structure IS 'Fee plan: 2_classes_700 = 2 classes per week at ₹700, 4_classes_1000 = 4 classes per week at ₹1000';
COMMENT ON COLUMN public.students.date_of_birth IS 'Student date of birth in DD/MM/YYYY format';