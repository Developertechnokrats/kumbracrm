/*
  # Create Products System for Pre-IPO Investments

  1. New Tables
    - `products` - Pre-IPO investment opportunities
    - `product_tranches` - Different pricing tiers for products

  2. Company Table Updates
    - Add company contact details and logo

  3. Security
    - RLS policies for company-scoped access
*/

-- Update companies table with contact details
ALTER TABLE companies ADD COLUMN IF NOT EXISTS logo_url text;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS website text;

-- Create products table
CREATE TABLE products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  category text DEFAULT 'Pre-IPO',
  price_per_share numeric(12,2) NOT NULL,
  currency text DEFAULT 'USD',
  expected_listing_date date,
  profit_expectation text,
  minimum_investment numeric(12,2),
  script text,
  is_active boolean DEFAULT true,
  image_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_products_company ON products(company_id);
CREATE INDEX idx_products_active ON products(is_active);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members can view products"
  ON products FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage products"
  ON products FOR ALL
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- Create product tranches table
CREATE TABLE product_tranches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  tranche_name text NOT NULL,
  min_shares integer NOT NULL,
  max_shares integer NOT NULL,
  price_per_share numeric(12,2) NOT NULL,
  available_shares integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_tranches_product ON product_tranches(product_id);

ALTER TABLE product_tranches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members can view tranches"
  ON product_tranches FOR SELECT
  TO authenticated
  USING (
    product_id IN (
      SELECT p.id FROM products p
      JOIN profiles pr ON pr.company_id = p.company_id
      WHERE pr.id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage tranches"
  ON product_tranches FOR ALL
  TO authenticated
  USING (
    product_id IN (
      SELECT p.id FROM products p
      JOIN profiles pr ON pr.company_id = p.company_id
      WHERE pr.id = auth.uid() 
      AND pr.role IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    product_id IN (
      SELECT p.id FROM products p
      JOIN profiles pr ON pr.company_id = p.company_id
      WHERE pr.id = auth.uid() 
      AND pr.role IN ('admin', 'super_admin')
    )
  );

-- Update Kumbra Capital with contact details
UPDATE companies
SET 
  logo_url = 'https://placehold.co/200x60/0066CC/white?text=Kumbra+Capital',
  address = '123 Financial District, London EC2N 2DB, United Kingdom',
  phone = '+44 20 7123 4567',
  email = 'info@kumbracapital.com',
  website = 'www.kumbracapital.com'
WHERE name = 'Kumbra Capital';
