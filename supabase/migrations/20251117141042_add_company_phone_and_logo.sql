/*
  # Add Company Phone and Enhanced Fields

  1. Changes
    - Add phone column to companies table
    - Ensure logo_url column exists
    - Add indexes for better performance

  2. Notes
    - These fields are needed for the super admin company management view
*/

-- Add phone column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'phone'
  ) THEN
    ALTER TABLE companies ADD COLUMN phone TEXT;
  END IF;
END $$;

-- Ensure logo_url exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'logo_url'
  ) THEN
    ALTER TABLE companies ADD COLUMN logo_url TEXT;
  END IF;
END $$;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_companies_subscription_level ON companies(subscription_level);
CREATE INDEX IF NOT EXISTS idx_profiles_company_role ON profiles(company_id, role);
