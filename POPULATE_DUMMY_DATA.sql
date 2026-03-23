/*
  POPULATE DUMMY DATA FOR NEW USERS

  Run this AFTER running CREATE_4_USERS.sql
  This adds dummy contacts for each broker to demonstrate the system working.
*/

-- ============================================================================
-- DUMMY CONTACTS FOR TOM MCCALLISTER (Quotient Capital Broker)
-- ============================================================================

INSERT INTO contacts (
  company_id,
  broker_id,
  first_name,
  last_name,
  email,
  phone,
  company_name,
  job_title,
  status,
  lead_source,
  estimated_value,
  notes,
  created_at
)
SELECT
  'bb9cbf8a-3d0d-5218-c423-d1318c0f9202',
  p.id,
  'James',
  'Robertson',
  'james.robertson@techcorp.com',
  '+44 20 7946 0958',
  'TechCorp Industries',
  'CFO',
  'new',
  'referral',
  250000.00,
  'Interested in our managed funds. Follow up next week.',
  NOW()
FROM profiles p
WHERE p.email = 'tom.mccallister@quotient-capital.com'

UNION ALL

SELECT
  'bb9cbf8a-3d0d-5218-c423-d1318c0f9202',
  p.id,
  'Sarah',
  'Mitchell',
  'sarah.mitchell@globalventures.co.uk',
  '+44 131 496 8200',
  'Global Ventures Ltd',
  'Investment Director',
  'qualified',
  'website',
  500000.00,
  'Looking for bond portfolio diversification. Very interested in our gold contracts.',
  NOW()
FROM profiles p
WHERE p.email = 'tom.mccallister@quotient-capital.com'

UNION ALL

SELECT
  'bb9cbf8a-3d0d-5218-c423-d1318c0f9202',
  p.id,
  'David',
  'Chen',
  'david.chen@wealthmasters.com',
  '+44 131 496 8201',
  'Wealth Masters',
  'Portfolio Manager',
  'proposal',
  'linkedin',
  750000.00,
  'Sent proposal for £750k managed fund investment. Awaiting response.',
  NOW()
FROM profiles p
WHERE p.email = 'tom.mccallister@quotient-capital.com'

UNION ALL

SELECT
  'bb9cbf8a-3d0d-5218-c423-d1318c0f9202',
  p.id,
  'Emma',
  'Thompson',
  'e.thompson@silveroak.co.uk',
  '+44 131 496 8202',
  'Silver Oak Investments',
  'Senior Advisor',
  'negotiation',
  'referral',
  1200000.00,
  'Negotiating terms for bond portfolio. Close to closing.',
  NOW()
FROM profiles p
WHERE p.email = 'tom.mccallister@quotient-capital.com'

UNION ALL

SELECT
  'bb9cbf8a-3d0d-5218-c423-d1318c0f9202',
  p.id,
  'Michael',
  'Fraser',
  'mfraser@pinnacle-group.com',
  '+44 131 496 8203',
  'Pinnacle Group',
  'CEO',
  'won',
  'cold_call',
  850000.00,
  'Deal closed! £850k in managed funds and gold contracts. Excellent client.',
  NOW()
FROM profiles p
WHERE p.email = 'tom.mccallister@quotient-capital.com';

-- ============================================================================
-- DUMMY CONTACTS FOR EXISTING KUMBRA BROKERS (for comparison)
-- ============================================================================

-- Add 2 contacts for Daniel Cavanaugh
INSERT INTO contacts (
  company_id,
  broker_id,
  first_name,
  last_name,
  email,
  phone,
  company_name,
  job_title,
  status,
  lead_source,
  estimated_value,
  notes,
  created_at
)
SELECT
  'aa9cbf8a-2d0d-4218-b423-c1318c0f9101',
  p.id,
  'Oliver',
  'Barnes',
  'oliver.barnes@innovate-uk.com',
  '+44 161 496 0300',
  'Innovate UK',
  'Finance Director',
  'qualified',
  'conference',
  180000.00,
  'Met at Manchester Finance Conference. Interested in IPO opportunities.',
  NOW()
FROM profiles p
WHERE p.email = 'daniel.cavanaugh@kumbracapital.com'

UNION ALL

SELECT
  'aa9cbf8a-2d0d-4218-b423-c1318c0f9101',
  p.id,
  'Lucy',
  'Hamilton',
  'l.hamilton@startupfund.co.uk',
  '+44 161 496 0301',
  'Startup Fund Partners',
  'Managing Partner',
  'proposal',
  'referral',
  425000.00,
  'Sent IPO investment proposal. Following up this week.',
  NOW()
FROM profiles p
WHERE p.email = 'daniel.cavanaugh@kumbracapital.com';

-- Add 2 contacts for Jennifer Williams
INSERT INTO contacts (
  company_id,
  broker_id,
  first_name,
  last_name,
  email,
  phone,
  company_name,
  job_title,
  status,
  lead_source,
  estimated_value,
  notes,
  created_at
)
SELECT
  'aa9cbf8a-2d0d-4218-b423-c1318c0f9101',
  p.id,
  'Thomas',
  'Wright',
  'thomas.wright@horizon-capital.com',
  '+44 161 496 0400',
  'Horizon Capital',
  'Investment Analyst',
  'new',
  'website',
  95000.00,
  'Initial inquiry about our IPO services. Scheduling first call.',
  NOW()
FROM profiles p
WHERE p.email = 'jennifer.williams@kumbracapital.com'

UNION ALL

SELECT
  'aa9cbf8a-2d0d-4218-b423-c1318c0f9101',
  p.id,
  'Sophie',
  'Anderson',
  's.anderson@northstar-investments.co.uk',
  '+44 161 496 0401',
  'North Star Investments',
  'Senior Associate',
  'negotiation',
  'linkedin',
  650000.00,
  'Final negotiations on £650k IPO investment. Very positive.',
  NOW()
FROM profiles p
WHERE p.email = 'jennifer.williams@kumbracapital.com';

-- Add 2 contacts for Michael Chen
INSERT INTO contacts (
  company_id,
  broker_id,
  first_name,
  last_name,
  email,
  phone,
  company_name,
  job_title,
  status,
  lead_source,
  estimated_value,
  notes,
  created_at
)
SELECT
  'aa9cbf8a-2d0d-4218-b423-c1318c0f9101',
  p.id,
  'Isabella',
  'Roberts',
  'i.roberts@venture-pro.com',
  '+44 161 496 0500',
  'Venture Pro Ltd',
  'Director',
  'qualified',
  'referral',
  380000.00,
  'Warm lead from existing client. Interested in our IPO pipeline.',
  NOW()
FROM profiles p
WHERE p.email = 'michael.chen@kumbracapital.com'

UNION ALL

SELECT
  'aa9cbf8a-2d0d-4218-b423-c1318c0f9101',
  p.id,
  'George',
  'Taylor',
  'george.taylor@equity-partners.co.uk',
  '+44 161 496 0501',
  'Equity Partners Group',
  'Partner',
  'won',
  'cold_call',
  520000.00,
  'Closed £520k IPO deal. Excellent working relationship established.',
  NOW()
FROM profiles p
WHERE p.email = 'michael.chen@kumbracapital.com';

-- ============================================================================
-- VERIFY DUMMY DATA CREATED
-- ============================================================================

-- Count contacts by broker
SELECT
  c.name as company,
  p.full_name as broker,
  COUNT(co.id) as contact_count,
  SUM(co.estimated_value) as total_pipeline_value
FROM profiles p
LEFT JOIN companies c ON c.id = p.company_id
LEFT JOIN contacts co ON co.broker_id = p.id
WHERE p.role = 'broker'
GROUP BY c.name, p.full_name
ORDER BY c.name, p.full_name;

-- Show all new contacts
SELECT
  c.name as company,
  p.full_name as broker,
  co.first_name || ' ' || co.last_name as contact_name,
  co.company_name as contact_company,
  co.status,
  co.estimated_value
FROM contacts co
JOIN profiles p ON p.id = co.broker_id
JOIN companies c ON c.id = co.company_id
ORDER BY c.name, p.full_name, co.status;
