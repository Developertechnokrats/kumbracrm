# Inbound Email System - FIXED AND WORKING

## Problem Summary
Inbound emails sent to `*@kumbracapital.com` addresses were not appearing in the admin inbox despite SendGrid Inbound Parse being configured.

## Root Causes Identified

### 1. Silent Failure in Webhook
The webhook was returning success even when database operations failed, making it impossible to diagnose issues.

### 2. Invalid Contact Status
The webhook was trying to create contacts with `status: 'active'`, but the contacts table has a check constraint requiring specific values:
- Valid statuses: 'Fresh Lead', 'Fronted', 'Apps In', 'KYC In', 'Trade Agreed', 'Signed Agreement', 'Debtor', 'Hot Prospect', 'Paid Client', 'HTR', 'Call Backs', 'Dead Box'

### 3. NOT NULL Constraint on user_id
The `emails.user_id` column was set to NOT NULL, but incoming emails from external senders don't have an associated system user.

## Fixes Applied

### 1. Enhanced Error Handling
Updated the email-webhook edge function to:
- Check for errors after every database operation
- Throw descriptive errors instead of failing silently
- Log detailed information at each step
- Return proper error responses

### 2. Fixed Contact Status
Changed contact creation to use `status: 'Fresh Lead'` instead of `status: 'active'`

### 3. Made user_id Nullable
Applied database migration to allow NULL values in `emails.user_id`:
```sql
ALTER TABLE emails
ALTER COLUMN user_id DROP NOT NULL;
```

## Verification Test

Successfully tested the webhook with a POST request:

**Test Input:**
- From: jane.doe@example.com
- To: daniel.cavanaugh@kumbracapital.com
- Subject: "Inquiry About Investment Opportunities"

**Results:**
✅ Contact created automatically (jane, doe, jane.doe@example.com, status: Fresh Lead)
✅ Email thread created
✅ Email stored with direction='received'
✅ All data properly linked (contact_id, thread_id, company_id)

## How It Works Now

When someone sends an email to any `*@kumbracapital.com` address:

1. **DNS routes to SendGrid** - MX record points to mx.sendgrid.net
2. **SendGrid Inbound Parse** - Processes the email
3. **POST to webhook** - Sends email data to edge function
4. **Edge function processes:**
   - Extracts from/to/subject/body
   - Identifies company (Kumbra Capital) based on domain
   - Creates or finds contact (with status 'Fresh Lead')
   - Creates or finds email thread (groups by subject)
   - Inserts email with direction='received', user_id=NULL
5. **Email appears in inbox** - Visible at `/admin/email` for all Kumbra admins

## Current Setup Status

✅ **Webhook deployed and working** - email-webhook edge function with proper error handling
✅ **Database schema updated** - user_id is now nullable
✅ **Contact status fixed** - Uses valid 'Fresh Lead' status
✅ **RLS policies configured** - Admins can view all company emails
✅ **Inbox UI ready** - Loads all emails (sent + received) for company

## What You Need to Do

### SendGrid Configuration (If Not Already Done)

1. **Add DNS MX Record**
   - Type: MX
   - Host: @ (or your domain)
   - Points to: mx.sendgrid.net
   - Priority: 10

2. **Configure SendGrid Inbound Parse**
   - Go to: https://app.sendgrid.com → Settings → Inbound Parse
   - Domain: kumbracapital.com
   - URL: `https://yfvqjtlzrmiuhesegziz.supabase.co/functions/v1/email-webhook`
   - Check: "Check incoming emails for spam"
   - Check: "POST the raw, full MIME message"

### Testing

Send a test email from your personal account to:
- test@kumbracapital.com
- daniel.cavanaugh@kumbracapital.com
- duncan.moore@kumbracapital.com
- jonathan.bruges@kumbracapital.com
- rachel.stevens@kumbracapital.com
- david.perry@kumbracapital.com

Wait 10-30 seconds, then check `/admin/email` inbox.

## Troubleshooting

If emails still don't appear:

1. **Check SendGrid Activity Feed**
   - Go to SendGrid Dashboard → Activity Feed
   - Look for "inbound parse" events
   - Check for error messages

2. **Check Supabase Logs**
   - Go to Supabase Dashboard → Edge Functions → email-webhook → Logs
   - Look for POST requests and any error messages

3. **Verify DNS**
   - Use https://mxtoolbox.com
   - Search for: kumbracapital.com
   - Should show: mx.sendgrid.net

4. **Test Webhook Directly**
   ```bash
   curl -X POST "https://yfvqjtlzrmiuhesegziz.supabase.co/functions/v1/email-webhook" \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "from=Test <test@example.com>" \
     -d "to=anyone@kumbracapital.com" \
     -d "subject=Test" \
     -d "text=Test body"
   ```

## Database Query to Check

To see received emails:
```sql
SELECT
  id,
  from_email,
  to_email,
  subject,
  direction,
  status,
  received_at
FROM emails
WHERE direction = 'received'
ORDER BY created_at DESC;
```

## Files Modified

1. `supabase/functions/email-webhook/index.ts` - Added error handling, fixed contact status
2. `supabase/migrations/make_emails_user_id_nullable.sql` - Made user_id nullable
3. `TEST_INBOUND_EMAIL.md` - Updated with fix information

## Summary

The inbound email system is now fully functional. All technical issues have been resolved, and the webhook successfully processes incoming emails, creates contacts, and stores everything in the database where it's visible to Kumbra Capital admins in the `/admin/email` inbox.

The only remaining step is ensuring SendGrid Inbound Parse is properly configured with your DNS MX records pointing to SendGrid.
