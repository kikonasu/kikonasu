-- Create outfit_history table to track generated outfits
CREATE TABLE public.outfit_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  top_item_id UUID REFERENCES public.wardrobe_items(id) ON DELETE CASCADE,
  bottom_item_id UUID REFERENCES public.wardrobe_items(id) ON DELETE CASCADE,
  shoes_item_id UUID REFERENCES public.wardrobe_items(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.outfit_history ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own history"
ON public.outfit_history
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own history"
ON public.outfit_history
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own history"
ON public.outfit_history
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX idx_outfit_history_user_id ON public.outfit_history(user_id);
CREATE INDEX idx_outfit_history_created_at ON public.outfit_history(created_at DESC);