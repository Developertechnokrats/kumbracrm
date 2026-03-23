/*
  CREATE 4 NEW USERS

  These need to be created via the sign-up page OR using Supabase Admin API.
  After creation, run the SQL below to assign correct roles and companies.
*/

-- ============================================================================
-- INSTRUCTIONS
-- ============================================================================
-- 1. Have each user sign up at /sign-up with their email and password below
-- 2. After signup, run this SQL to fix their roles and companies

-- ============================================================================
-- USER ACCOUNTS TO CREATE
-- ============================================================================
-- 1. david.perry@kumbracapital.com - Password: DPwaesrd77@@
-- 2. daniel.cavanaugh@sentra.capital - Password: DCwaesrd77@@
-- 3. lavi@sentra.capital - Password: LAwaesrd77@@
-- 4. clear@quotient-capital.com - Password: CC422025!!

-- ============================================================================
-- AFTER SIGNUP, RUN THIS SQL
-- ============================================================================

-- Fix David Perry (Broker at Kumbra Capital)
UPDATE profiles
SET
  role = 'broker',
  company_id = 'aa9cbf8a-2d0d-4218-b423-c1318c0f9101'::uuid,
  full_name = 'David Perry'
WHERE email = 'david.perry@kumbracapital.com';

UPDATE auth.users
SET raw_app_meta_data = jsonb_build_object(
  'role', 'broker',
  'provider', 'email',
  'providers', ARRAY['email'],
  'company_id', 'aa9cbf8a-2d0d-4218-b423-c1318c0f9101'
)
WHERE email = 'david.perry@kumbracapital.com';

-- Fix Daniel Cavanaugh (Broker at Sentra Capital)
UPDATE profiles
SET
  role = 'broker',
  company_id = '00000000-0000-0000-0000-000000000000'::uuid,
  full_name = 'Daniel Cavanaugh'
WHERE email = 'daniel.cavanaugh@sentra.capital';

UPDATE auth.users
SET raw_app_meta_data = jsonb_build_object(
  'role', 'broker',
  'provider', 'email',
  'providers', ARRAY['email'],
  'company_id', '00000000-0000-0000-0000-000000000000'
)
WHERE email = 'daniel.cavanaugh@sentra.capital';

-- Fix Lavi (Admin at Sentra Capital)
UPDATE profiles
SET
  role = 'admin',
  company_id = '00000000-0000-0000-0000-000000000000'::uuid,
  full_name = 'Lavi'
WHERE email = 'lavi@sentra.capital';

UPDATE auth.users
SET raw_app_meta_data = jsonb_build_object(
  'role', 'admin',
  'provider', 'email',
  'providers', ARRAY['email'],
  'company_id', '00000000-0000-0000-0000-000000000000'
)
WHERE email = 'lavi@sentra.capital';

-- Fix Clear Cut (Admin at Quotient Capital)
UPDATE profiles
SET
  role = 'admin',
  company_id = 'bb9cbf8a-3d0d-5218-c423-d1318c0f9202'::uuid,
  full_name = 'Clear Cut'
WHERE email = 'clear@quotient-capital.com';

UPDATE auth.users
SET raw_app_meta_data = jsonb_build_object(
  'role', 'admin',
  'provider', 'email',
  'providers', ARRAY['email'],
  'company_id', 'bb9cbf8a-3d0d-5218-c423-d1318c0f9202'
)
WHERE email = 'clear@quotient-capital.com';

-- ============================================================================
-- VERIFY ALL USERS CREATED CORRECTLY
-- ============================================================================
SELECT
  p.email,
  p.full_name,
  p.role,
  c.name as company_name
FROM profiles p
LEFT JOIN companies c ON c.id = p.company_id
WHERE p.email IN (
  'david.perry@kumbracapital.com',
  'daniel.cavanaugh@sentra.capital',
  'lavi@sentra.capital',
  'clear@quotient-capital.com'
)
ORDER BY c.name, p.role DESC;
