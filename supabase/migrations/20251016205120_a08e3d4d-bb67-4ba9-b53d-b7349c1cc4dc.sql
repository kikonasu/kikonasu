-- Add ai_analysis column to wardrobe_items table to store AI-generated descriptions
ALTER TABLE public.wardrobe_items
ADD COLUMN ai_analysis TEXT;