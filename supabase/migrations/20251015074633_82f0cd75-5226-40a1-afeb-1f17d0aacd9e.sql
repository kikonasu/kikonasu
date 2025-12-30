-- Add email column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;

-- Update the handle_new_user function to include email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, name, email)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    NEW.email
  );
  RETURN NEW;
END;
$function$;

-- Add admin policies to allow admins to view all data
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view all wardrobe items"
ON public.wardrobe_items
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view all outfit history"
ON public.outfit_history
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view all favorite outfits"
ON public.favorite_outfits
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Backfill emails for existing users (run once)
-- This uses a security definer function to access auth.users
CREATE OR REPLACE FUNCTION public.backfill_profile_emails()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.profiles p
  SET email = au.email
  FROM auth.users au
  WHERE p.user_id = au.id AND p.email IS NULL;
END;
$function$;

-- Execute the backfill
SELECT public.backfill_profile_emails();