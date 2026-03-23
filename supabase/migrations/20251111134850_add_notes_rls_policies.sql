/*
  # Add RLS Policies for Notes

  1. Changes
    - Add policies to allow users to read and manage notes for contacts in their company
    - Enable note-taking functionality

  2. Security
    - Users can only access notes for contacts in their company
*/

-- Allow users to read notes for contacts in their company
DROP POLICY IF EXISTS "notes-select-company" ON notes;
CREATE POLICY "notes-select-company"
  ON notes
  FOR SELECT
  TO public
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Allow users to insert notes for contacts in their company
DROP POLICY IF EXISTS "notes-insert-company" ON notes;
CREATE POLICY "notes-insert-company"
  ON notes
  FOR INSERT
  TO public
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Allow users to update their own notes
DROP POLICY IF EXISTS "notes-update-own" ON notes;
CREATE POLICY "notes-update-own"
  ON notes
  FOR UPDATE
  TO public
  USING (broker_id = auth.uid())
  WITH CHECK (broker_id = auth.uid());

-- Allow users to delete their own notes
DROP POLICY IF EXISTS "notes-delete-own" ON notes;
CREATE POLICY "notes-delete-own"
  ON notes
  FOR DELETE
  TO public
  USING (broker_id = auth.uid());
