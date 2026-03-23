/*
  # Add RLS Policies for Contacts

  1. Changes
    - Add policies to allow users to read and manage contacts for their company
    - This enables the dashboard and contacts page to work

  2. Security
    - Users can only access contacts from their own company
    - Super admins can access all contacts
*/

-- Allow users to read contacts for their company
DROP POLICY IF EXISTS "contacts-select-company" ON contacts;
CREATE POLICY "contacts-select-company"
  ON contacts
  FOR SELECT
  TO public
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
    OR 
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Allow users to insert contacts for their company
DROP POLICY IF EXISTS "contacts-insert-company" ON contacts;
CREATE POLICY "contacts-insert-company"
  ON contacts
  FOR INSERT
  TO public
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Allow users to update contacts for their company
DROP POLICY IF EXISTS "contacts-update-company" ON contacts;
CREATE POLICY "contacts-update-company"
  ON contacts
  FOR UPDATE
  TO public
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Allow users to delete contacts for their company
DROP POLICY IF EXISTS "contacts-delete-company" ON contacts;
CREATE POLICY "contacts-delete-company"
  ON contacts
  FOR DELETE
  TO public
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );
