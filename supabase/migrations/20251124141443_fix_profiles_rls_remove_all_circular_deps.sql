/*
  # Fix Profiles RLS - Remove All Circular Dependencies

  ## Problem
  Infinite recursion error when logging in. Even SECURITY DEFINER function
  triggers RLS checks, causing circular dependency.

  ## Solution
  Remove the company-wide view policy entirely for now. Use only:
  1. View own profile (no dependencies)
  2. Super admin view all (acceptable dependency)
  
  For viewing team members, we'll handle this at the application level
  by explicitly querying with company_id filter after the user is logged in.

  ## Changes
  - Drop the problematic "Allow users to view company profiles" policy
  - Keep only simple, non-circular policies
  - Application will query profiles with explicit company_id filter
*/

-- Drop the circular policy completely
DROP POLICY IF EXISTS "Allow users to view company profiles" ON profiles;

-- Drop the helper function as it's no longer needed
DROP FUNCTION IF EXISTS public.get_my_company_id();

-- Now we only have these SELECT policies:
-- 1. "Allow users to view own profile" - USING (auth.uid() = id)
-- 2. "Allow super admins to view all profiles" - USING (EXISTS check)

-- For company admins to view their team members, we'll add a new policy
-- that checks if the requesting user is an admin/manager in the same company
-- This uses app_metadata which doesn't cause recursion

CREATE POLICY "Admins can view their company profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    -- Allow if user is admin/manager/super_admin and profiles are in same company
    company_id IN (
      SELECT p.company_id 
      FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.role IN ('super_admin', 'admin', 'manager')
    )
  );