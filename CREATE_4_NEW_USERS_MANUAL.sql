/*
  ============================================================================
  CREATE 4 NEW USER ACCOUNTS - RUN IN SUPABASE DASHBOARD
  ============================================================================

  IMPORTANT: You cannot create auth.users directly via SQL in production.
  Instead, use the Supabase Dashboard or have each user sign up.

  STEP 1: Go to Supabase Dashboard → Authentication → Users → Add User

  Create these 4 accounts:

  1. Email: david.perry@kumbracapital.com
     Password: DPwaesrd77@@

  2. Email: daniel.cavanaugh@sentra.capital
     Password: DCwaesrd77@@

  3. Email: lavi@sentra.capital
     Password: LAwaesrd77@@

  4. Email: clear@quotient-capital.com
     Password: CC422025!!

  ============================================================================
  STEP 2: After creating each user, run the SQL below to fix their profile
  ============================================================================
*/

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
-- STEP 3: Verify all accounts were created correctly
-- ============================================================================

SELECT
  p.email,
  p.full_name,
  p.role,
  c.name as company_name,
  u.raw_app_meta_data->>'role' as jwt_role,
  u.raw_app_meta_data->>'company_id' as jwt_company_id
FROM profiles p
LEFT JOIN companies c ON c.id = p.company_id
LEFT JOIN auth.users u ON u.id = p.id
WHERE p.email IN (
  'david.perry@kumbracapital.com',
  'daniel.cavanaugh@sentra.capital',
  'lavi@sentra.capital',
  'clear@quotient-capital.com'
)
ORDER BY c.name, p.role DESC;
