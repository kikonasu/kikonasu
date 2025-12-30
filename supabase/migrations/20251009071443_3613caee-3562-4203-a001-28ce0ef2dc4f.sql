-- Create favorite_outfits table to store saved outfit combinations
CREATE TABLE public.favorite_outfits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  top_item_id UUID REFERENCES public.wardrobe_items(id) ON DELETE CASCADE,
  bottom_item_id UUID REFERENCES public.wardrobe_items(id) ON DELETE CASCADE,
  shoes_item_id UUID REFERENCES public.wardrobe_items(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.favorite_outfits ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own favorites"
ON public.favorite_outfits
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own favorites"
ON public.favorite_outfits
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites"
ON public.favorite_outfits
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX idx_favorite_outfits_user_id ON public.favorite_outfits(user_id);