-- Create user style preferences table
CREATE TABLE IF NOT EXISTS public.user_style_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Color preferences (extracted from frequently used items)
  favorite_colors JSONB DEFAULT '[]'::jsonb,
  
  -- Item usage frequency
  item_usage JSONB DEFAULT '{}'::jsonb,
  
  -- Occasion preferences
  occasion_preferences JSONB DEFAULT '{}'::jsonb,
  
  -- Favorite combinations
  favorite_combinations JSONB DEFAULT '[]'::jsonb,
  
  -- Skip/regenerate patterns
  skip_patterns JSONB DEFAULT '{}'::jsonb,
  
  -- Last computed timestamp
  last_computed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_style_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own style preferences"
  ON public.user_style_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own style preferences"
  ON public.user_style_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own style preferences"
  ON public.user_style_preferences
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all style preferences"
  ON public.user_style_preferences
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_user_style_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_user_style_preferences_updated_at
  BEFORE UPDATE ON public.user_style_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_style_preferences_updated_at();

-- Add index for faster lookups
CREATE INDEX idx_user_style_preferences_user_id ON public.user_style_preferences(user_id);

-- Track user interactions for preference learning
CREATE TABLE IF NOT EXISTS public.user_interactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  interaction_type TEXT NOT NULL, -- 'favorite', 'skip', 'regenerate', 'view', 'share'
  interaction_data JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_interactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own interactions"
  ON public.user_interactions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own interactions"
  ON public.user_interactions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all interactions"
  ON public.user_interactions
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Add index for faster queries
CREATE INDEX idx_user_interactions_user_id ON public.user_interactions(user_id);
CREATE INDEX idx_user_interactions_type ON public.user_interactions(interaction_type);
CREATE INDEX idx_user_interactions_created_at ON public.user_interactions(created_at DESC);