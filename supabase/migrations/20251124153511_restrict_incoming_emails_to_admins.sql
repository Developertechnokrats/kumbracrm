/*
  # Restrict Incoming Emails to Admin Users Only
  
  1. Changes
    - Drop existing SELECT policy on emails table
    - Create new restrictive SELECT policies:
      - Admins and super_admins can see all emails (both sent and received)
      - Regular users can only see sent emails (not received)
  
  2. Security
    - Incoming emails (direction = 'received') are only visible to admin roles
    - Outgoing emails (direction = 'sent') are visible to all users in the company
*/

-- Drop existing SELECT policy
DROP POLICY IF EXISTS "Users can view own company emails" ON emails;

-- Create new SELECT policy for admins (can see all emails including incoming)
CREATE POLICY "Admins can view all company emails"
  ON emails
  FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- Create new SELECT policy for regular users (can only see sent emails)
CREATE POLICY "Users can view sent emails only"
  ON emails
  FOR SELECT
  TO authenticated
  USING (
    direction = 'sent'
    AND company_id IN (
      SELECT company_id FROM profiles 
      WHERE id = auth.uid()
      AND role NOT IN ('admin', 'super_admin')
    )
  );