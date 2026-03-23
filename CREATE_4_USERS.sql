/*
  CREATE 4 NEW USERS

  Run this in Supabase SQL Editor to create the 4 users.
  This must be run with proper auth.users permissions.
*/

-- ============================================================================
-- STEP 1: Temporarily disable auto-signup trigger
-- ============================================================================
ALTER TABLE auth.users DISABLE TRIGGER on_auth_user_created;

-- ============================================================================
-- STEP 2: Create all 4 users in auth.users
-- ============================================================================

-- User 1: Tom McCallister (Broker at Quotient)
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change,
  aud,
  role
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'tom.mccallister@quotient-capital.com',
  crypt('TMwaesrd77@@', gen_salt('bf')),
  NOW(),
  jsonb_build_object(
    'provider', 'email',
    'providers', ARRAY['email'],
    'role', 'broker',
    'company_id', 'bb9cbf8a-3d0d-5218-c423-d1318c0f9202'
  ),
  jsonb_build_object(
    'full_name', 'Tom McCallister',
    'email_verified', true,
    'phone_verified', false
  ),
  NOW(),
  NOW(),
  '',
  '',
  '',
  '',
  'authenticated',
  'authenticated'
);

-- User 2: AD - Quotient Admin
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change,
  aud,
  role
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'ad@quotient-capital.com',
  crypt('ADwaesrd77@@', gen_salt('bf')),
  NOW(),
  jsonb_build_object(
    'provider', 'email',
    'providers', ARRAY['email'],
    'role', 'admin',
    'company_id', 'bb9cbf8a-3d0d-5218-c423-d1318c0f9202'
  ),
  jsonb_build_object(
    'full_name', 'AD - Quotient Admin',
    'email_verified', true,
    'phone_verified', false
  ),
  NOW(),
  NOW(),
  '',
  '',
  '',
  '',
  'authenticated',
  'authenticated'
);

-- User 3: Clear Cut (Admin at Quotient)
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change,
  aud,
  role
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'clear@quotient-capital.com',
  crypt('CC422025!!', gen_salt('bf')),
  NOW(),
  jsonb_build_object(
    'provider', 'email',
    'providers', ARRAY['email'],
    'role', 'admin',
    'company_id', 'bb9cbf8a-3d0d-5218-c423-d1318c0f9202'
  ),
  jsonb_build_object(
    'full_name', 'Clear Cut',
    'email_verified', true,
    'phone_verified', false
  ),
  NOW(),
  NOW(),
  '',
  '',
  '',
  '',
  'authenticated',
  'authenticated'
);

-- User 4: AD - Kumbra Admin
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change,
  aud,
  role
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'ad@kumbracapital.com',
  crypt('ADwaesrd77@@', gen_salt('bf')),
  NOW(),
  jsonb_build_object(
    'provider', 'email',
    'providers', ARRAY['email'],
    'role', 'admin',
    'company_id', 'aa9cbf8a-2d0d-4218-b423-c1318c0f9101'
  ),
  jsonb_build_object(
    'full_name', 'AD - Kumbra Admin',
    'email_verified', true,
    'phone_verified', false
  ),
  NOW(),
  NOW(),
  '',
  '',
  '',
  '',
  'authenticated',
  'authenticated'
);

-- ============================================================================
-- STEP 3: Create profiles for all 4 users
-- ============================================================================

-- Profile 1: Tom McCallister
INSERT INTO profiles (id, email, full_name, role, company_id, created_at, updated_at)
SELECT
  id,
  'tom.mccallister@quotient-capital.com',
  'Tom McCallister',
  'broker',
  'bb9cbf8a-3d0d-5218-c423-d1318c0f9202',
  NOW(),
  NOW()
FROM auth.users
WHERE email = 'tom.mccallister@quotient-capital.com';

-- Profile 2: AD - Quotient Admin
INSERT INTO profiles (id, email, full_name, role, company_id, created_at, updated_at)
SELECT
  id,
  'ad@quotient-capital.com',
  'AD - Quotient Admin',
  'admin',
  'bb9cbf8a-3d0d-5218-c423-d1318c0f9202',
  NOW(),
  NOW()
FROM auth.users
WHERE email = 'ad@quotient-capital.com';

-- Profile 3: Clear Cut
INSERT INTO profiles (id, email, full_name, role, company_id, created_at, updated_at)
SELECT
  id,
  'clear@quotient-capital.com',
  'Clear Cut',
  'admin',
  'bb9cbf8a-3d0d-5218-c423-d1318c0f9202',
  NOW(),
  NOW()
FROM auth.users
WHERE email = 'clear@quotient-capital.com';

-- Profile 4: AD - Kumbra Admin
INSERT INTO profiles (id, email, full_name, role, company_id, created_at, updated_at)
SELECT
  id,
  'ad@kumbracapital.com',
  'AD - Kumbra Admin',
  'admin',
  'aa9cbf8a-2d0d-4218-b423-c1318c0f9101',
  NOW(),
  NOW()
FROM auth.users
WHERE email = 'ad@kumbracapital.com';

-- ============================================================================
-- STEP 4: Create subscriptions for all users
-- ============================================================================

INSERT INTO company_subscriptions (user_id, tier, status)
SELECT id, 'professional', 'active'
FROM auth.users
WHERE email IN (
  'tom.mccallister@quotient-capital.com',
  'ad@quotient-capital.com',
  'clear@quotient-capital.com',
  'ad@kumbracapital.com'
);

-- ============================================================================
-- STEP 5: Re-enable the trigger
-- ============================================================================
ALTER TABLE auth.users ENABLE TRIGGER on_auth_user_created;

-- ============================================================================
-- VERIFY ALL USERS CREATED
-- ============================================================================
SELECT
  p.email,
  p.full_name,
  p.role,
  c.name as company_name
FROM profiles p
LEFT JOIN companies c ON c.id = p.company_id
WHERE p.email IN (
  'tom.mccallister@quotient-capital.com',
  'ad@quotient-capital.com',
  'clear@quotient-capital.com',
  'ad@kumbracapital.com'
)
ORDER BY c.name, p.role DESC, p.email;
