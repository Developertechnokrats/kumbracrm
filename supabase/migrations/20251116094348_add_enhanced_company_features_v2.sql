/*
  # Enhanced Company Features and New Pipeline Statuses

  1. New Company Fields
    - Add location (address, city, country) to companies
    - Add product categories (what types of products they sell)
    - Add billing information (plan, monthly_charge, bolt_ons)
    - Add subscription level and billing status
    - Add branding (logo_url, primary_color)

  2. Updated Contact Statuses
    - Map old statuses to new pipeline stages
    - New statuses: Fresh Lead, Fronted, Apps In, KYC In, Trade Agreed, 
      Signed Agreement, Debtor, Hot Prospect, Paid Client, HTR, Call Backs, Dead Box

  3. New Tables
    - call_recordings: Store Zadarma call data and transcripts with AI analysis

  4. Security
    - RLS policies for call_recordings table
*/

-- Add new columns to companies table
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'United Kingdom',
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS primary_color TEXT DEFAULT '#3b82f6',
ADD COLUMN IF NOT EXISTS subscription_level TEXT DEFAULT 'standard',
ADD COLUMN IF NOT EXISTS monthly_charge DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS billing_status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS bolt_ons JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS product_categories TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Create call_recordings table for Zadarma integration
CREATE TABLE IF NOT EXISTS call_recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  broker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  call_id TEXT,
  recording_url TEXT,
  transcript TEXT,
  duration_seconds INTEGER,
  call_date TIMESTAMPTZ DEFAULT NOW(),
  ai_summary TEXT,
  ai_training_notes TEXT,
  ai_next_objectives TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE call_recordings ENABLE ROW LEVEL SECURITY;

-- Map old statuses to new ones
UPDATE contacts SET status = 'Signed Agreement' WHERE status = 'Agreement Signed';
UPDATE contacts SET status = 'Debtor' WHERE status = 'TT Received';
UPDATE contacts SET status = 'Debtor' WHERE status = 'Banked';
UPDATE contacts SET status = 'Hot Prospect' WHERE status = 'Kickers';
UPDATE contacts SET status = 'Fresh Lead' WHERE status = 'Active';

-- Update contact status constraint with new pipeline stages
DO $$ 
BEGIN
  -- Drop the existing constraint if it exists
  ALTER TABLE contacts DROP CONSTRAINT IF EXISTS contacts_status_check;
  
  -- Add new constraint with all statuses
  ALTER TABLE contacts ADD CONSTRAINT contacts_status_check 
    CHECK (status IN (
      'Fresh Lead',
      'Fronted',
      'Apps In',
      'KYC In',
      'Trade Agreed',
      'Signed Agreement',
      'Debtor',
      'Hot Prospect',
      'Paid Client',
      'HTR',
      'Call Backs',
      'Dead Box'
    ));
END $$;

-- Set default status for new contacts
ALTER TABLE contacts 
ALTER COLUMN status SET DEFAULT 'Fresh Lead';

-- RLS Policies for call_recordings
CREATE POLICY "Users can view their company call recordings"
  ON call_recordings FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Brokers can insert their own call recordings"
  ON call_recordings FOR INSERT
  TO authenticated
  WITH CHECK (
    broker_id = auth.uid()
    AND company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Brokers can update their own call recordings"
  ON call_recordings FOR UPDATE
  TO authenticated
  USING (
    broker_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
      AND profiles.company_id = call_recordings.company_id
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_call_recordings_contact ON call_recordings(contact_id);
CREATE INDEX IF NOT EXISTS idx_call_recordings_broker ON call_recordings(broker_id);
CREATE INDEX IF NOT EXISTS idx_call_recordings_company ON call_recordings(company_id);
CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts(status);
CREATE INDEX IF NOT EXISTS idx_companies_billing_status ON companies(billing_status);
