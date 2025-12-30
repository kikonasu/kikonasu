-- Update the handle_new_user_role function to automatically assign admin role
-- to users with the test admin email
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if this is the admin test account
  IF NEW.email = 'admin@kikonasu.com' THEN
    -- Insert admin role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  -- Always insert user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

-- If admin@kikonasu.com user already exists, grant them admin role
DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Find the user with admin email
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = 'admin@kikonasu.com';

  -- If found, insert admin role
  IF admin_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (admin_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END;
$$;
