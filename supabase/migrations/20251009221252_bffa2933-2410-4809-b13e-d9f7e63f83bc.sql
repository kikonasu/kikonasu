-- Drop the existing category check constraint first
ALTER TABLE public.wardrobe_items 
DROP CONSTRAINT IF EXISTS wardrobe_items_category_check;

-- Now update existing categories to match new format
UPDATE public.wardrobe_items 
SET category = CASE 
  WHEN category = 'top' THEN 'Top'
  WHEN category = 'bottom' THEN 'Bottom'
  WHEN category = 'shoes' THEN 'Shoes'
  WHEN category = 'accessory' THEN 'Accessory'
  WHEN category = 'dress' THEN 'Dress'
  WHEN category = 'outerwear' THEN 'Outerwear'
  ELSE category
END;

-- Add updated constraint with all categories
ALTER TABLE public.wardrobe_items 
ADD CONSTRAINT wardrobe_items_category_check 
CHECK (category IN ('Top', 'Bottom', 'Shoes', 'Dress', 'Outerwear', 'Accessory'));