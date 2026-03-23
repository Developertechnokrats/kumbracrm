/*
  # Add Unassigned Status to Contacts

  1. Changes
    - Drop existing status check constraint
    - Add new check constraint that includes 'Unassigned' as a valid status
    - Update all contacts with no assigned_to to have status 'Unassigned'
  
  2. Status Values
    - Adds 'Unassigned' to the list of valid statuses
    - Unassigned leads should have status 'Unassigned'
    - When assigned to a broker, status can be changed to 'Fresh Lead'
*/

-- Drop existing check constraint
ALTER TABLE contacts DROP CONSTRAINT IF EXISTS contacts_status_check;

-- Add new check constraint with 'Unassigned' included
ALTER TABLE contacts ADD CONSTRAINT contacts_status_check 
  CHECK (status = ANY (ARRAY[
    'Unassigned'::text,
    'Fresh Lead'::text, 
    'Fronted'::text, 
    'Apps In'::text, 
    'KYC In'::text, 
    'Trade Agreed'::text, 
    'Signed Agreement'::text, 
    'Debtor'::text, 
    'Hot Prospect'::text, 
    'Paid Client'::text, 
    'HTR'::text, 
    'Call Backs'::text, 
    'Dead Box'::text
  ]));

-- Update all unassigned contacts to have 'Unassigned' status
UPDATE contacts
SET status = 'Unassigned'
WHERE assigned_to IS NULL;
