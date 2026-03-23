/*
  # Fix RLS Policies for Initial Login

  1. Changes
    - Add policy to allow users to read their own profile by user ID
    - Add policy to allow users to read their own company by profile lookup
    - This fixes the issue where users can't access data immediately after login

  2. Security
    - Users can only access their own profile
    - Users can only access their company through their profile
*/

-- Drop and recreate policies to ensure they exist

-- Allow users to read their own profile by auth.uid()
DROP POLICY IF EXISTS "profiles-select-own" ON profiles;
CREATE POLICY "profiles-select-own"
  ON profiles
  FOR SELECT
  TO public
  USING (auth.uid() = id);

-- Allow users to read companies through their profile
DROP POLICY IF EXISTS "companies-select-through-profile" ON companies;
CREATE POLICY "companies-select-through-profile"
  ON companies
  FOR SELECT
  TO public
  USING (
    id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );
