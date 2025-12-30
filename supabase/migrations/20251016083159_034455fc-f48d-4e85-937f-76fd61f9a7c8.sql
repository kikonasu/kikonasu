-- Add occasion-related columns to suitcase_outfits table
ALTER TABLE public.suitcase_outfits 
ADD COLUMN occasion TEXT DEFAULT 'casual',
ADD COLUMN occasion_label TEXT,
ADD COLUMN time_of_day TEXT;

-- Add comment to explain the columns
COMMENT ON COLUMN public.suitcase_outfits.occasion IS 'Type of occasion: work, athletic, evening, formal, casual, beach, date, physical_work, travel, custom';
COMMENT ON COLUMN public.suitcase_outfits.occasion_label IS 'Custom label for the occasion';
COMMENT ON COLUMN public.suitcase_outfits.time_of_day IS 'Time of day: morning, daytime, evening';