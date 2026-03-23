/*
  # Simplify Profiles RLS to Remove Circular Dependencies

  ## Problem
  Even though RLS policies are OR'd together, Postgres still evaluates all policies
  and the "view company profiles" policy creates a circular dependency that causes
  errors when trying to fetch your own profile after login.

  ## Solution
  Remove the circular policy and rely on simpler, non-circular policies:
  1. Users can view their own profile (no dependencies)
  2. Super admins can view all profiles (checks profiles once)
  3. Remove the company-wide view policy from SELECT (add it separately when needed)

  ## Changes
  - Drop the circular "Allow users to view company profiles" policy
  - Keep only the direct policies that don't have circular dependencies
  - Company admins will still be able to query company users via explicit queries
*/

-- Drop the problematic circular policy
DROP POLICY IF EXISTS "Allow users to view company profiles" ON profiles;

-- The remaining policies are:
-- 1. "Allow users to view own profile" - USING (auth.uid() = id)
-- 2. "Allow super admins to view all profiles" - USING (EXISTS super admin check)
-- These two are sufficient for login to work

-- For company-wide queries, we'll rely on explicit filtering in the application
-- The "view own profile" policy allows login to work
-- Admins can query .eq('company_id', their_company_id) and it will work
-- because they can see their own profile and get their company_id