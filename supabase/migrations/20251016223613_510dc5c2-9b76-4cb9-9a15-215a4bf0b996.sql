-- Create wish_list_items table
CREATE TABLE public.wish_list_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  image_url TEXT NOT NULL,
  category TEXT NOT NULL,
  ai_analysis TEXT,
  notes TEXT,
  outfit_potential INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.wish_list_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own wish list items" 
ON public.wish_list_items 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own wish list items" 
ON public.wish_list_items 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own wish list items" 
ON public.wish_list_items 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own wish list items" 
ON public.wish_list_items 
FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all wish list items" 
ON public.wish_list_items 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_wish_list_items_updated_at
BEFORE UPDATE ON public.wish_list_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for better query performance
CREATE INDEX idx_wish_list_items_user_id ON public.wish_list_items(user_id);
CREATE INDEX idx_wish_list_items_category ON public.wish_list_items(category);