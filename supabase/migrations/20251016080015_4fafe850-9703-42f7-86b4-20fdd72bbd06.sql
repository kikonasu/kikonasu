-- Create suitcases table for trip planning
CREATE TABLE public.suitcases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  trip_name TEXT NOT NULL,
  destination TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  trip_type TEXT DEFAULT 'work',
  weather_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT valid_dates CHECK (end_date >= start_date),
  CONSTRAINT valid_trip_type CHECK (trip_type IN ('work', 'casual', 'formal', 'beach', 'active'))
);

-- Create index for faster user queries
CREATE INDEX idx_suitcases_user_id ON public.suitcases(user_id);
CREATE INDEX idx_suitcases_dates ON public.suitcases(start_date, end_date);

-- Enable RLS
ALTER TABLE public.suitcases ENABLE ROW LEVEL SECURITY;

-- RLS Policies for suitcases
CREATE POLICY "Users can view their own suitcases"
  ON public.suitcases
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own suitcases"
  ON public.suitcases
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own suitcases"
  ON public.suitcases
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own suitcases"
  ON public.suitcases
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all suitcases"
  ON public.suitcases
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create suitcase_outfits table for daily outfit planning
CREATE TABLE public.suitcase_outfits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  suitcase_id UUID NOT NULL REFERENCES public.suitcases(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  day_number INTEGER NOT NULL,
  outfit_date DATE NOT NULL,
  top_item_id UUID,
  bottom_item_id UUID,
  shoes_item_id UUID,
  dress_item_id UUID,
  outerwear_item_id UUID,
  accessory_item_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT valid_day_number CHECK (day_number > 0),
  UNIQUE (suitcase_id, day_number)
);

-- Create indexes
CREATE INDEX idx_suitcase_outfits_suitcase_id ON public.suitcase_outfits(suitcase_id);
CREATE INDEX idx_suitcase_outfits_user_id ON public.suitcase_outfits(user_id);

-- Enable RLS
ALTER TABLE public.suitcase_outfits ENABLE ROW LEVEL SECURITY;

-- RLS Policies for suitcase_outfits
CREATE POLICY "Users can view their own suitcase outfits"
  ON public.suitcase_outfits
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own suitcase outfits"
  ON public.suitcase_outfits
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own suitcase outfits"
  ON public.suitcase_outfits
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own suitcase outfits"
  ON public.suitcase_outfits
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all suitcase outfits"
  ON public.suitcase_outfits
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at on suitcases
CREATE TRIGGER update_suitcases_updated_at
  BEFORE UPDATE ON public.suitcases
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add trigger for updated_at on suitcase_outfits
CREATE TRIGGER update_suitcase_outfits_updated_at
  BEFORE UPDATE ON public.suitcase_outfits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();