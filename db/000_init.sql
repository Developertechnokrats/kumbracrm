/*
  # Sentra CRM - Initial Schema Migration

  1. Extensions
    - uuid-ossp for UUID generation
    - pgcrypto for encryption functions

  2. Core Tables
    - companies: Multi-tenant isolation
    - profiles: User accounts linked to auth.users
    - plans: Subscription tiers (Starter, Growth, Desk, Enterprise)
    - features: Feature flags and modules
    - plan_features: Features included in each plan
    - company_subscriptions: Active subscriptions
    - company_feature_overrides: Custom feature toggles per company
    - usage_counters: Usage tracking per feature

  3. CRM Tables
    - contacts: Leads and clients with KYC data
    - call_logs: Call history and outcomes
    - notes: Time-stamped notes on contacts
    - accounts: Investment accounts per contact

  4. Products Tables
    - issuers: Bond/fund issuers
    - products: Unified product catalogue (bonds, funds, pre-IPO, gold)
    - product_bond_details: Bond-specific fields
    - product_fund_details: Fund-specific fields
    - product_preipo_details: Pre-IPO-specific fields
    - product_gold_details: Gold/metals-specific fields
    - bond_selections: Up to 3 product selections per contact

  5. Trading Tables
    - orders: Buy/sell orders
    - fills: Order executions
    - holdings: Current positions
    - cash_ledger: Cash movements (deposits, withdrawals, coupons, fees)

  6. Compliance Tables
    - documents: KYC documents with versioning
    - audit_log: Full audit trail

  7. Security
    - Row Level Security enabled on all tables
    - Policies enforce company_id isolation from JWT claims
*/

-- EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- TENANCY
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#1b263f',
  address TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  data_region TEXT DEFAULT 'eu',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- AUTH & PROFILES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  title TEXT,
  role TEXT CHECK (role IN ('super_admin','admin','manager','broker','viewer')) NOT NULL DEFAULT 'broker',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ENTITLEMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  tier INT NOT NULL,
  is_public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.features (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.plan_features (
  plan_id UUID REFERENCES public.plans(id) ON DELETE CASCADE,
  feature_id UUID REFERENCES public.features(id) ON DELETE CASCADE,
  limits JSONB DEFAULT '{}'::JSONB,
  PRIMARY KEY (plan_id, feature_id)
);

CREATE TABLE IF NOT EXISTS public.company_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES public.plans(id),
  status TEXT CHECK (status IN ('trial','active','past_due','canceled')) NOT NULL DEFAULT 'trial',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  renews_at TIMESTAMPTZ,
  seats INT DEFAULT 5
);

CREATE TABLE IF NOT EXISTS public.company_feature_overrides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  feature_id UUID REFERENCES public.features(id) ON DELETE CASCADE,
  enabled BOOLEAN,
  limits JSONB,
  UNIQUE (company_id, feature_id)
);

CREATE TABLE IF NOT EXISTS public.usage_counters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  feature_key TEXT NOT NULL,
  window_start TIMESTAMPTZ NOT NULL,
  window_end TIMESTAMPTZ NOT NULL,
  used INT NOT NULL DEFAULT 0
);

-- ============================================================================
-- CORE CRM
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  lead_source TEXT,
  status TEXT,
  first_name TEXT,
  middle_name TEXT,
  last_name TEXT,
  full_name TEXT GENERATED ALWAYS AS (
    TRIM(COALESCE(first_name,'') || ' ' || COALESCE(middle_name,'') || ' ' || COALESCE(last_name,''))) STORED,
  title TEXT,
  dob DATE,
  country_of_birth TEXT,
  nationality TEXT,
  phone1 TEXT,
  phone2 TEXT,
  email TEXT,
  street_address TEXT,
  city TEXT,
  province TEXT,
  postcode TEXT,
  readiness TEXT,
  ideal_term TEXT,
  ideal_value TEXT,
  ideal_payments TEXT,
  ideal_interest TEXT,
  ideal_currency TEXT,
  ideal_range JSONB,
  asset_classes TEXT[],
  liquid NUMERIC,
  net_worth NUMERIC,
  annual_income NUMERIC,
  banks_with TEXT,
  proof_of_address BOOLEAN DEFAULT FALSE,
  proof_of_id BOOLEAN DEFAULT FALSE,
  signature BOOLEAN DEFAULT FALSE,
  account_type TEXT,
  dividend_bank TEXT,
  dividend_account_number TEXT,
  dividend_account_name TEXT,
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  next_action TEXT,
  last_conversation TIMESTAMPTZ,
  employment_status TEXT,
  advisor TEXT,
  investment_knowledge TEXT,
  objective TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.call_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  broker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  call_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  duration INTERVAL,
  outcome TEXT,
  next_action TEXT,
  next_call_scheduled TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  broker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  account_type TEXT DEFAULT 'individual',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PRODUCTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.issuers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  website TEXT,
  sector TEXT,
  domicile TEXT,
  rating_sp TEXT,
  rating_moodys TEXT,
  rating_fitch TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  issuer_id UUID REFERENCES public.issuers(id) ON DELETE SET NULL,
  product_type TEXT CHECK (product_type IN ('bond','fund','pre_ipo','gold')) NOT NULL,
  name TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  min_investment NUMERIC,
  term TEXT,
  payment_frequency TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.product_bond_details (
  product_id UUID PRIMARY KEY REFERENCES public.products(id) ON DELETE CASCADE,
  isin TEXT,
  coupon_rate NUMERIC,
  coupon_schedule JSONB,
  callable BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS public.product_fund_details (
  product_id UUID PRIMARY KEY REFERENCES public.products(id) ON DELETE CASCADE,
  mgmt_fee NUMERIC,
  perf_fee NUMERIC,
  distribution_policy TEXT
);

CREATE TABLE IF NOT EXISTS public.product_preipo_details (
  product_id UUID PRIMARY KEY REFERENCES public.products(id) ON DELETE CASCADE,
  round TEXT,
  price NUMERIC,
  allocation_limit NUMERIC
);

CREATE TABLE IF NOT EXISTS public.product_gold_details (
  product_id UUID PRIMARY KEY REFERENCES public.products(id) ON DELETE CASCADE,
  vault_location TEXT,
  storage_fee_bps INT,
  allocated BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS public.bond_selections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  selection_order INT CHECK (selection_order BETWEEN 1 AND 3),
  selected_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TRADING
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  price NUMERIC,
  order_status TEXT DEFAULT 'placed',
  placed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.fills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  price NUMERIC,
  filled_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.holdings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  current_units NUMERIC,
  cost_basis NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.cash_ledger (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  txn_type TEXT,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  value_date DATE NOT NULL,
  reference TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- DOCUMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
  document_type TEXT,
  filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  rejection_reason TEXT,
  doc_hash TEXT,
  version INT DEFAULT 1,
  retention_until DATE
);

-- ============================================================================
-- AUDIT LOG
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES public.profiles(id),
  entity TEXT NOT NULL,
  entity_id UUID,
  action TEXT NOT NULL,
  before JSONB,
  after JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issuers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_bond_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_fund_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_preipo_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_gold_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bond_selections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_feature_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_counters ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES - COMPANIES
-- ============================================================================

CREATE POLICY "company-isolation-select" ON public.companies
  FOR SELECT
  USING ((auth.jwt()->>'company_id')::UUID = id OR (auth.jwt()->>'role') = 'super_admin');

CREATE POLICY "company-isolation-dml" ON public.companies
  FOR ALL
  USING ((auth.jwt()->>'company_id')::UUID = id OR (auth.jwt()->>'role') = 'super_admin')
  WITH CHECK ((auth.jwt()->>'company_id')::UUID = id OR (auth.jwt()->>'role') = 'super_admin');

-- ============================================================================
-- RLS POLICIES - PROFILES
-- ============================================================================

CREATE POLICY "profiles-select" ON public.profiles
  FOR SELECT
  USING ((auth.jwt()->>'company_id')::UUID = company_id OR (auth.jwt()->>'role') = 'super_admin');

CREATE POLICY "profiles-dml" ON public.profiles
  FOR ALL
  USING ((auth.jwt()->>'company_id')::UUID = company_id OR (auth.jwt()->>'role') = 'super_admin')
  WITH CHECK ((auth.jwt()->>'company_id')::UUID = company_id OR (auth.jwt()->>'role') = 'super_admin');

-- ============================================================================
-- RLS POLICIES - CONTACTS
-- ============================================================================

CREATE POLICY "contacts-select" ON public.contacts
  FOR SELECT
  USING ((auth.jwt()->>'company_id')::UUID = company_id);

CREATE POLICY "contacts-dml" ON public.contacts
  FOR ALL
  USING ((auth.jwt()->>'company_id')::UUID = company_id)
  WITH CHECK ((auth.jwt()->>'company_id')::UUID = company_id);

-- ============================================================================
-- RLS POLICIES - CALL LOGS
-- ============================================================================

CREATE POLICY "call_logs-select" ON public.call_logs
  FOR SELECT
  USING ((auth.jwt()->>'company_id')::UUID = company_id);

CREATE POLICY "call_logs-dml" ON public.call_logs
  FOR ALL
  USING ((auth.jwt()->>'company_id')::UUID = company_id)
  WITH CHECK ((auth.jwt()->>'company_id')::UUID = company_id);

-- ============================================================================
-- RLS POLICIES - NOTES
-- ============================================================================

CREATE POLICY "notes-select" ON public.notes
  FOR SELECT
  USING ((auth.jwt()->>'company_id')::UUID = company_id);

CREATE POLICY "notes-dml" ON public.notes
  FOR ALL
  USING ((auth.jwt()->>'company_id')::UUID = company_id)
  WITH CHECK ((auth.jwt()->>'company_id')::UUID = company_id);

-- ============================================================================
-- RLS POLICIES - ISSUERS
-- ============================================================================

CREATE POLICY "issuers-select" ON public.issuers
  FOR SELECT
  USING ((auth.jwt()->>'company_id')::UUID = company_id);

CREATE POLICY "issuers-dml" ON public.issuers
  FOR ALL
  USING ((auth.jwt()->>'company_id')::UUID = company_id)
  WITH CHECK ((auth.jwt()->>'company_id')::UUID = company_id);

-- ============================================================================
-- RLS POLICIES - PRODUCTS
-- ============================================================================

CREATE POLICY "products-select" ON public.products
  FOR SELECT
  USING ((auth.jwt()->>'company_id')::UUID = company_id);

CREATE POLICY "products-dml" ON public.products
  FOR ALL
  USING ((auth.jwt()->>'company_id')::UUID = company_id)
  WITH CHECK ((auth.jwt()->>'company_id')::UUID = company_id);

-- ============================================================================
-- RLS POLICIES - PRODUCT DETAILS (all types)
-- ============================================================================

CREATE POLICY "product_bond_details-select" ON public.product_bond_details
  FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.products WHERE products.id = product_id AND (auth.jwt()->>'company_id')::UUID = products.company_id));

CREATE POLICY "product_bond_details-dml" ON public.product_bond_details
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.products WHERE products.id = product_id AND (auth.jwt()->>'company_id')::UUID = products.company_id))
  WITH CHECK (EXISTS (SELECT 1 FROM public.products WHERE products.id = product_id AND (auth.jwt()->>'company_id')::UUID = products.company_id));

CREATE POLICY "product_fund_details-select" ON public.product_fund_details
  FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.products WHERE products.id = product_id AND (auth.jwt()->>'company_id')::UUID = products.company_id));

CREATE POLICY "product_fund_details-dml" ON public.product_fund_details
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.products WHERE products.id = product_id AND (auth.jwt()->>'company_id')::UUID = products.company_id))
  WITH CHECK (EXISTS (SELECT 1 FROM public.products WHERE products.id = product_id AND (auth.jwt()->>'company_id')::UUID = products.company_id));

CREATE POLICY "product_preipo_details-select" ON public.product_preipo_details
  FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.products WHERE products.id = product_id AND (auth.jwt()->>'company_id')::UUID = products.company_id));

CREATE POLICY "product_preipo_details-dml" ON public.product_preipo_details
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.products WHERE products.id = product_id AND (auth.jwt()->>'company_id')::UUID = products.company_id))
  WITH CHECK (EXISTS (SELECT 1 FROM public.products WHERE products.id = product_id AND (auth.jwt()->>'company_id')::UUID = products.company_id));

CREATE POLICY "product_gold_details-select" ON public.product_gold_details
  FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.products WHERE products.id = product_id AND (auth.jwt()->>'company_id')::UUID = products.company_id));

CREATE POLICY "product_gold_details-dml" ON public.product_gold_details
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.products WHERE products.id = product_id AND (auth.jwt()->>'company_id')::UUID = products.company_id))
  WITH CHECK (EXISTS (SELECT 1 FROM public.products WHERE products.id = product_id AND (auth.jwt()->>'company_id')::UUID = products.company_id));

-- ============================================================================
-- RLS POLICIES - BOND SELECTIONS
-- ============================================================================

CREATE POLICY "bond_selections-select" ON public.bond_selections
  FOR SELECT
  USING ((auth.jwt()->>'company_id')::UUID = company_id);

CREATE POLICY "bond_selections-dml" ON public.bond_selections
  FOR ALL
  USING ((auth.jwt()->>'company_id')::UUID = company_id)
  WITH CHECK ((auth.jwt()->>'company_id')::UUID = company_id);

-- ============================================================================
-- RLS POLICIES - ACCOUNTS
-- ============================================================================

CREATE POLICY "accounts-select" ON public.accounts
  FOR SELECT
  USING ((auth.jwt()->>'company_id')::UUID = company_id);

CREATE POLICY "accounts-dml" ON public.accounts
  FOR ALL
  USING ((auth.jwt()->>'company_id')::UUID = company_id)
  WITH CHECK ((auth.jwt()->>'company_id')::UUID = company_id);

-- ============================================================================
-- RLS POLICIES - ORDERS
-- ============================================================================

CREATE POLICY "orders-select" ON public.orders
  FOR SELECT
  USING ((auth.jwt()->>'company_id')::UUID = company_id);

CREATE POLICY "orders-dml" ON public.orders
  FOR ALL
  USING ((auth.jwt()->>'company_id')::UUID = company_id)
  WITH CHECK ((auth.jwt()->>'company_id')::UUID = company_id);

-- ============================================================================
-- RLS POLICIES - FILLS
-- ============================================================================

CREATE POLICY "fills-select" ON public.fills
  FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_id AND (auth.jwt()->>'company_id')::UUID = orders.company_id));

CREATE POLICY "fills-dml" ON public.fills
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_id AND (auth.jwt()->>'company_id')::UUID = orders.company_id))
  WITH CHECK (EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_id AND (auth.jwt()->>'company_id')::UUID = orders.company_id));

-- ============================================================================
-- RLS POLICIES - HOLDINGS
-- ============================================================================

CREATE POLICY "holdings-select" ON public.holdings
  FOR SELECT
  USING ((auth.jwt()->>'company_id')::UUID = company_id);

CREATE POLICY "holdings-dml" ON public.holdings
  FOR ALL
  USING ((auth.jwt()->>'company_id')::UUID = company_id)
  WITH CHECK ((auth.jwt()->>'company_id')::UUID = company_id);

-- ============================================================================
-- RLS POLICIES - CASH LEDGER
-- ============================================================================

CREATE POLICY "cash_ledger-select" ON public.cash_ledger
  FOR SELECT
  USING ((auth.jwt()->>'company_id')::UUID = company_id);

CREATE POLICY "cash_ledger-dml" ON public.cash_ledger
  FOR ALL
  USING ((auth.jwt()->>'company_id')::UUID = company_id)
  WITH CHECK ((auth.jwt()->>'company_id')::UUID = company_id);

-- ============================================================================
-- RLS POLICIES - DOCUMENTS
-- ============================================================================

CREATE POLICY "documents-select" ON public.documents
  FOR SELECT
  USING ((auth.jwt()->>'company_id')::UUID = company_id);

CREATE POLICY "documents-dml" ON public.documents
  FOR ALL
  USING ((auth.jwt()->>'company_id')::UUID = company_id)
  WITH CHECK ((auth.jwt()->>'company_id')::UUID = company_id);

-- ============================================================================
-- RLS POLICIES - AUDIT LOG
-- ============================================================================

CREATE POLICY "audit_log-select" ON public.audit_log
  FOR SELECT
  USING ((auth.jwt()->>'company_id')::UUID = company_id OR (auth.jwt()->>'role') = 'super_admin');

CREATE POLICY "audit_log-insert" ON public.audit_log
  FOR INSERT
  WITH CHECK ((auth.jwt()->>'company_id')::UUID = company_id OR (auth.jwt()->>'role') = 'super_admin');

-- ============================================================================
-- RLS POLICIES - PLANS (public read)
-- ============================================================================

CREATE POLICY "plans-select" ON public.plans
  FOR SELECT
  USING (is_public = TRUE OR (auth.jwt()->>'role') = 'super_admin');

CREATE POLICY "plans-dml" ON public.plans
  FOR ALL
  USING ((auth.jwt()->>'role') = 'super_admin')
  WITH CHECK ((auth.jwt()->>'role') = 'super_admin');

-- ============================================================================
-- RLS POLICIES - FEATURES (public read)
-- ============================================================================

CREATE POLICY "features-select" ON public.features
  FOR SELECT
  USING (TRUE);

CREATE POLICY "features-dml" ON public.features
  FOR ALL
  USING ((auth.jwt()->>'role') = 'super_admin')
  WITH CHECK ((auth.jwt()->>'role') = 'super_admin');

-- ============================================================================
-- RLS POLICIES - PLAN FEATURES (public read)
-- ============================================================================

CREATE POLICY "plan_features-select" ON public.plan_features
  FOR SELECT
  USING (TRUE);

CREATE POLICY "plan_features-dml" ON public.plan_features
  FOR ALL
  USING ((auth.jwt()->>'role') = 'super_admin')
  WITH CHECK ((auth.jwt()->>'role') = 'super_admin');

-- ============================================================================
-- RLS POLICIES - COMPANY SUBSCRIPTIONS
-- ============================================================================

CREATE POLICY "company_subscriptions-select" ON public.company_subscriptions
  FOR SELECT
  USING ((auth.jwt()->>'company_id')::UUID = company_id OR (auth.jwt()->>'role') = 'super_admin');

CREATE POLICY "company_subscriptions-dml" ON public.company_subscriptions
  FOR ALL
  USING ((auth.jwt()->>'role') = 'super_admin' OR (auth.jwt()->>'role') = 'admin')
  WITH CHECK ((auth.jwt()->>'role') = 'super_admin' OR (auth.jwt()->>'role') = 'admin');

-- ============================================================================
-- RLS POLICIES - COMPANY FEATURE OVERRIDES
-- ============================================================================

CREATE POLICY "company_feature_overrides-select" ON public.company_feature_overrides
  FOR SELECT
  USING ((auth.jwt()->>'company_id')::UUID = company_id OR (auth.jwt()->>'role') = 'super_admin');

CREATE POLICY "company_feature_overrides-dml" ON public.company_feature_overrides
  FOR ALL
  USING ((auth.jwt()->>'role') = 'super_admin')
  WITH CHECK ((auth.jwt()->>'role') = 'super_admin');

-- ============================================================================
-- RLS POLICIES - USAGE COUNTERS
-- ============================================================================

CREATE POLICY "usage_counters-select" ON public.usage_counters
  FOR SELECT
  USING ((auth.jwt()->>'company_id')::UUID = company_id OR (auth.jwt()->>'role') = 'super_admin');

CREATE POLICY "usage_counters-dml" ON public.usage_counters
  FOR ALL
  USING ((auth.jwt()->>'company_id')::UUID = company_id OR (auth.jwt()->>'role') = 'super_admin')
  WITH CHECK ((auth.jwt()->>'company_id')::UUID = company_id OR (auth.jwt()->>'role') = 'super_admin');

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_profiles_company_id ON public.profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_contacts_company_id ON public.contacts(company_id);
CREATE INDEX IF NOT EXISTS idx_contacts_assigned_to ON public.contacts(assigned_to);
CREATE INDEX IF NOT EXISTS idx_contacts_status ON public.contacts(status);
CREATE INDEX IF NOT EXISTS idx_call_logs_contact_id ON public.call_logs(contact_id);
CREATE INDEX IF NOT EXISTS idx_notes_contact_id ON public.notes(contact_id);
CREATE INDEX IF NOT EXISTS idx_products_company_id ON public.products(company_id);
CREATE INDEX IF NOT EXISTS idx_products_type ON public.products(product_type);
CREATE INDEX IF NOT EXISTS idx_orders_account_id ON public.orders(account_id);
CREATE INDEX IF NOT EXISTS idx_holdings_account_id ON public.holdings(account_id);
CREATE INDEX IF NOT EXISTS idx_documents_contact_id ON public.documents(contact_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_company_id ON public.audit_log(company_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON public.audit_log(entity, entity_id);
