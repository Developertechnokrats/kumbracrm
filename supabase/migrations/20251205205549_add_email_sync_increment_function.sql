/*
  # Email Sync Counter Functions

  1. Functions
    - `increment_email_sync_count` - Atomically increments email counts
    
  2. Purpose
    - Ensures accurate counting of sent/received emails
    - Handles concurrent updates safely
*/

CREATE OR REPLACE FUNCTION increment_email_sync_count(
  p_company_id uuid,
  p_sync_type text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO email_sync_status (
    company_id,
    sync_type,
    last_sync_at,
    last_success_at,
    total_received,
    total_sent,
    updated_at
  )
  VALUES (
    p_company_id,
    p_sync_type,
    now(),
    now(),
    CASE WHEN p_sync_type = 'inbound' THEN 1 ELSE 0 END,
    CASE WHEN p_sync_type = 'outbound' THEN 1 ELSE 0 END,
    now()
  )
  ON CONFLICT (company_id, sync_type)
  DO UPDATE SET
    last_sync_at = now(),
    last_success_at = now(),
    total_received = email_sync_status.total_received + CASE WHEN p_sync_type = 'inbound' THEN 1 ELSE 0 END,
    total_sent = email_sync_status.total_sent + CASE WHEN p_sync_type = 'outbound' THEN 1 ELSE 0 END,
    updated_at = now();
END;
$$;