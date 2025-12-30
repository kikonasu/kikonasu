-- Create wardrobe_items table
CREATE TABLE public.wardrobe_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  image_url TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('top', 'bottom', 'shoes', 'accessory')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.wardrobe_items ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own items" 
ON public.wardrobe_items 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own items" 
ON public.wardrobe_items 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own items" 
ON public.wardrobe_items 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own items" 
ON public.wardrobe_items 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_wardrobe_items_updated_at
BEFORE UPDATE ON public.wardrobe_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for wardrobe images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('wardrobe-images', 'wardrobe-images', true);

-- Create storage policies
CREATE POLICY "Users can view their own wardrobe images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'wardrobe-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own wardrobe images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'wardrobe-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own wardrobe images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'wardrobe-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own wardrobe images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'wardrobe-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Make wardrobe images publicly readable
CREATE POLICY "Wardrobe images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'wardrobe-images');