-- Only create user_interactions table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'user_interactions'
  ) THEN
    -- Track user interactions for preference learning
    CREATE TABLE public.user_interactions (
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
  END IF;
END $$;