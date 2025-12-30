-- Create user_capsule_items table for tracking manual matches
CREATE TABLE IF NOT EXISTS public.user_capsule_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  template_id TEXT NOT NULL,
  template_item_id TEXT NOT NULL,
  wardrobe_item_id UUID REFERENCES public.wardrobe_items(id) ON DELETE CASCADE,
  match_type TEXT NOT NULL DEFAULT 'manual', -- 'auto', 'manual', 'uploaded'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, template_id, template_item_id)
);

-- Enable RLS
ALTER TABLE public.user_capsule_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own capsule items"
  ON public.user_capsule_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own capsule items"
  ON public.user_capsule_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own capsule items"
  ON public.user_capsule_items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own capsule items"
  ON public.user_capsule_items FOR DELETE
  USING (auth.uid() = user_id);

-- Create capsule_wishlist table
CREATE TABLE IF NOT EXISTS public.capsule_wishlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  template_id TEXT NOT NULL,
  template_item_id TEXT NOT NULL,
  item_name TEXT NOT NULL,
  item_category TEXT NOT NULL,
  item_description TEXT,
  price_range_low DECIMAL,
  price_range_high DECIMAL,
  notes TEXT,
  target_price DECIMAL,
  purchased BOOLEAN DEFAULT false,
  purchased_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.capsule_wishlist ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own wishlist"
  ON public.capsule_wishlist FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own wishlist items"
  ON public.capsule_wishlist FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own wishlist items"
  ON public.capsule_wishlist FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own wishlist items"
  ON public.capsule_wishlist FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_user_capsule_items_user_id ON public.user_capsule_items(user_id);
CREATE INDEX idx_user_capsule_items_template_id ON public.user_capsule_items(template_id);
CREATE INDEX idx_capsule_wishlist_user_id ON public.capsule_wishlist(user_id);
CREATE INDEX idx_capsule_wishlist_template_id ON public.capsule_wishlist(template_id);

-- Create trigger for updated_at
CREATE TRIGGER update_user_capsule_items_updated_at
  BEFORE UPDATE ON public.user_capsule_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_capsule_wishlist_updated_at
  BEFORE UPDATE ON public.capsule_wishlist
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();