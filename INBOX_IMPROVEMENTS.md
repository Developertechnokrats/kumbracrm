# Email Inbox Improvements

## Changes Made

### 1. Added Inbox Filtering Buttons

Added three filter buttons at the top of the email inbox:

- **All Emails** - Shows all emails for the company
- **Daniel Cavanaugh** - Filters to show only emails sent to daniel.cavanaugh@kumbracapital.com or d.cavanaugh@kumbracapital.com
- **David Perry** - Filters to show only emails sent to david.perry@kumbracapital.com

The selected filter button is highlighted, making it clear which inbox view is active.

### 2. Enhanced Email Content Debugging

Updated the email webhook with comprehensive logging to diagnose why email body content is empty:

- Logs all fields received from SendGrid with their lengths
- Shows preview of each field's content
- Attempts to extract body content from multiple possible field names:
  - Text: `text`, `body`, `text/plain`, `plain`, `body-plain`, `text_body`
  - HTML: `html`, `text/html`, `html_content`, `body-html`, `html_body`

## How to Use the Inbox Filters

1. Go to `/admin/email` inbox page
2. At the top, you'll see three buttons: "All Emails", "Daniel Cavanaugh", "David Perry"
3. Click any button to filter the emails
4. The filtered view applies to all tabs (Inbox, Sent, Drafts)

## Email Content Issue - Next Steps

The email body content is still coming through empty from SendGrid. To diagnose this:

### Check SendGrid Logs

After sending a test email, check the Supabase Edge Function logs:

1. Go to Supabase Dashboard
2. Navigate to **Edge Functions** → **email-webhook** → **Logs**
3. Look for the section that says "===== SENDGRID WEBHOOK DATA ====="
4. This will show all the fields SendGrid is actually sending
5. Look for the "=== EMAIL CONTENT EXTRACTION ===" section to see which fields have content

### Check SendGrid Inbound Parse Settings

The issue might be in how SendGrid is configured. Verify:

1. Go to SendGrid Dashboard → Settings → Inbound Parse
2. Find your `kumbracapital.com` configuration
3. Check if **"POST the raw, full MIME message"** is enabled
   - If UNCHECKED: SendGrid parses the email and sends fields like `text` and `html`
   - If CHECKED: SendGrid sends the raw MIME message (which we need to parse differently)

### Possible Solutions

**If SendGrid isn't parsing the email:**
- Make sure "Check incoming emails for spam" is checked
- Make sure the webhook URL is correct
- Verify POST format isn't set to raw MIME

**If emails are replies (Re:):**
- Gmail and other clients may send replies in different formats
- The content might be in quoted-printable encoding
- We may need to parse the MIME structure differently

**If content is in a different field:**
- The logs will show us exactly which fields contain data
- We can then update the webhook to extract from the correct field

## Current Implementation Details

### Inbox Filter Logic

```typescript
// In loadEmails function:
if (selectedInbox === 'daniel') {
  query = query.or('to_email.cs.{"daniel.cavanaugh@kumbracapital.com"},to_email.cs.{"d.cavanaugh@kumbracapital.com"}')
} else if (selectedInbox === 'david') {
  query = query.contains('to_email', ['david.perry@kumbracapital.com'])
}
// If 'all', no filter is applied
```

### Email Content Extraction

```typescript
const bodyText = data.text || dataAny.body || dataAny['text/plain'] || dataAny.plain || dataAny['body-plain'] || dataAny.text_body || '';
const bodyHtml = data.html || dataAny['text/html'] || dataAny.html_content || dataAny['body-html'] || dataAny.html_body || '';
```

## Testing

### Test the Inbox Filters
1. Login as an admin
2. Go to `/admin/email`
3. Click "Daniel Cavanaugh" button
4. You should only see emails addressed to daniel.cavanaugh@ or d.cavanaugh@
5. Click "David Perry"
6. You should only see emails addressed to david.perry@
7. Click "All Emails"
8. You should see all company emails

### Test Email Content
1. Send a new test email to any @kumbracapital.com address
2. Include substantial body content
3. Check Supabase Edge Function logs immediately after sending
4. Look for what fields SendGrid sent
5. Share the log output so we can fix the extraction logic

## Files Modified

1. `/tmp/cc-agent/59991932/project/app/(hq)/admin/email/page.tsx`
   - Added `selectedInbox` state
   - Added useEffect to reload emails when filter changes
   - Updated `loadEmails()` to filter by selected inbox
   - Added inbox filter buttons UI

2. `/tmp/cc-agent/59991932/project/supabase/functions/email-webhook/index.ts`
   - Added comprehensive logging of all SendGrid fields
   - Added multiple fallback field names for body content
   - Added detailed content extraction logging

## Summary

The inbox now has clear filtering options to help admins quickly find relevant emails. The email content extraction has been enhanced with better logging to help us diagnose why body content is empty. Once you send a test email and share the logs, we can fix the content extraction logic to properly read the email body from whatever field SendGrid is actually using.
