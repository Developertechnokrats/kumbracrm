/*
  # JWT Custom Claims Function

  This function adds custom claims (role and company_id) to the JWT token
  so that Row-Level Security policies can enforce multi-tenant isolation.

  ## Setup Instructions:

  1. Run this SQL in the Supabase SQL Editor
  2. Go to Supabase Dashboard > Authentication > Hooks
  3. Enable "Custom access token hook"
  4. Set the function to: public.custom_access_token_hook
  5. Save changes

  ## What it does:

  - Fetches the user's profile (role and company_id)
  - Injects these values into the JWT claims
  - RLS policies read auth.jwt()->'role' and auth.jwt()->'company_id'
*/

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  claims jsonb;
  user_role text;
  user_company_id uuid;
BEGIN
  -- Fetch user profile
  SELECT role, company_id INTO user_role, user_company_id
  FROM public.profiles
  WHERE id = (event->>'user_id')::uuid;

  -- Start with existing claims
  claims := event->'claims';

  -- Add role claim if profile exists
  IF user_role IS NOT NULL THEN
    claims := jsonb_set(claims, '{role}', to_jsonb(user_role));
  ELSE
    -- Default role if no profile
    claims := jsonb_set(claims, '{role}', to_jsonb('viewer'));
  END IF;

  -- Add company_id claim if profile exists
  IF user_company_id IS NOT NULL THEN
    claims := jsonb_set(claims, '{company_id}', to_jsonb(user_company_id::text));
  END IF;

  -- Update event with new claims
  event := jsonb_set(event, '{claims}', claims);

  RETURN event;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO postgres;
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO anon;
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO authenticated;
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO service_role;

-- Create a trigger function to auto-create profiles on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- For now, new users need manual company assignment
  -- In production, this would be handled by your signup flow

  -- You could auto-assign to a default company here if needed:
  -- INSERT INTO public.profiles (id, company_id, email, role)
  -- VALUES (
  --   NEW.id,
  --   'default-company-id',
  --   NEW.email,
  --   'broker'
  -- );

  RETURN NEW;
END;
$$;

-- Note: Trigger would be created on auth.users which requires superuser
-- This is typically handled via Supabase Auth webhooks or API

COMMENT ON FUNCTION public.custom_access_token_hook IS 'Adds role and company_id claims to JWT for RLS';
