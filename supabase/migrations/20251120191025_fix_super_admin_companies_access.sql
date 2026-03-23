/*
  # Fix Super Admin Companies Access
  
  Removes the restrictive companies-select-through-profile policy
  that was preventing super admin from seeing all companies.
  
  The company-isolation-select policy already handles both:
  - Regular users seeing their own company
  - Super admin seeing all companies
*/

-- Drop the restrictive policy
DROP POLICY IF EXISTS "companies-select-through-profile" ON companies;

-- Verify the remaining policies are correct
-- company-isolation-select should allow:
-- 1. Users to see their own company (company_id matches)
-- 2. Super admin to see all companies (role = 'super_admin')
