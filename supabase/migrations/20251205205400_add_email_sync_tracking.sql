/*
  # Email Sync Tracking System

  1. New Tables
    - `email_sync_status`
      - `id` (uuid, primary key)
      - `company_id` (uuid, references companies)
      - `sync_type` (text: 'inbound' or 'outbound')
      - `last_sync_at` (timestamptz)
      - `last_success_at` (timestamptz)
      - `last_error_at` (timestamptz)
      - `last_error_message` (text)
      - `total_received` (integer)
      - `total_sent` (integer)
      - `total_errors` (integer)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `email_sync_status` table
    - Add policies for company users to view their sync status
    - Add policies for super admins to view all sync statuses

  3. Changes
    - Tracks when emails were last checked/synced
    - Records success and error counts
    - Provides visibility into email system health
*/

CREATE TABLE IF NOT EXISTS email_sync_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  sync_type text NOT NULL CHECK (sync_type IN ('inbound', 'outbound')),
  last_sync_at timestamptz DEFAULT now(),
  last_success_at timestamptz,
  last_error_at timestamptz,
  last_error_message text,
  total_received integer DEFAULT 0,
  total_sent integer DEFAULT 0,
  total_errors integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(company_id, sync_type)
);

ALTER TABLE email_sync_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company users can view own sync status"
  ON email_sync_status FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Super admins can view all sync statuses"
  ON email_sync_status FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'super_admin'
    )
  );

CREATE POLICY "System can manage sync status"
  ON email_sync_status FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_email_sync_status_company ON email_sync_status(company_id);
CREATE INDEX IF NOT EXISTS idx_email_sync_status_type ON email_sync_status(company_id, sync_type);