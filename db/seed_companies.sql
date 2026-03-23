-- Seed Script for Sentra Capital and Quotient Capital
-- Creates admin, broker accounts and dummy contact data for each company

-- NOTE: Users must first sign up through /sign-up page, then run this script
-- to update their roles and add dummy data

-- =============================================================================
-- SENTRA CAPITAL USERS
-- =============================================================================

-- Admin: sarah.admin@sentracapital.com
-- Brokers: john.broker@sentracapital.com, emma.broker@sentracapital.com

-- Update Sentra admin
UPDATE profiles
SET role = 'admin',
    full_name = 'Sarah Mitchell',
    company_id = '00000000-0000-0000-0000-000000000000'
WHERE email = 'sarah.admin@sentracapital.com';

-- Update Sentra brokers
UPDATE profiles
SET role = 'broker',
    full_name = 'John Davis',
    company_id = '00000000-0000-0000-0000-000000000000'
WHERE email = 'john.broker@sentracapital.com';

UPDATE profiles
SET role = 'broker',
    full_name = 'Emma Thompson',
    company_id = '00000000-0000-0000-0000-000000000000'
WHERE email = 'emma.broker@sentracapital.com';

-- Update auth metadata for Sentra users
UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data ||
  jsonb_build_object('company_id', '00000000-0000-0000-0000-000000000000', 'role', 'admin')
WHERE email = 'sarah.admin@sentracapital.com';

UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data ||
  jsonb_build_object('company_id', '00000000-0000-0000-0000-000000000000', 'role', 'broker')
WHERE email IN ('john.broker@sentracapital.com', 'emma.broker@sentracapital.com');

-- =============================================================================
-- QUOTIENT CAPITAL USERS
-- =============================================================================

-- Admin: michael.admin@quotient-capital.com
-- Brokers: lisa.broker@quotient-capital.com, david.broker@quotient-capital.com

-- Update Quotient admin
UPDATE profiles
SET role = 'admin',
    full_name = 'Michael Roberts',
    company_id = 'bb9cbf8a-3d0d-5218-c423-d1318c0f9202'
WHERE email = 'michael.admin@quotient-capital.com';

-- Update Quotient brokers
UPDATE profiles
SET role = 'broker',
    full_name = 'Lisa Anderson',
    company_id = 'bb9cbf8a-3d0d-5218-c423-d1318c0f9202'
WHERE email = 'lisa.broker@quotient-capital.com';

UPDATE profiles
SET role = 'broker',
    full_name = 'David Chen',
    company_id = 'bb9cbf8a-3d0d-5218-c423-d1318c0f9202'
WHERE email = 'david.broker@quotient-capital.com';

-- Update auth metadata for Quotient users
UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data ||
  jsonb_build_object('company_id', 'bb9cbf8a-3d0d-5218-c423-d1318c0f9202', 'role', 'admin')
WHERE email = 'michael.admin@quotient-capital.com';

UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data ||
  jsonb_build_object('company_id', 'bb9cbf8a-3d0d-5218-c423-d1318c0f9202', 'role', 'broker')
WHERE email IN ('lisa.broker@quotient-capital.com', 'david.broker@quotient-capital.com');

-- =============================================================================
-- DUMMY CONTACTS FOR SENTRA CAPITAL (Bonds & Managed Funds)
-- =============================================================================

-- Get Sentra broker IDs
DO $$
DECLARE
  john_id UUID;
  emma_id UUID;
BEGIN
  SELECT id INTO john_id FROM profiles WHERE email = 'john.broker@sentracapital.com';
  SELECT id INTO emma_id FROM profiles WHERE email = 'emma.broker@sentracapital.com';

  -- John's contacts
  INSERT INTO contacts (company_id, broker_id, full_name, email, phone1, status, location, age, job_title, created_at) VALUES
  ('00000000-0000-0000-0000-000000000000', john_id, 'James Wilson', 'james.w@example.com', '+44 7700 900001', 'Fronted', 'London', 45, 'CFO', NOW() - INTERVAL '2 days'),
  ('00000000-0000-0000-0000-000000000000', john_id, 'Sophie Turner', 'sophie.t@example.com', '+44 7700 900002', 'Apps In', 'Manchester', 38, 'Investment Manager', NOW() - INTERVAL '5 days'),
  ('00000000-0000-0000-0000-000000000000', john_id, 'Robert Brown', 'robert.b@example.com', '+44 7700 900003', 'KYC In', 'Birmingham', 52, 'Business Owner', NOW() - INTERVAL '7 days'),
  ('00000000-0000-0000-0000-000000000000', john_id, 'Amanda Clarke', 'amanda.c@example.com', '+44 7700 900004', 'Trade Agreed', 'Leeds', 41, 'Portfolio Manager', NOW() - INTERVAL '10 days'),
  ('00000000-0000-0000-0000-000000000000', john_id, 'Thomas Green', 'thomas.g@example.com', '+44 7700 900005', 'Paid Client', 'Bristol', 48, 'Finance Director', NOW() - INTERVAL '15 days'),
  ('00000000-0000-0000-0000-000000000000', john_id, 'Jennifer Lee', 'jennifer.l@example.com', '+44 7700 900006', 'Hot Prospect', 'Edinburgh', 36, 'Hedge Fund Manager', NOW() - INTERVAL '3 days'),
  ('00000000-0000-0000-0000-000000000000', john_id, 'Mark Harrison', 'mark.h@example.com', '+44 7700 900007', 'Call Backs', 'Glasgow', 43, 'CEO', NOW() - INTERVAL '1 day'),
  ('00000000-0000-0000-0000-000000000000', john_id, 'Patricia White', 'patricia.w@example.com', '+44 7700 900008', 'Fresh Lead', 'Liverpool', 39, 'Private Banker', NOW());

  -- Emma's contacts
  INSERT INTO contacts (company_id, broker_id, full_name, email, phone1, status, location, age, job_title, created_at) VALUES
  ('00000000-0000-0000-0000-000000000000', emma_id, 'Daniel Scott', 'daniel.s@example.com', '+44 7700 900009', 'Fronted', 'Cambridge', 44, 'Wealth Manager', NOW() - INTERVAL '4 days'),
  ('00000000-0000-0000-0000-000000000000', emma_id, 'Rachel Adams', 'rachel.a@example.com', '+44 7700 900010', 'Apps In', 'Oxford', 37, 'Trust Officer', NOW() - INTERVAL '6 days'),
  ('00000000-0000-0000-0000-000000000000', emma_id, 'Christopher King', 'chris.k@example.com', '+44 7700 900011', 'Signed Agreement', 'Brighton', 50, 'Entrepreneur', NOW() - INTERVAL '12 days'),
  ('00000000-0000-0000-0000-000000000000', emma_id, 'Laura Martinez', 'laura.m@example.com', '+44 7700 900012', 'Debtor', 'Newcastle', 42, 'Investment Advisor', NOW() - INTERVAL '20 days'),
  ('00000000-0000-0000-0000-000000000000', emma_id, 'Andrew Taylor', 'andrew.t@example.com', '+44 7700 900013', 'Paid Client', 'Nottingham', 46, 'Fund Manager', NOW() - INTERVAL '25 days'),
  ('00000000-0000-0000-0000-000000000000', emma_id, 'Michelle Johnson', 'michelle.j@example.com', '+44 7700 900014', 'HTR', 'Sheffield', 40, 'Financial Planner', NOW() - INTERVAL '8 days'),
  ('00000000-0000-0000-0000-000000000000', emma_id, 'Kevin Moore', 'kevin.m@example.com', '+44 7700 900015', 'Call Backs', 'Cardiff', 35, 'Stockbroker', NOW() - INTERVAL '2 days'),
  ('00000000-0000-0000-0000-000000000000', emma_id, 'Sarah Phillips', 'sarah.p@example.com', '+44 7700 900016', 'Fresh Lead', 'Southampton', 41, 'Risk Manager', NOW());

  -- Unassigned leads for Sentra
  INSERT INTO contacts (company_id, full_name, email, phone1, status, location, age, job_title, created_at) VALUES
  ('00000000-0000-0000-0000-000000000000', 'George Harris', 'george.h@example.com', '+44 7700 900017', 'Fresh Lead', 'Reading', 47, 'Pension Fund Manager', NOW()),
  ('00000000-0000-0000-0000-000000000000', 'Helen Wilson', 'helen.w@example.com', '+44 7700 900018', 'Fresh Lead', 'York', 38, 'Investment Banker', NOW() - INTERVAL '1 hour'),
  ('00000000-0000-0000-0000-000000000000', 'Paul Robinson', 'paul.r@example.com', '+44 7700 900019', 'Fresh Lead', 'Bath', 43, 'Private Equity Manager', NOW() - INTERVAL '30 minutes');

END $$;

-- =============================================================================
-- DUMMY CONTACTS FOR QUOTIENT CAPITAL (Bonds, Managed Funds, Gold Contracts)
-- =============================================================================

-- Get Quotient broker IDs
DO $$
DECLARE
  lisa_id UUID;
  david_id UUID;
BEGIN
  SELECT id INTO lisa_id FROM profiles WHERE email = 'lisa.broker@quotient-capital.com';
  SELECT id INTO david_id FROM profiles WHERE email = 'david.broker@quotient-capital.com';

  -- Lisa's contacts
  INSERT INTO contacts (company_id, broker_id, full_name, email, phone1, status, location, age, job_title, created_at) VALUES
  ('bb9cbf8a-3d0d-5218-c423-d1318c0f9202', lisa_id, 'Alexander Fraser', 'alex.f@example.com', '+44 7800 900001', 'Fronted', 'Edinburgh', 49, 'Commodities Trader', NOW() - INTERVAL '3 days'),
  ('bb9cbf8a-3d0d-5218-c423-d1318c0f9202', lisa_id, 'Victoria Murray', 'victoria.m@example.com', '+44 7800 900002', 'Apps In', 'Aberdeen', 42, 'Gold Dealer', NOW() - INTERVAL '6 days'),
  ('bb9cbf8a-3d0d-5218-c423-d1318c0f9202', lisa_id, 'Duncan Campbell', 'duncan.c@example.com', '+44 7800 900003', 'KYC In', 'Inverness', 55, 'Mining Executive', NOW() - INTERVAL '8 days'),
  ('bb9cbf8a-3d0d-5218-c423-d1318c0f9202', lisa_id, 'Fiona Stewart', 'fiona.s@example.com', '+44 7800 900004', 'Trade Agreed', 'Dundee', 45, 'Precious Metals Broker', NOW() - INTERVAL '11 days'),
  ('bb9cbf8a-3d0d-5218-c423-d1318c0f9202', lisa_id, 'Malcolm Reid', 'malcolm.r@example.com', '+44 7800 900005', 'Paid Client', 'Perth', 51, 'Investment Director', NOW() - INTERVAL '18 days'),
  ('bb9cbf8a-3d0d-5218-c423-d1318c0f9202', lisa_id, 'Catherine Grant', 'catherine.g@example.com', '+44 7800 900006', 'Hot Prospect', 'Stirling', 39, 'Wealth Advisor', NOW() - INTERVAL '4 days'),
  ('bb9cbf8a-3d0d-5218-c423-d1318c0f9202', lisa_id, 'Ian Robertson', 'ian.r@example.com', '+44 7800 900007', 'Call Backs', 'Glasgow', 44, 'Fund Director', NOW() - INTERVAL '1 day'),
  ('bb9cbf8a-3d0d-5218-c423-d1318c0f9202', lisa_id, 'Margaret Thomson', 'margaret.t@example.com', '+44 7800 900008', 'Fresh Lead', 'Edinburgh', 40, 'Trust Manager', NOW());

  -- David's contacts
  INSERT INTO contacts (company_id, broker_id, full_name, email, phone1, status, location, age, job_title, created_at) VALUES
  ('bb9cbf8a-3d0d-5218-c423-d1318c0f9202', david_id, 'William MacLeod', 'william.m@example.com', '+44 7800 900009', 'Fronted', 'Aberdeen', 46, 'Energy Investor', NOW() - INTERVAL '5 days'),
  ('bb9cbf8a-3d0d-5218-c423-d1318c0f9202', david_id, 'Elizabeth Anderson', 'elizabeth.a@example.com', '+44 7800 900010', 'Apps In', 'Dundee', 38, 'Asset Manager', NOW() - INTERVAL '7 days'),
  ('bb9cbf8a-3d0d-5218-c423-d1318c0f9202', david_id, 'Robert MacKenzie', 'robert.mk@example.com', '+44 7800 900011', 'Signed Agreement', 'Inverness', 53, 'Retired Banker', NOW() - INTERVAL '14 days'),
  ('bb9cbf8a-3d0d-5218-c423-d1318c0f9202', david_id, 'Anne Gordon', 'anne.g@example.com', '+44 7800 900012', 'Debtor', 'Perth', 43, 'Bond Trader', NOW() - INTERVAL '22 days'),
  ('bb9cbf8a-3d0d-5218-c423-d1318c0f9202', david_id, 'James Ferguson', 'james.f@example.com', '+44 7800 900013', 'Paid Client', 'Edinburgh', 48, 'Hedge Fund Manager', NOW() - INTERVAL '28 days'),
  ('bb9cbf8a-3d0d-5218-c423-d1318c0f9202', david_id, 'Mary Wallace', 'mary.w@example.com', '+44 7800 900014', 'HTR', 'Glasgow', 41, 'Investment Consultant', NOW() - INTERVAL '9 days'),
  ('bb9cbf8a-3d0d-5218-c423-d1318c0f9202', david_id, 'Peter Sinclair', 'peter.s@example.com', '+44 7800 900015', 'Call Backs', 'Stirling', 36, 'Portfolio Analyst', NOW() - INTERVAL '2 days'),
  ('bb9cbf8a-3d0d-5218-c423-d1318c0f9202', david_id, 'Susan McDonald', 'susan.mc@example.com', '+44 7800 900016', 'Fresh Lead', 'Aberdeen', 42, 'Private Client Manager', NOW());

  -- Unassigned leads for Quotient
  INSERT INTO contacts (company_id, full_name, email, phone1, status, location, age, job_title, created_at) VALUES
  ('bb9cbf8a-3d0d-5218-c423-d1318c0f9202', 'Colin Bruce', 'colin.b@example.com', '+44 7800 900017', 'Fresh Lead', 'Edinburgh', 50, 'Precious Metals Investor', NOW()),
  ('bb9cbf8a-3d0d-5218-c423-d1318c0f9202', 'Dorothy Cameron', 'dorothy.c@example.com', '+44 7800 900018', 'Fresh Lead', 'Glasgow', 37, 'Fixed Income Trader', NOW() - INTERVAL '1 hour'),
  ('bb9cbf8a-3d0d-5218-c423-d1318c0f9202', 'Graham Young', 'graham.y@example.com', '+44 7800 900019', 'Fresh Lead', 'Dundee', 44, 'Commodities Analyst', NOW() - INTERVAL '45 minutes');

END $$;

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Check Sentra users
SELECT p.full_name, p.email, p.role, c.name as company_name
FROM profiles p
LEFT JOIN companies c ON c.id = p.company_id
WHERE p.email IN ('sarah.admin@sentracapital.com', 'john.broker@sentracapital.com', 'emma.broker@sentracapital.com')
ORDER BY p.role DESC, p.full_name;

-- Check Quotient users
SELECT p.full_name, p.email, p.role, c.name as company_name
FROM profiles p
LEFT JOIN companies c ON c.id = p.company_id
WHERE p.email IN ('michael.admin@quotient-capital.com', 'lisa.broker@quotient-capital.com', 'david.broker@quotient-capital.com')
ORDER BY p.role DESC, p.full_name;

-- Check Sentra contacts
SELECT
  COUNT(*) as total_contacts,
  COUNT(CASE WHEN broker_id IS NULL THEN 1 END) as unassigned,
  COUNT(DISTINCT broker_id) as brokers_with_contacts
FROM contacts
WHERE company_id = '00000000-0000-0000-0000-000000000000';

-- Check Quotient contacts
SELECT
  COUNT(*) as total_contacts,
  COUNT(CASE WHEN broker_id IS NULL THEN 1 END) as unassigned,
  COUNT(DISTINCT broker_id) as brokers_with_contacts
FROM contacts
WHERE company_id = 'bb9cbf8a-3d0d-5218-c423-d1318c0f9202';
