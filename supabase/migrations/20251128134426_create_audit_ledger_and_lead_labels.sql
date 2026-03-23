/*
  # Create Audit Ledger and Lead Labels System

  1. New Tables
    - `lead_labels`
      - `id` (uuid, primary key)
      - `name` (text) - Label name (e.g., "Hot Lead", "Newsletter", "AI Qualified")
      - `color` (text) - Color code for the label
      - `company_id` (uuid, foreign key)
      - `created_at` (timestamptz)
    
    - `contact_labels`
      - `id` (uuid, primary key)
      - `contact_id` (uuid, foreign key to contacts)
      - `label_id` (uuid, foreign key to lead_labels)
      - `created_at` (timestamptz)
    
    - `audit_ledger`
      - `id` (uuid, primary key)
      - `entity_type` (text) - Type of entity (contact, note, deal_ticket, etc.)
      - `entity_id` (uuid) - ID of the affected entity
      - `action` (text) - Action performed (created, updated, deleted, assigned, etc.)
      - `actor_id` (uuid, foreign key to profiles) - Who performed the action
      - `old_values` (jsonb) - Previous state
      - `new_values` (jsonb) - New state
      - `metadata` (jsonb) - Additional context
      - `company_id` (uuid, foreign key to companies)
      - `created_at` (timestamptz)
      - `reversible` (boolean) - Whether this action can be undone
      - `reversed_at` (timestamptz) - When action was reversed
      - `reversed_by` (uuid, foreign key to profiles)

  2. Modifications
    - Add `lead_label` field to contacts table for primary label
    - Add `ai_chat_notes` field to contacts for lengthy AI notes

  3. Security
    - Enable RLS on all new tables
    - Audit ledger is append-only (no updates/deletes)
    - Only admins can view full audit logs
*/

-- Create lead_labels table
CREATE TABLE IF NOT EXISTS lead_labels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  color text NOT NULL,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(name, company_id)
);

-- Create contact_labels junction table (many-to-many)
CREATE TABLE IF NOT EXISTS contact_labels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  label_id uuid NOT NULL REFERENCES lead_labels(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(contact_id, label_id)
);

-- Create audit_ledger table
CREATE TABLE IF NOT EXISTS audit_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  action text NOT NULL,
  actor_id uuid REFERENCES profiles(id),
  old_values jsonb,
  new_values jsonb,
  metadata jsonb,
  company_id uuid NOT NULL REFERENCES companies(id),
  created_at timestamptz DEFAULT now(),
  reversible boolean DEFAULT false,
  reversed_at timestamptz,
  reversed_by uuid REFERENCES profiles(id)
);

-- Add fields to contacts table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'lead_label'
  ) THEN
    ALTER TABLE contacts ADD COLUMN lead_label text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'ai_chat_notes'
  ) THEN
    ALTER TABLE contacts ADD COLUMN ai_chat_notes text;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE lead_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_ledger ENABLE ROW LEVEL SECURITY;

-- RLS Policies for lead_labels

CREATE POLICY "Users can view their company labels"
  ON lead_labels FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage labels"
  ON lead_labels FOR ALL
  TO authenticated
  USING (
    (auth.jwt()->>'role')::text IN ('super_admin', 'company_admin', 'admin')
    AND company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- RLS Policies for contact_labels

CREATE POLICY "Users can view contact labels"
  ON contact_labels FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM contacts
      WHERE contacts.id = contact_labels.contact_id
      AND contacts.company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage contact labels"
  ON contact_labels FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM contacts
      WHERE contacts.id = contact_labels.contact_id
      AND (
        contacts.assigned_to = auth.uid()
        OR (auth.jwt()->>'role')::text IN ('super_admin', 'company_admin', 'admin')
      )
    )
  );

-- RLS Policies for audit_ledger

CREATE POLICY "Admins can view audit logs"
  ON audit_ledger FOR SELECT
  TO authenticated
  USING (
    (auth.jwt()->>'role')::text IN ('super_admin', 'company_admin', 'admin')
    AND company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "System can insert audit logs"
  ON audit_ledger FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_lead_labels_company ON lead_labels(company_id);
CREATE INDEX IF NOT EXISTS idx_contact_labels_contact ON contact_labels(contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_labels_label ON contact_labels(label_id);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_ledger(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_company ON audit_ledger(company_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_ledger(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_ledger(actor_id);

-- Create function to log contact changes
CREATE OR REPLACE FUNCTION log_contact_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_ledger (
      entity_type,
      entity_id,
      action,
      actor_id,
      new_values,
      company_id,
      reversible
    ) VALUES (
      'contact',
      NEW.id,
      'created',
      auth.uid(),
      to_jsonb(NEW),
      NEW.company_id,
      false
    );
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_ledger (
      entity_type,
      entity_id,
      action,
      actor_id,
      old_values,
      new_values,
      company_id,
      reversible,
      metadata
    ) VALUES (
      'contact',
      NEW.id,
      CASE
        WHEN OLD.assigned_to IS DISTINCT FROM NEW.assigned_to THEN 'assigned'
        WHEN OLD.status IS DISTINCT FROM NEW.status THEN 'status_changed'
        ELSE 'updated'
      END,
      auth.uid(),
      to_jsonb(OLD),
      to_jsonb(NEW),
      NEW.company_id,
      CASE
        WHEN OLD.assigned_to IS DISTINCT FROM NEW.assigned_to THEN true
        WHEN OLD.status IS DISTINCT FROM NEW.status THEN true
        ELSE false
      END,
      jsonb_build_object(
        'changed_fields', (
          SELECT jsonb_object_agg(key, value)
          FROM jsonb_each(to_jsonb(NEW))
          WHERE to_jsonb(OLD) -> key IS DISTINCT FROM to_jsonb(NEW) -> key
        )
      )
    );
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_ledger (
      entity_type,
      entity_id,
      action,
      actor_id,
      old_values,
      company_id,
      reversible
    ) VALUES (
      'contact',
      OLD.id,
      'deleted',
      auth.uid(),
      to_jsonb(OLD),
      OLD.company_id,
      false
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for contact changes
DROP TRIGGER IF EXISTS contact_audit_trigger ON contacts;
CREATE TRIGGER contact_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION log_contact_change();

-- Create function to log note changes
CREATE OR REPLACE FUNCTION log_note_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_ledger (
      entity_type,
      entity_id,
      action,
      actor_id,
      new_values,
      company_id,
      reversible
    ) VALUES (
      'note',
      NEW.id,
      'created',
      auth.uid(),
      to_jsonb(NEW),
      NEW.company_id,
      false
    );
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_ledger (
      entity_type,
      entity_id,
      action,
      actor_id,
      old_values,
      company_id,
      reversible
    ) VALUES (
      'note',
      OLD.id,
      'deleted',
      auth.uid(),
      to_jsonb(OLD),
      OLD.company_id,
      false
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for note changes
DROP TRIGGER IF EXISTS note_audit_trigger ON notes;
CREATE TRIGGER note_audit_trigger
  AFTER INSERT OR DELETE ON notes
  FOR EACH ROW
  EXECUTE FUNCTION log_note_change();
