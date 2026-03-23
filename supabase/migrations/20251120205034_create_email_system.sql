/*
  # Email System for Sentra Capital

  1. New Tables
    - `email_senders`
      - `id` (uuid, primary key)
      - `company_id` (uuid, foreign key to companies)
      - `name` (text) - Display name for sender
      - `email` (text) - Email address
      - `smtp_host` (text, nullable) - SMTP server
      - `smtp_port` (integer, nullable) - SMTP port
      - `smtp_username` (text, nullable) - SMTP username
      - `smtp_password` (text, nullable) - Encrypted SMTP password
      - `is_active` (boolean) - Whether this sender is active
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `email_signatures`
      - `id` (uuid, primary key)
      - `company_id` (uuid, foreign key to companies)
      - `name` (text) - Signature name
      - `html_content` (text) - HTML signature content
      - `is_default` (boolean) - Default signature
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `email_templates`
      - `id` (uuid, primary key)
      - `company_id` (uuid, foreign key to companies)
      - `name` (text) - Template name
      - `subject` (text) - Email subject line
      - `body` (text) - Email body content (supports variables)
      - `category` (text, nullable) - Template category
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `emails`
      - `id` (uuid, primary key)
      - `company_id` (uuid, foreign key to companies)
      - `sender_id` (uuid, foreign key to email_senders)
      - `from_email` (text) - Sender email
      - `from_name` (text) - Sender name
      - `to_email` (text[]) - Recipient emails
      - `cc_email` (text[], nullable) - CC emails
      - `bcc_email` (text[], nullable) - BCC emails
      - `subject` (text) - Email subject
      - `body` (text) - Email body HTML
      - `signature_id` (uuid, nullable, foreign key to email_signatures)
      - `template_id` (uuid, nullable, foreign key to email_templates)
      - `direction` (text) - 'sent' or 'received'
      - `status` (text) - 'draft', 'sent', 'failed', 'received'
      - `sent_at` (timestamptz, nullable)
      - `received_at` (timestamptz, nullable)
      - `contact_id` (uuid, nullable, foreign key to contacts)
      - `user_id` (uuid, foreign key to profiles)
      - `error_message` (text, nullable)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for company members and super admins to access their company's data
*/

-- Email Senders Table
CREATE TABLE IF NOT EXISTS email_senders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  smtp_host text,
  smtp_port integer DEFAULT 587,
  smtp_username text,
  smtp_password text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE email_senders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members can view their email senders"
  ON email_senders FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
    OR 
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

CREATE POLICY "Company admins can insert email senders"
  ON email_senders FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Company admins can update email senders"
  ON email_senders FOR UPDATE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Company admins can delete email senders"
  ON email_senders FOR DELETE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- Email Signatures Table
CREATE TABLE IF NOT EXISTS email_signatures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  html_content text NOT NULL,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE email_signatures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members can view their email signatures"
  ON email_signatures FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
    OR 
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

CREATE POLICY "Company members can insert email signatures"
  ON email_signatures FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Company members can update email signatures"
  ON email_signatures FOR UPDATE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Company members can delete email signatures"
  ON email_signatures FOR DELETE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Email Templates Table
CREATE TABLE IF NOT EXISTS email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  category text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members can view their email templates"
  ON email_templates FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
    OR 
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

CREATE POLICY "Company members can insert email templates"
  ON email_templates FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Company members can update email templates"
  ON email_templates FOR UPDATE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Company members can delete email templates"
  ON email_templates FOR DELETE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Emails Table
CREATE TABLE IF NOT EXISTS emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES email_senders(id) ON DELETE SET NULL,
  from_email text NOT NULL,
  from_name text NOT NULL,
  to_email text[] NOT NULL,
  cc_email text[],
  bcc_email text[],
  subject text NOT NULL,
  body text NOT NULL,
  signature_id uuid REFERENCES email_signatures(id) ON DELETE SET NULL,
  template_id uuid REFERENCES email_templates(id) ON DELETE SET NULL,
  direction text NOT NULL CHECK (direction IN ('sent', 'received')),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'failed', 'received')),
  sent_at timestamptz,
  received_at timestamptz,
  contact_id uuid REFERENCES contacts(id) ON DELETE SET NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  error_message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members can view their emails"
  ON emails FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
    OR 
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

CREATE POLICY "Company members can insert emails"
  ON emails FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Company members can update emails"
  ON emails FOR UPDATE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Company members can delete emails"
  ON emails FOR DELETE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_email_senders_company_id ON email_senders(company_id);
CREATE INDEX IF NOT EXISTS idx_email_signatures_company_id ON email_signatures(company_id);
CREATE INDEX IF NOT EXISTS idx_email_templates_company_id ON email_templates(company_id);
CREATE INDEX IF NOT EXISTS idx_emails_company_id ON emails(company_id);
CREATE INDEX IF NOT EXISTS idx_emails_user_id ON emails(user_id);
CREATE INDEX IF NOT EXISTS idx_emails_contact_id ON emails(contact_id);
CREATE INDEX IF NOT EXISTS idx_emails_status ON emails(status);
CREATE INDEX IF NOT EXISTS idx_emails_direction ON emails(direction);
CREATE INDEX IF NOT EXISTS idx_emails_sent_at ON emails(sent_at);
CREATE INDEX IF NOT EXISTS idx_emails_received_at ON emails(received_at);
