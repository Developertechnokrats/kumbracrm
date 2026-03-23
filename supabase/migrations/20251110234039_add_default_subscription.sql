/*
  # Add Default Subscription for New Companies

  1. Purpose
    - Automatically create a trial subscription when a company is created
    - Ensures new users have access to features

  2. Changes
    - Modifies handle_new_user function to create a default trial subscription
*/

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
  starter_plan_id UUID;
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

  -- Get the Starter plan ID
  SELECT id INTO starter_plan_id
  FROM public.plans
  WHERE name = 'Starter'
  LIMIT 1;

  -- Create a trial subscription for the new company
  IF starter_plan_id IS NOT NULL THEN
    INSERT INTO public.company_subscriptions (company_id, plan_id, status, renews_at)
    VALUES (
      new_company_id,
      starter_plan_id,
      'trial',
      NOW() + INTERVAL '30 days'
    );
  END IF;

  -- Update user metadata with company_id and role for JWT claims
  UPDATE auth.users
  SET raw_app_meta_data = raw_app_meta_data || 
    jsonb_build_object('company_id', new_company_id, 'role', user_role)
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$;
