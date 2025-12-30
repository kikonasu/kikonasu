-- Add UPDATE policy for user_roles table
CREATE POLICY "Only admins can update user roles"
ON public.user_roles
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Add DELETE policy for user_roles table
CREATE POLICY "Only admins can delete user roles"
ON public.user_roles
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'::app_role));