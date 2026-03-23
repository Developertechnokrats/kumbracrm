/*
  # Fix Profiles RLS for Company Admins

  ## Problem
  Company admins cannot see their team members because RLS policies rely on JWT claims
  that may not be properly configured.

  ## Solution
  Update RLS policies to check the profiles table directly for company_id matching,
  which will work regardless of JWT configuration.

  ## Changes
  - Drop existing policies that depend on JWT
  - Create new policies that query the profiles table directly
  - Ensure admins can see all users in their company
  - Ensure users can see their own profile
  - Ensure super admins can see everything
*/

-- Drop existing policies
DROP POLICY IF EXISTS "profiles-select" ON profiles;
DROP POLICY IF EXISTS "profiles-select-own" ON profiles;
DROP POLICY IF EXISTS "profiles-dml" ON profiles;

-- Policy 1: Users can always view their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Policy 2: Super admins can view all profiles
CREATE POLICY "Super admins can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'super_admin'
    )
  );

-- Policy 3: Users can view profiles in their own company
CREATE POLICY "Users can view same company profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM profiles
      WHERE id = auth.uid()
    )
  );

-- Policy 4: Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy 5: Super admins can update all profiles
CREATE POLICY "Super admins can update all profiles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'super_admin'
    )
  );

-- Policy 6: Super admins can insert profiles
CREATE POLICY "Super admins can insert profiles"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'super_admin'
    )
  );

-- Policy 7: Super admins can delete profiles
CREATE POLICY "Super admins can delete profiles"
  ON profiles FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'super_admin'
    )
  );