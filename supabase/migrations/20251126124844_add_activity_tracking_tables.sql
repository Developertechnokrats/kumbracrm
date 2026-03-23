/*
  # Add Activity Tracking Tables for Broker Performance

  1. New Tables
    - `contact_status_history`
      - Tracks all status changes for contacts
      - Records who changed it, when, from/to status
    - `call_logs`
      - Tracks all call activity (incoming and outgoing)
      - Records duration, outcome, participants
    
  2. Security
    - Enable RLS on all tables
    - Add policies for company-based access
*/

-- Contact Status History Table
CREATE TABLE IF NOT EXISTS contact_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  contact_id uuid NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  changed_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  from_status text NOT NULL,
  to_status text NOT NULL,
  changed_at timestamptz DEFAULT now(),
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE contact_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view status history in their company"
  ON contact_status_history FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can create status history in their company"
  ON contact_status_history FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Call Logs Table
CREATE TABLE IF NOT EXISTS call_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES contacts(id) ON DELETE SET NULL,
  broker_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  direction text NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  phone_number text NOT NULL,
  duration_seconds integer DEFAULT 0,
  status text NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'missed', 'voicemail', 'busy', 'no-answer', 'failed')),
  notes text,
  recording_url text,
  called_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE call_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view call logs in their company"
  ON call_logs FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can create call logs in their company"
  ON call_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own call logs"
  ON call_logs FOR UPDATE
  TO authenticated
  USING (broker_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_contact_status_history_contact ON contact_status_history(contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_status_history_company ON contact_status_history(company_id);
CREATE INDEX IF NOT EXISTS idx_contact_status_history_changed_by ON contact_status_history(changed_by);
CREATE INDEX IF NOT EXISTS idx_contact_status_history_changed_at ON contact_status_history(changed_at DESC);

CREATE INDEX IF NOT EXISTS idx_call_logs_contact ON call_logs(contact_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_company ON call_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_broker ON call_logs(broker_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_created_at ON call_logs(created_at DESC);
