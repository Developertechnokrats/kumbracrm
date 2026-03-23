/*
  # Add HTML body support to email templates
  
  1. Changes
    - Add html_body column to email_templates table to store full HTML email templates
    - This allows templates to have both plain text (body) and HTML (html_body) versions
  
  2. Notes
    - html_body is optional - templates can be plain text only
    - When html_body is present, it will be used for email sending instead of body
*/

ALTER TABLE email_templates ADD COLUMN IF NOT EXISTS html_body text;