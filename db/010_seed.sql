/*
  # Sentra CRM - Seed Data

  1. Plans
    - Starter (tier 1): Basic CRM features
    - Growth (tier 2): Adds sequences and reporting
    - Desk (tier 3): Full feature set with modules
    - Enterprise (tier 4): Custom plan with all features

  2. Features
    - Core CRM: leads, notes, docs, products, proposals, holdings
    - Automation: reminders, sequences
    - Reporting: advanced dashboards
    - Auth: SSO
    - Communications: WhatsApp/SMS
    - Advanced: E-sign, AI, Pre-IPO, Funds, Gold, Data warehouse, White-label

  3. Demo Company
    - Demo Capital with sample data
    - Issuers: Barclays PLC, BMO
    - Products: 2 sample bonds

  4. Test Users
    - Super Admin: admin@sentra.io / password123
    - Demo Broker: broker@demo.capital / password123
*/

-- ============================================================================
-- PLANS
-- ============================================================================

INSERT INTO public.plans (id, name, tier, is_public) VALUES
  ('10000000-0000-0000-0000-000000000001', 'Starter', 1, TRUE),
  ('10000000-0000-0000-0000-000000000002', 'Growth', 2, TRUE),
  ('10000000-0000-0000-0000-000000000003', 'Desk', 3, TRUE),
  ('10000000-0000-0000-0000-000000000004', 'Enterprise', 4, FALSE)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- FEATURES
-- ============================================================================

INSERT INTO public.features (key, label, description) VALUES
  ('crm.leads', 'Leads & Contacts', 'CRUD leads/contacts with statuses'),
  ('crm.notes', 'Notes & Call Logs', 'Time-stamped notes & call logs'),
  ('crm.docs', 'KYC Documents', 'Upload/review KYC docs'),
  ('crm.products', 'Products', 'Unified products & issuers'),
  ('crm.proposals', 'Proposals PDF', 'Generate simple proposals'),
  ('crm.holdings', 'Holdings Lite', 'Basic orders/allocations/holdings'),
  ('auto.reminders', 'Reminders', 'Calendar & maturity reminders'),
  ('auto.sequences', 'Sequences', 'Email sequences & chasers'),
  ('report.advanced', 'Advanced Reporting', 'Dashboards & cohort reports'),
  ('auth.sso', 'OAuth SSO', 'Google/Microsoft sign-in'),
  ('comms.whatsapp', 'WhatsApp/SMS', 'WA Business & SMS'),
  ('esign.core', 'E-sign', 'Agreements & signatures'),
  ('voice.ai', 'AI Call Summaries', 'Recordings + transcripts + AI'),
  ('preipo.core', 'Pre-IPO', 'Bookbuilding & allocations'),
  ('funds.core', 'Funds', 'Distributions & fees'),
  ('gold.core', 'Gold/Metals', 'Vaults & storage fees'),
  ('data.connect', 'Warehouse Sync', 'Export to BigQuery/Snowflake'),
  ('white.label', 'White-Label', 'Custom domain/theme')
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- PLAN FEATURES - STARTER
-- ============================================================================

INSERT INTO public.plan_features (plan_id, feature_id)
SELECT p.id, f.id FROM public.plans p, public.features f
WHERE p.name = 'Starter' AND f.key IN (
  'crm.leads',
  'crm.notes',
  'crm.docs',
  'crm.products',
  'crm.proposals',
  'crm.holdings',
  'auto.reminders'
)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- PLAN FEATURES - GROWTH
-- ============================================================================

INSERT INTO public.plan_features (plan_id, feature_id)
SELECT p.id, f.id FROM public.plans p, public.features f
WHERE p.name = 'Growth' AND f.key IN (
  'crm.leads',
  'crm.notes',
  'crm.docs',
  'crm.products',
  'crm.proposals',
  'crm.holdings',
  'auto.reminders',
  'auto.sequences',
  'report.advanced',
  'auth.sso'
)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- PLAN FEATURES - DESK
-- ============================================================================

INSERT INTO public.plan_features (plan_id, feature_id)
SELECT p.id, f.id FROM public.plans p, public.features f
WHERE p.name = 'Desk' AND f.key IN (
  'crm.leads',
  'crm.notes',
  'crm.docs',
  'crm.products',
  'crm.proposals',
  'crm.holdings',
  'auto.reminders',
  'auto.sequences',
  'report.advanced',
  'auth.sso',
  'comms.whatsapp',
  'esign.core',
  'voice.ai',
  'preipo.core',
  'funds.core',
  'gold.core'
)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- PLAN FEATURES - ENTERPRISE (all features)
-- ============================================================================

INSERT INTO public.plan_features (plan_id, feature_id)
SELECT p.id, f.id FROM public.plans p, public.features f
WHERE p.name = 'Enterprise'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- HQ COMPANY (Sentra - for super admins)
-- ============================================================================

INSERT INTO public.companies (id, name, website, primary_color, email) VALUES
  ('00000000-0000-0000-0000-000000000000', 'Sentra HQ', 'https://sentra.io', '#1b263f', 'admin@sentra.io')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- DEMO COMPANY
-- ============================================================================

INSERT INTO public.companies (id, name, website, primary_color, address, phone, email) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Demo Capital', 'https://demo.capital', '#1b263f',
   '123 Finance Street, London, EC2N 1AB', '+44 20 1234 5678', 'info@demo.capital')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- DEMO COMPANY SUBSCRIPTION
-- ============================================================================

INSERT INTO public.company_subscriptions (company_id, plan_id, status, seats, renews_at)
SELECT
  '11111111-1111-1111-1111-111111111111',
  id,
  'active',
  10,
  NOW() + INTERVAL '1 year'
FROM public.plans
WHERE name = 'Desk'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- ISSUERS
-- ============================================================================

INSERT INTO public.issuers (company_id, name, website, sector, domicile, rating_sp, rating_moodys, rating_fitch) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Barclays PLC', 'https://home.barclays/', 'Financials', 'UK', 'A-', 'A2', 'A'),
  ('11111111-1111-1111-1111-111111111111', 'BMO Financial Group', 'https://www.bmo.com/', 'Financials', 'Canada', 'A+', 'A1', 'A+'),
  ('11111111-1111-1111-1111-111111111111', 'Deutsche Bank AG', 'https://www.db.com/', 'Financials', 'Germany', 'BBB+', 'Baa2', 'BBB+')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- PRODUCTS - BONDS
-- ============================================================================

INSERT INTO public.products (id, company_id, issuer_id, product_type, name, currency, min_investment, term, payment_frequency, status) VALUES
  (
    '22222222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111',
    (SELECT id FROM public.issuers WHERE name = 'Barclays PLC' AND company_id = '11111111-1111-1111-1111-111111111111' LIMIT 1),
    'bond',
    'Barclays 6.25% 2029',
    'GBP',
    50000,
    '5y',
    'semi-annual',
    'active'
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    '11111111-1111-1111-1111-111111111111',
    (SELECT id FROM public.issuers WHERE name = 'BMO Financial Group' AND company_id = '11111111-1111-1111-1111-111111111111' LIMIT 1),
    'bond',
    'BMO 5.50% 2028',
    'CAD',
    50000,
    '3y',
    'quarterly',
    'active'
  ),
  (
    '44444444-4444-4444-4444-444444444444',
    '11111111-1111-1111-1111-111111111111',
    (SELECT id FROM public.issuers WHERE name = 'Deutsche Bank AG' AND company_id = '11111111-1111-1111-1111-111111111111' LIMIT 1),
    'bond',
    'Deutsche Bank 4.75% 2027',
    'EUR',
    100000,
    '4y',
    'annual',
    'active'
  )
ON CONFLICT DO NOTHING;

-- ============================================================================
-- PRODUCT BOND DETAILS
-- ============================================================================

INSERT INTO public.product_bond_details (product_id, isin, coupon_rate, coupon_schedule, callable) VALUES
  (
    '22222222-2222-2222-2222-222222222222',
    'XS0000000001',
    6.25,
    '{"freq":"semi-annual","months":[6,12],"days":[15]}'::JSONB,
    FALSE
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    'CA0000000002',
    5.50,
    '{"freq":"quarterly","months":[3,6,9,12],"days":[30]}'::JSONB,
    FALSE
  ),
  (
    '44444444-4444-4444-4444-444444444444',
    'DE0000000003',
    4.75,
    '{"freq":"annual","months":[12],"days":[31]}'::JSONB,
    FALSE
  )
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SAMPLE CONTACTS
-- ============================================================================

INSERT INTO public.contacts (
  id,
  company_id,
  lead_source,
  status,
  first_name,
  last_name,
  email,
  phone1,
  readiness,
  ideal_term,
  ideal_currency,
  liquid,
  net_worth,
  annual_income,
  proof_of_address,
  proof_of_id,
  next_action
) VALUES
  (
    'c0000000-0000-0000-0000-000000000001',
    '11111111-1111-1111-1111-111111111111',
    'Referral',
    'Fresh Lead',
    'John',
    'Smith',
    'john.smith@example.com',
    '+44 7700 900001',
    'High',
    '3-5y',
    'GBP',
    250000,
    1500000,
    180000,
    FALSE,
    FALSE,
    'Schedule introductory call'
  ),
  (
    'c0000000-0000-0000-0000-000000000002',
    '11111111-1111-1111-1111-111111111111',
    'Website',
    'KYC In Progress',
    'Sarah',
    'Johnson',
    'sarah.j@example.com',
    '+44 7700 900002',
    'Medium',
    '5y+',
    'USD',
    500000,
    2000000,
    250000,
    TRUE,
    TRUE,
    'Review uploaded KYC documents'
  ),
  (
    'c0000000-0000-0000-0000-000000000003',
    '11111111-1111-1111-1111-111111111111',
    'LinkedIn',
    'Paid Client',
    'Michael',
    'Chen',
    'm.chen@example.com',
    '+1 416 555 0103',
    'High',
    '3y',
    'CAD',
    750000,
    3000000,
    320000,
    TRUE,
    TRUE,
    'Quarterly portfolio review'
  )
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SAMPLE NOTES
-- ============================================================================

DO $$
DECLARE
  demo_broker_id UUID;
BEGIN
  SELECT id INTO demo_broker_id FROM public.profiles
  WHERE email = 'broker@demo.capital' AND company_id = '11111111-1111-1111-1111-111111111111'
  LIMIT 1;

  IF demo_broker_id IS NOT NULL THEN
    INSERT INTO public.notes (company_id, contact_id, broker_id, content) VALUES
      (
        '11111111-1111-1111-1111-111111111111',
        'c0000000-0000-0000-0000-000000000001',
        demo_broker_id,
        'Initial contact made. Client expressed interest in fixed income products with 5-7% yield. Will follow up with product comparison.'
      ),
      (
        '11111111-1111-1111-1111-111111111111',
        'c0000000-0000-0000-0000-000000000002',
        demo_broker_id,
        'KYC documents uploaded. Proof of address and ID verified. Moving to product selection stage.'
      ),
      (
        '11111111-1111-1111-1111-111111111111',
        'c0000000-0000-0000-0000-000000000003',
        demo_broker_id,
        'Client completed first investment of CAD 100,000 in BMO bond. Very satisfied with process and onboarding experience.'
      )
    ON CONFLICT DO NOTHING;
  END IF;
END $$;
