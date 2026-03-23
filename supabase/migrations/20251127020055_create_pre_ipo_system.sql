/*
  # Create Pre-IPO Products and Deal Tickets System

  1. New Tables
    - `pre_ipo_products`
      - `id` (uuid, primary key)
      - `company_name` (text) - Name of the Pre-IPO company
      - `ticker_symbol` (text) - Stock ticker or abbreviation
      - `description` (text) - Brief overview of the company
      - `latest_share_price` (numeric) - Latest reported share price in USD
      - `broker_sell_price` (numeric) - Price at which brokers can sell
      - `logo_url` (text) - URL to company logo
      - `is_active` (boolean) - Whether product is available for sale
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `deal_tickets`
      - `id` (uuid, primary key)
      - `company_id` (uuid, foreign key to companies)
      - `contact_id` (uuid, foreign key to contacts)
      - `broker_id` (uuid, foreign key to profiles)
      - `product_id` (uuid, foreign key to pre_ipo_products)
      - `currency` (text) - Currency for the deal (USD, EUR, GBP, etc.)
      - `share_quantity` (integer) - Number of shares
      - `price_per_share` (numeric) - Price per share at time of deal
      - `total_amount` (numeric) - Total deal amount
      - `status` (text) - pending, approved, rejected, completed
      - `notes` (text) - Additional notes
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - Add `kyc_approved` field to contacts table
    - Add `kyc_approved_at` field to contacts table
    - Add `kyc_approved_by` field to contacts table (foreign key to profiles)

  2. Security
    - Enable RLS on both tables
    - Admins can manage Pre-IPO products
    - Brokers can view products and create deal tickets for their contacts
    - Contacts can view their own deal tickets
*/

-- Create pre_ipo_products table
CREATE TABLE IF NOT EXISTS pre_ipo_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL,
  ticker_symbol text NOT NULL UNIQUE,
  description text,
  latest_share_price numeric(12, 2),
  broker_sell_price numeric(12, 2) NOT NULL,
  logo_url text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create deal_tickets table
CREATE TABLE IF NOT EXISTS deal_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id),
  contact_id uuid NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  broker_id uuid NOT NULL REFERENCES profiles(id),
  product_id uuid NOT NULL REFERENCES pre_ipo_products(id),
  currency text NOT NULL DEFAULT 'USD',
  share_quantity integer NOT NULL CHECK (share_quantity > 0),
  price_per_share numeric(12, 2) NOT NULL CHECK (price_per_share > 0),
  total_amount numeric(15, 2) NOT NULL CHECK (total_amount > 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed', 'cancelled')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add KYC approval fields to contacts table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'kyc_approved'
  ) THEN
    ALTER TABLE contacts ADD COLUMN kyc_approved boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'kyc_approved_at'
  ) THEN
    ALTER TABLE contacts ADD COLUMN kyc_approved_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'kyc_approved_by'
  ) THEN
    ALTER TABLE contacts ADD COLUMN kyc_approved_by uuid REFERENCES profiles(id);
  END IF;
END $$;

-- Enable RLS
ALTER TABLE pre_ipo_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_tickets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pre_ipo_products

-- Anyone authenticated can view active products
CREATE POLICY "Authenticated users can view active products"
  ON pre_ipo_products FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Super admins and company admins can manage products
CREATE POLICY "Admins can manage products"
  ON pre_ipo_products FOR ALL
  TO authenticated
  USING (
    (auth.jwt()->>'role')::text IN ('super_admin', 'company_admin', 'admin')
  );

-- RLS Policies for deal_tickets

-- Brokers can view their own deal tickets
CREATE POLICY "Brokers can view own deal tickets"
  ON deal_tickets FOR SELECT
  TO authenticated
  USING (
    broker_id = auth.uid()
    OR (auth.jwt()->>'role')::text IN ('super_admin', 'company_admin', 'admin')
  );

-- Brokers can create deal tickets for their contacts
CREATE POLICY "Brokers can create deal tickets"
  ON deal_tickets FOR INSERT
  TO authenticated
  WITH CHECK (
    broker_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM contacts
      WHERE contacts.id = deal_tickets.contact_id
      AND contacts.assigned_to = auth.uid()
      AND contacts.kyc_approved = true
    )
  );

-- Brokers can update their own pending deal tickets
CREATE POLICY "Brokers can update own pending tickets"
  ON deal_tickets FOR UPDATE
  TO authenticated
  USING (
    broker_id = auth.uid()
    AND status = 'pending'
  )
  WITH CHECK (
    broker_id = auth.uid()
  );

-- Admins can update any deal ticket
CREATE POLICY "Admins can update deal tickets"
  ON deal_tickets FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt()->>'role')::text IN ('super_admin', 'company_admin', 'admin')
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_deal_tickets_broker ON deal_tickets(broker_id);
CREATE INDEX IF NOT EXISTS idx_deal_tickets_contact ON deal_tickets(contact_id);
CREATE INDEX IF NOT EXISTS idx_deal_tickets_status ON deal_tickets(status);
CREATE INDEX IF NOT EXISTS idx_contacts_kyc_approved ON contacts(kyc_approved);
