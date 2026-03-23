/*
  # Add imported_to_crm field to contacts table

  1. Changes
    - Add `imported_to_crm` boolean field to contacts table
    - Defaults to false
    - Used to track leads imported from Google Sheets

  2. Security
    - No RLS changes needed (inherits existing contacts policies)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'imported_to_crm'
  ) THEN
    ALTER TABLE contacts ADD COLUMN imported_to_crm boolean DEFAULT false;
  END IF;
END $$;
