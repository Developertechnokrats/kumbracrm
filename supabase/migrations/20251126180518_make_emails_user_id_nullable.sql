/*
  # Make emails.user_id nullable for incoming emails
  
  1. Changes
    - Modify `user_id` column in `emails` table to allow NULL values
    - This allows incoming emails from external senders to be stored without a user_id
  
  2. Reasoning
    - Incoming emails from SendGrid don't have an associated system user
    - The sender is tracked via `from_email` and `contact_id` instead
*/

ALTER TABLE emails 
ALTER COLUMN user_id DROP NOT NULL;
