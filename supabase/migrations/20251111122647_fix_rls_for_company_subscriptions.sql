/*
  # Fix RLS Policies for Company Subscriptions

  1. Changes
    - Add policy to allow users to read company_subscriptions for their company
    - This fixes the issue where entitlements can't be loaded

  2. Security
    - Users can only access their own company's subscriptions
*/

-- Allow users to read company_subscriptions for their company through their profile
DROP POLICY IF EXISTS "company_subscriptions-select-through-profile" ON company_subscriptions;
CREATE POLICY "company_subscriptions-select-through-profile"
  ON company_subscriptions
  FOR SELECT
  TO public
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );
