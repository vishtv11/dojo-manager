-- Add partial_amount_paid column to monthly_fees table
ALTER TABLE public.monthly_fees 
ADD COLUMN partial_amount_paid NUMERIC DEFAULT 0;

-- Add comment to explain the field
COMMENT ON COLUMN public.monthly_fees.partial_amount_paid IS 'Amount paid when status is partial. Should be less than the total amount.';