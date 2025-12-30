-- Drop the unique constraint that prevents multiple outfits per day
-- This allows users to add multiple outfits for the same day (e.g., daytime + evening)
ALTER TABLE public.suitcase_outfits 
DROP CONSTRAINT IF EXISTS suitcase_outfits_suitcase_id_day_number_key;