/*
  # Fix Profiles RLS with Security Definer Function in Public Schema

  ## Problem
  The circular dependency in RLS policies prevents users from logging in.

  ## Solution
  Create a SECURITY DEFINER function in public schema that bypasses RLS
  to get the user's company_id.

  ## Changes
  1. Create helper function to get current user's company_id
  2. Recreate the company profiles policy using this function
*/

-- Create a helper function to get the current user's company_id
-- SECURITY DEFINER means it runs with elevated privileges (bypassing RLS)
CREATE OR REPLACE FUNCTION public.get_my_company_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT company_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_my_company_id() TO authenticated;

-- Recreate the company profiles policy using this function
CREATE POLICY "Allow users to view company profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (company_id = public.get_my_company_id());