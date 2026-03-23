/*
  # Add Appointments System

  1. New Tables
    - `appointments`
      - `id` (uuid, primary key)
      - `contact_id` (uuid, foreign key to contacts)
      - `broker_id` (uuid, foreign key to profiles)
      - `title` (text)
      - `description` (text, nullable)
      - `appointment_date` (timestamptz)
      - `duration_minutes` (integer, default 30)
      - `status` (text, default 'scheduled') - scheduled, completed, cancelled, no_show
      - `reminder_sent` (boolean, default false)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `email_templates`
      - `id` (uuid, primary key)
      - `company_id` (uuid, foreign key to companies)
      - `name` (text)
      - `subject` (text)
      - `body` (text)
      - `category` (text) - welcome, follow_up, kyc_reminder, etc.
      - `created_by` (uuid, foreign key to profiles)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `stage_scripts`
      - `id` (uuid, primary key)
      - `company_id` (uuid, foreign key to companies)
      - `stage` (text) - pipeline stage name
      - `objective` (text)
      - `talking_points` (jsonb) - array of bullet points
      - `script` (text, nullable)
      - `next_steps` (jsonb) - array of next steps
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Contact Table Enhancement
    - Add new fields for client information

  3. Security
    - Enable RLS on all new tables
    - Add policies for brokers to manage their own appointments
    - Add policies for company-wide email templates and scripts
*/

-- Create appointments table
CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid REFERENCES contacts(id) ON DELETE CASCADE NOT NULL,
  broker_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  appointment_date timestamptz NOT NULL,
  duration_minutes integer DEFAULT 30,
  status text DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
  reminder_sent boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_appointments_broker_date ON appointments(broker_id, appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_contact ON appointments(contact_id);

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Brokers can view own appointments"
  ON appointments FOR SELECT
  TO authenticated
  USING (broker_id = auth.uid());

CREATE POLICY "Brokers can create own appointments"
  ON appointments FOR INSERT
  TO authenticated
  WITH CHECK (broker_id = auth.uid());

CREATE POLICY "Brokers can update own appointments"
  ON appointments FOR UPDATE
  TO authenticated
  USING (broker_id = auth.uid())
  WITH CHECK (broker_id = auth.uid());

CREATE POLICY "Brokers can delete own appointments"
  ON appointments FOR DELETE
  TO authenticated
  USING (broker_id = auth.uid());

-- Create email templates table
CREATE TABLE IF NOT EXISTS email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  category text DEFAULT 'general',
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_templates_company ON email_templates(company_id);

ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view company email templates"
  ON email_templates FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can create email templates"
  ON email_templates FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can update email templates"
  ON email_templates FOR UPDATE
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

-- Create stage scripts table
CREATE TABLE IF NOT EXISTS stage_scripts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  stage text NOT NULL,
  objective text NOT NULL,
  talking_points jsonb DEFAULT '[]'::jsonb,
  script text,
  next_steps jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(company_id, stage)
);

CREATE INDEX IF NOT EXISTS idx_stage_scripts_company ON stage_scripts(company_id);

ALTER TABLE stage_scripts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view company stage scripts"
  ON stage_scripts FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage stage scripts"
  ON stage_scripts FOR ALL
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

-- Enhance contacts table with additional fields
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'job_title') THEN
    ALTER TABLE contacts ADD COLUMN job_title text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'age') THEN
    ALTER TABLE contacts ADD COLUMN age integer;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'trading_range') THEN
    ALTER TABLE contacts ADD COLUMN trading_range text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'preferred_investment') THEN
    ALTER TABLE contacts ADD COLUMN preferred_investment text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'nationality') THEN
    ALTER TABLE contacts ADD COLUMN nationality text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'location') THEN
    ALTER TABLE contacts ADD COLUMN location text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'timezone') THEN
    ALTER TABLE contacts ADD COLUMN timezone text;
  END IF;
END $$;
