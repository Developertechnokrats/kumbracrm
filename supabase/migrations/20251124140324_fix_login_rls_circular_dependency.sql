/*
  # Fix Login RLS Circular Dependency

  ## Problem
  Users cannot log in because the RLS policy has a circular dependency.
  When logging in, the system needs to fetch the user's profile, but the RLS policy
  queries the profiles table to check company_id, which requires the profile to already be loaded.

  ## Solution
  Simplify the "Users can view own profile" policy to not have any subqueries.
  This policy must work immediately after login without depending on other data.

  ## Changes
  - Ensure users can always read their own profile using only auth.uid()
  - Keep company-wide access working for team views
  - Maintain super admin access
*/

-- Drop all existing SELECT policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Super admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view same company profiles" ON profiles;

-- Policy 1: Users can ALWAYS view their own profile (no subqueries, no dependencies)
CREATE POLICY "Allow users to view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Policy 2: Users can view profiles in their company (subquery is OK here since own profile is already accessible)
CREATE POLICY "Allow users to view company profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM profiles
      WHERE id = auth.uid()
    )
  );

-- Policy 3: Super admins can view all profiles
CREATE POLICY "Allow super admins to view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'super_admin'
    )
  );