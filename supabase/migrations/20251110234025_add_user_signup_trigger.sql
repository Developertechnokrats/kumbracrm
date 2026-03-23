/*
  # Add User Sign-Up Trigger

  1. Purpose
    - Automatically create a company and profile when a new user signs up
    - Set the user's metadata in auth.users for JWT claims

  2. Changes
    - Create a function to handle new user sign-ups
    - Create a trigger that fires on auth.users insert
    - Automatically creates a company for new users
    - Creates a profile linked to the new company
    - Updates user metadata with company_id and role
*/

-- Function to handle new user sign-ups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  new_company_id UUID;
  user_role TEXT;
  user_full_name TEXT;
  user_company_name TEXT;
BEGIN
  -- Extract metadata from raw_user_meta_data
  user_role := COALESCE((NEW.raw_user_meta_data->>'role')::TEXT, 'broker');
  user_full_name := (NEW.raw_user_meta_data->>'full_name')::TEXT;
  user_company_name := COALESCE((NEW.raw_user_meta_data->>'company_name')::TEXT, 'My Company');

  -- Create a new company for this user
  INSERT INTO public.companies (name)
  VALUES (user_company_name)
  RETURNING id INTO new_company_id;

  -- Create the profile
  INSERT INTO public.profiles (id, company_id, full_name, email, role)
  VALUES (
    NEW.id,
    new_company_id,
    user_full_name,
    NEW.email,
    user_role
  );

  -- Update user metadata with company_id and role for JWT claims
  UPDATE auth.users
  SET raw_app_meta_data = raw_app_meta_data || 
    jsonb_build_object('company_id', new_company_id, 'role', user_role)
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$;

-- Create trigger for new user sign-ups
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
