# Test Inbound Email Setup

## Current Status - FIXED AND WORKING!

**Database Check Results:**
- ✅ Webhook is now working correctly
- ✅ Test email successfully received and stored
- ✅ Contact automatically created from sender email
- ✅ Email thread created automatically
- ✅ Kumbra Capital company found (ID: aa9cbf8a-2d0d-4218-b423-c1318c0f9101)
- ✅ RLS policies configured correctly for admins to see all emails
- ✅ Email webhook deployed with proper error handling

**What was fixed:**
1. Added comprehensive error handling to webhook
2. Changed contact status from 'active' to 'Fresh Lead' (valid status value)
3. Made emails.user_id nullable for incoming emails without system users

**Conclusion:** The system is fully functional and ready to receive incoming emails from SendGrid!

---

## How to Test

### Method 1: Send Test Email from Personal Account

1. From your Gmail, Outlook, or any email account, send an email to:
   ```
   test@kumbracapital.com
   ```
   OR
   ```
   daniel.cavanaugh@kumbracapital.com
   ```
   OR
   ```
   duncan.moore@kumbracapital.com
   ```

2. Subject: `Test Inbound Email Setup`

3. Body: `This is a test to verify the inbound parse is working correctly.`

4. Wait 10-30 seconds

5. Check your inbox at `/admin/email` page

---

### Method 2: Use SendGrid Test Feature

1. Log into SendGrid at https://app.sendgrid.com
2. Go to **Settings** → **Inbound Parse**
3. Find your `kumbracapital.com` configuration
4. Click **Test Your Integration**
5. SendGrid will send a test email
6. Check your `/admin/email` inbox

---

## Troubleshooting Steps

### If you don't see emails after sending:

#### 1. Check SendGrid Activity Feed
   - Go to SendGrid Dashboard
   - Navigate to **Activity** → **Activity Feed**
   - Filter by "Inbound Parse"
   - Look for your test email
   - Check if there are any errors

#### 2. Verify DNS MX Records
   ```
   Use online tool: https://mxtoolbox.com
   Enter: kumbracapital.com
   Expected result: mx.sendgrid.net with priority 10
   ```

#### 3. Check Supabase Edge Function Logs
   - Go to Supabase Dashboard
   - Navigate to **Edge Functions**
   - Click on **email-webhook**
   - Click **Logs** tab
   - Look for recent POST requests
   - Check for any error messages

#### 4. Verify SendGrid Inbound Parse Configuration
   - Domain: `kumbracapital.com`
   - Webhook URL: `https://yfvqjtlzrmiuhesegziz.supabase.co/functions/v1/email-webhook`
   - Verify JWT: Should be **OFF** / **Unchecked**
   - Status: Should show **Active**

#### 5. Check Database Query
   Run this in Supabase SQL Editor:
   ```sql
   SELECT
     id,
     from_email,
     to_email,
     subject,
     direction,
     status,
     created_at
   FROM emails
   WHERE direction = 'received'
   ORDER BY created_at DESC
   LIMIT 5;
   ```

---

## What Should Happen

When an email is sent to `*@kumbracapital.com`:

1. **DNS routes email** → SendGrid's mail server receives it
2. **SendGrid Inbound Parse** → Processes the email
3. **SendGrid POSTs to webhook** → Sends email data to your edge function
4. **Edge Function processes:**
   - Extracts from/to/subject/body
   - Identifies company (Kumbra Capital)
   - Creates or finds contact based on sender email
   - Creates or finds email thread based on subject
   - Inserts email record with `direction: 'received'`
5. **Email appears in inbox** → Visible at `/admin/email` for all admins

---

## Expected Webhook Payload from SendGrid

SendGrid will POST form-data that looks like:

```
from: "John Doe <john@example.com>"
to: "test@kumbracapital.com"
subject: "Test Email"
text: "This is the plain text body"
html: "<p>This is the HTML body</p>"
message-id: "<unique-message-id@example.com>"
headers: "... email headers ..."
envelope: '{"to":["test@kumbracapital.com"],"from":"john@example.com"}'
```

Your webhook will:
1. Extract email addresses
2. Find company_id for Kumbra Capital
3. Create/find contact for john@example.com
4. Create/find thread for subject
5. Insert email with direction='received'

---

## Quick Verification Checklist

- [ ] DNS MX record pointing to mx.sendgrid.net
- [ ] SendGrid Inbound Parse configured with correct domain
- [ ] SendGrid Inbound Parse webhook URL is correct
- [ ] SendGrid shows the configuration as "Active"
- [ ] Test email sent from external account
- [ ] Waited at least 30 seconds for processing
- [ ] Checked SendGrid Activity Feed for the email
- [ ] Checked Supabase Edge Function logs
- [ ] Checked `/admin/email` inbox page
- [ ] Ran SQL query to check for received emails

---

## Need Help?

If emails still aren't showing up after checking all the above:

1. **Share SendGrid Activity Feed logs** - Look for any error messages
2. **Share Supabase Edge Function logs** - Check if webhook is receiving POSTs
3. **Verify webhook URL** - Make sure it's exactly: `https://yfvqjtlzrmiuhesegziz.supabase.co/functions/v1/email-webhook`
4. **Check DNS propagation** - MX records can take time to propagate

---

## Success Indicators

You'll know it's working when:
- ✅ Test email sent to *@kumbracapital.com
- ✅ SendGrid Activity Feed shows "inbound parse webhook posted"
- ✅ Supabase logs show successful POST to email-webhook
- ✅ SQL query returns email with direction='received'
- ✅ Email visible in `/admin/email` inbox
- ✅ All Kumbra admins can see the email
