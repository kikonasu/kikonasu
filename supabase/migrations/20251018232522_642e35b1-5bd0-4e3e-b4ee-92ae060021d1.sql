-- Create capsule_wardrobes table
CREATE TABLE public.capsule_wardrobes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  item_ids UUID[] NOT NULL,
  total_outfits INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.capsule_wardrobes ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own capsules" 
ON public.capsule_wardrobes 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own capsules" 
ON public.capsule_wardrobes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own capsules" 
ON public.capsule_wardrobes 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own capsules" 
ON public.capsule_wardrobes 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_capsule_wardrobes_updated_at
BEFORE UPDATE ON public.capsule_wardrobes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_capsule_wardrobes_user_id ON public.capsule_wardrobes(user_id);