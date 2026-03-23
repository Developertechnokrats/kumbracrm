-- Setup Carlito (Admin) and David Perry (Broker)
-- Run this AFTER they have signed up through the /sign-up page

-- Step 1: Update Carlito to be an admin at Kumbra Capital
UPDATE profiles
SET
  role = 'admin',
  full_name = 'Carlito',
  company_id = 'aa9cbf8a-2d0d-4218-b423-c1318c0f9101', -- Kumbra Capital
  updated_at = NOW()
WHERE email = 'carlito@kumbracapital.com';

-- Step 2: Update David Perry to be a broker at Kumbra Capital
UPDATE profiles
SET
  role = 'broker',
  full_name = 'David Perry',
  company_id = 'aa9cbf8a-2d0d-4218-b423-c1318c0f9101', -- Kumbra Capital
  updated_at = NOW()
WHERE email = 'david.perry@kumbracapital.com';

-- Step 3: Update their auth metadata for JWT claims
UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data ||
  jsonb_build_object(
    'company_id', 'aa9cbf8a-2d0d-4218-b423-c1318c0f9101',
    'role', 'admin'
  )
WHERE email = 'carlito@kumbracapital.com';

UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data ||
  jsonb_build_object(
    'company_id', 'aa9cbf8a-2d0d-4218-b423-c1318c0f9101',
    'role', 'broker'
  )
WHERE email = 'david.perry@kumbracapital.com';

-- Step 4: Delete their auto-created companies (optional cleanup)
-- This removes the empty companies created during signup
DELETE FROM companies
WHERE id IN (
  SELECT company_id
  FROM profiles
  WHERE email IN ('carlito@kumbracapital.com', 'david.perry@kumbracapital.com')
  AND company_id != 'aa9cbf8a-2d0d-4218-b423-c1318c0f9101'
);

-- Verify the setup
SELECT
  p.full_name,
  p.email,
  p.role,
  c.name as company_name
FROM profiles p
LEFT JOIN companies c ON c.id = p.company_id
WHERE p.email IN ('carlito@kumbracapital.com', 'david.perry@kumbracapital.com')
ORDER BY p.role DESC;
