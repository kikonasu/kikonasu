-- Fix security issue: Add explicit search_path to function
-- This prevents potential schema injection attacks

CREATE OR REPLACE FUNCTION public.update_user_style_preferences_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;