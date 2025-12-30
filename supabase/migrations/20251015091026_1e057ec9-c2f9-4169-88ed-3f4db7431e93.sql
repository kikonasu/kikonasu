-- Fix Security Issue: Profile Creation Race Condition
-- Update the trigger to capture name from user metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    NEW.email
  );
  RETURN NEW;
END;
$$;

-- Fix Security Issue: Public Storage Bucket Allows Unrestricted File Access
-- Make the wardrobe-images bucket private
UPDATE storage.buckets
SET public = false
WHERE name = 'wardrobe-images';

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can upload their own wardrobe images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own wardrobe images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own wardrobe images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own wardrobe images" ON storage.objects;

-- Add RLS policies for storage.objects table
-- Users can only upload their own images
CREATE POLICY "Users can upload their own wardrobe images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'wardrobe-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can only access their own images
CREATE POLICY "Users can view their own wardrobe images"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'wardrobe-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can update their own images
CREATE POLICY "Users can update their own wardrobe images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'wardrobe-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can delete their own images
CREATE POLICY "Users can delete their own wardrobe images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'wardrobe-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);