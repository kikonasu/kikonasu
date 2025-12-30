-- Change trip_type column from text to text[] to support multiple trip types
-- This allows users to select both Business and Pleasure for mixed-purpose trips

-- Step 1: Drop the existing check constraint
ALTER TABLE public.suitcases 
DROP CONSTRAINT IF EXISTS valid_trip_type;

-- Step 2: Drop the existing default value
ALTER TABLE public.suitcases 
ALTER COLUMN trip_type DROP DEFAULT;

-- Step 3: Change the column type to text[]
-- Use USING clause to convert existing text values to single-element arrays
ALTER TABLE public.suitcases 
ALTER COLUMN trip_type TYPE text[] 
USING CASE 
  WHEN trip_type IS NULL THEN ARRAY['work']::text[]
  ELSE ARRAY[trip_type]::text[]
END;

-- Step 4: Set a new default value for the array type
ALTER TABLE public.suitcases 
ALTER COLUMN trip_type SET DEFAULT ARRAY['work']::text[];

-- Step 5: Add a new check constraint for valid trip types in array format
-- Ensure all values in the array are from the allowed list and at least one value exists
ALTER TABLE public.suitcases
ADD CONSTRAINT valid_trip_types CHECK (
  trip_type <@ ARRAY['work', 'casual', 'formal', 'beach', 'active']::text[]
  AND array_length(trip_type, 1) >= 1
);