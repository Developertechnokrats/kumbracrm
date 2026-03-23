/*
  # Fix Contacts RLS for Super Admin
  
  The contacts-select and contacts-dml policies don't allow super_admin access.
  This prevents super admin from loading company stats that query contacts.
  
  Updates:
  - contacts-select: Add super_admin check
  - contacts-dml: Add super_admin check
*/

-- Drop and recreate contacts-select to include super_admin
DROP POLICY IF EXISTS "contacts-select" ON contacts;
CREATE POLICY "contacts-select"
  ON contacts
  FOR SELECT
  TO public
  USING (
    (((auth.jwt() ->> 'company_id'::text))::uuid = company_id)
    OR ((auth.jwt() ->> 'role'::text) = 'super_admin'::text)
  );

-- Drop and recreate contacts-dml to include super_admin
DROP POLICY IF EXISTS "contacts-dml" ON contacts;
CREATE POLICY "contacts-dml"
  ON contacts
  FOR ALL
  TO public
  USING (
    (((auth.jwt() ->> 'company_id'::text))::uuid = company_id)
    OR ((auth.jwt() ->> 'role'::text) = 'super_admin'::text)
  )
  WITH CHECK (
    (((auth.jwt() ->> 'company_id'::text))::uuid = company_id)
    OR ((auth.jwt() ->> 'role'::text) = 'super_admin'::text)
  );
