-- Add new category columns to outfit_history table
ALTER TABLE public.outfit_history 
ADD COLUMN IF NOT EXISTS dress_item_id UUID,
ADD COLUMN IF NOT EXISTS outerwear_item_id UUID,
ADD COLUMN IF NOT EXISTS accessory_item_id UUID;

-- Add new category columns to favorite_outfits table
ALTER TABLE public.favorite_outfits 
ADD COLUMN IF NOT EXISTS dress_item_id UUID,
ADD COLUMN IF NOT EXISTS outerwear_item_id UUID,
ADD COLUMN IF NOT EXISTS accessory_item_id UUID;