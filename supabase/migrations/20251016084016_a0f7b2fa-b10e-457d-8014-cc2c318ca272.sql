-- Add plan type and local planning support to suitcases table
ALTER TABLE public.suitcases 
ADD COLUMN plan_type text DEFAULT 'trip' CHECK (plan_type IN ('trip', 'week', 'custom')),
ADD COLUMN is_local boolean DEFAULT false;