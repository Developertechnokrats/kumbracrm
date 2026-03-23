/*
  # Fix Super Admin RLS to work without Custom Access Token Hook
  
  1. Changes
    - Drop existing RLS policies on companies table
    - Create new policies that check the profiles table directly instead of JWT claims
    - This allows super_admin access without requiring the Custom Access Token Hook
  
  2. Security
    - Maintains same security model
    - Super admins can access all companies
    - Regular users can only access their own company
*/

-- Drop existing policies
DROP POLICY IF EXISTS "company-isolation-select" ON companies;
DROP POLICY IF EXISTS "company-isolation-dml" ON companies;

-- Create new policies that check profiles table directly
CREATE POLICY "Super admin can view all companies"
  ON companies
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Users can view own company"
  ON companies
  FOR SELECT
  TO authenticated
  USING (
    id = (
      SELECT company_id FROM profiles
      WHERE profiles.id = auth.uid()
    )
  );

CREATE POLICY "Super admin can modify all companies"
  ON companies
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Users can modify own company"
  ON companies
  FOR ALL
  TO authenticated
  USING (
    id = (
      SELECT company_id FROM profiles
      WHERE profiles.id = auth.uid()
    )
  )
  WITH CHECK (
    id = (
      SELECT company_id FROM profiles
      WHERE profiles.id = auth.uid()
    )
  );
