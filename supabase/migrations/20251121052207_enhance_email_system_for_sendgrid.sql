/*
  # Enhance Email System for SendGrid Integration

  ## Overview
  This migration enhances the existing email system to support:
  - SendGrid message tracking
  - Email threading and conversations
  - Open/click/bounce tracking
  - Email analytics

  ## Changes to Existing Tables
  
  ### Enhance `emails` table
  - Add `thread_id` (uuid) - Links emails to conversation threads
  - Add `body_html` (text) - HTML version of email body
  - Add `sendgrid_message_id` (text) - SendGrid tracking ID
  - Add `opened_at` (timestamptz) - When email was opened
  - Add `clicked_at` (timestamptz) - When link was clicked
  - Add `bounced_at` (timestamptz) - When email bounced

  ## New Tables
  
  ### `email_threads`
  Represents email conversation threads
  - `id` (uuid, primary key)
  - `company_id` (uuid) - Company that owns this thread
  - `contact_id` (uuid, nullable) - Associated contact
  - `subject` (text) - Email subject line
  - `participants` (jsonb) - Array of email addresses in thread
  - `last_message_at` (timestamptz) - Last message timestamp
  - `created_at` (timestamptz)
  - `created_by` (uuid) - User who started thread

  ### `email_analytics`
  Aggregated email statistics
  - `id` (uuid, primary key)
  - `company_id` (uuid)
  - `date` (date)
  - `emails_sent` (integer)
  - `emails_delivered` (integer)
  - `emails_opened` (integer)
  - `emails_clicked` (integer)
  - `emails_bounced` (integer)
  - `unique_contacts_emailed` (integer)

  ## Security
  - RLS enabled on all tables
  - Company-scoped access
  - Super admin access to all data
*/

-- Create email_threads table
CREATE TABLE IF NOT EXISTS email_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES contacts(id) ON DELETE SET NULL,
  subject text NOT NULL,
  participants jsonb NOT NULL DEFAULT '[]'::jsonb,
  last_message_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Add missing columns to emails table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'emails' AND column_name = 'thread_id'
  ) THEN
    ALTER TABLE emails ADD COLUMN thread_id uuid REFERENCES email_threads(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'emails' AND column_name = 'body_html'
  ) THEN
    ALTER TABLE emails ADD COLUMN body_html text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'emails' AND column_name = 'sendgrid_message_id'
  ) THEN
    ALTER TABLE emails ADD COLUMN sendgrid_message_id text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'emails' AND column_name = 'opened_at'
  ) THEN
    ALTER TABLE emails ADD COLUMN opened_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'emails' AND column_name = 'clicked_at'
  ) THEN
    ALTER TABLE emails ADD COLUMN clicked_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'emails' AND column_name = 'bounced_at'
  ) THEN
    ALTER TABLE emails ADD COLUMN bounced_at timestamptz;
  END IF;
END $$;

-- Create email_analytics table
CREATE TABLE IF NOT EXISTS email_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  date date NOT NULL,
  emails_sent integer DEFAULT 0,
  emails_delivered integer DEFAULT 0,
  emails_opened integer DEFAULT 0,
  emails_clicked integer DEFAULT 0,
  emails_bounced integer DEFAULT 0,
  unique_contacts_emailed integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(company_id, date)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_email_threads_company_id ON email_threads(company_id);
CREATE INDEX IF NOT EXISTS idx_email_threads_contact_id ON email_threads(contact_id);
CREATE INDEX IF NOT EXISTS idx_email_threads_last_message ON email_threads(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_emails_thread_id ON emails(thread_id);
CREATE INDEX IF NOT EXISTS idx_emails_sendgrid_id ON emails(sendgrid_message_id);
CREATE INDEX IF NOT EXISTS idx_email_analytics_company_date ON email_analytics(company_id, date DESC);

-- Enable RLS
ALTER TABLE email_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for email_threads

CREATE POLICY "Super admins can view all email threads"
  ON email_threads FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Company members can view own company threads"
  ON email_threads FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT profiles.company_id FROM profiles
      WHERE profiles.id = auth.uid()
    )
  );

CREATE POLICY "Company members can create threads"
  ON email_threads FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT profiles.company_id FROM profiles
      WHERE profiles.id = auth.uid()
    )
  );

CREATE POLICY "Company members can update own company threads"
  ON email_threads FOR UPDATE
  TO authenticated
  USING (
    company_id IN (
      SELECT profiles.company_id FROM profiles
      WHERE profiles.id = auth.uid()
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT profiles.company_id FROM profiles
      WHERE profiles.id = auth.uid()
    )
  );

-- RLS Policies for email_analytics

CREATE POLICY "Super admins can view all email analytics"
  ON email_analytics FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Company members can view own company analytics"
  ON email_analytics FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT profiles.company_id FROM profiles
      WHERE profiles.id = auth.uid()
    )
  );

CREATE POLICY "Company members can insert analytics"
  ON email_analytics FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT profiles.company_id FROM profiles
      WHERE profiles.id = auth.uid()
    )
  );

CREATE POLICY "Company members can update own company analytics"
  ON email_analytics FOR UPDATE
  TO authenticated
  USING (
    company_id IN (
      SELECT profiles.company_id FROM profiles
      WHERE profiles.id = auth.uid()
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT profiles.company_id FROM profiles
      WHERE profiles.id = auth.uid()
    )
  );

-- Function to update thread last_message_at
CREATE OR REPLACE FUNCTION update_thread_last_message()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.thread_id IS NOT NULL THEN
    UPDATE email_threads
    SET last_message_at = NEW.created_at
    WHERE id = NEW.thread_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically update thread timestamp
DROP TRIGGER IF EXISTS update_thread_timestamp ON emails;
CREATE TRIGGER update_thread_timestamp
  AFTER INSERT ON emails
  FOR EACH ROW
  EXECUTE FUNCTION update_thread_last_message();

-- Function to update email analytics
CREATE OR REPLACE FUNCTION update_email_analytics()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process outbound emails
  IF NEW.direction = 'outbound' THEN
    INSERT INTO email_analytics (company_id, date, emails_sent)
    VALUES (NEW.company_id, CURRENT_DATE, 1)
    ON CONFLICT (company_id, date)
    DO UPDATE SET emails_sent = email_analytics.emails_sent + 1;
    
    -- Track status changes
    IF NEW.status = 'delivered' AND (OLD IS NULL OR OLD.status != 'delivered') THEN
      INSERT INTO email_analytics (company_id, date, emails_delivered)
      VALUES (NEW.company_id, CURRENT_DATE, 1)
      ON CONFLICT (company_id, date)
      DO UPDATE SET emails_delivered = email_analytics.emails_delivered + 1;
    END IF;
    
    IF NEW.opened_at IS NOT NULL AND (OLD IS NULL OR OLD.opened_at IS NULL) THEN
      INSERT INTO email_analytics (company_id, date, emails_opened)
      VALUES (NEW.company_id, CURRENT_DATE, 1)
      ON CONFLICT (company_id, date)
      DO UPDATE SET emails_opened = email_analytics.emails_opened + 1;
    END IF;
    
    IF NEW.clicked_at IS NOT NULL AND (OLD IS NULL OR OLD.clicked_at IS NULL) THEN
      INSERT INTO email_analytics (company_id, date, emails_clicked)
      VALUES (NEW.company_id, CURRENT_DATE, 1)
      ON CONFLICT (company_id, date)
      DO UPDATE SET emails_clicked = email_analytics.emails_clicked + 1;
    END IF;
    
    IF NEW.bounced_at IS NOT NULL AND (OLD IS NULL OR OLD.bounced_at IS NULL) THEN
      INSERT INTO email_analytics (company_id, date, emails_bounced)
      VALUES (NEW.company_id, CURRENT_DATE, 1)
      ON CONFLICT (company_id, date)
      DO UPDATE SET emails_bounced = email_analytics.emails_bounced + 1;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update analytics
DROP TRIGGER IF EXISTS track_email_analytics ON emails;
CREATE TRIGGER track_email_analytics
  AFTER INSERT OR UPDATE ON emails
  FOR EACH ROW
  EXECUTE FUNCTION update_email_analytics();