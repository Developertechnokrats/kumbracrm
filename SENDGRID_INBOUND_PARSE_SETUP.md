# SendGrid Inbound Parse Setup Guide

## Overview
This guide will help you configure SendGrid Inbound Parse to route all emails sent to `*@kumbracapital.com` addresses into your HyperCRM inbox, making them visible to all Kumbra Capital admins.

---

## Prerequisites

1. **Domain Access**: You need access to your domain's DNS settings (where kumbracapital.com is hosted)
2. **SendGrid Account**: You must have admin access to your SendGrid account
3. **Webhook Already Deployed**: Your email-webhook edge function is already deployed and ready

---

## Your Webhook URL

Your incoming email webhook is already deployed at:

```
https://yfvqjtlzrmiuhesegziz.supabase.co/functions/v1/email-webhook
```

**Important**: This webhook does NOT require authentication (`verifyJWT: false`) so SendGrid can post to it directly.

---

## Step 1: Add DNS MX Records

You need to add MX records to your domain to tell email servers to send kumbracapital.com emails to SendGrid.

### DNS Records to Add:

1. Log into your DNS provider (GoDaddy, Cloudflare, Route53, etc.)
2. Navigate to DNS settings for `kumbracapital.com`
3. Add the following MX records:

| Type | Host/Name | Value/Points To | Priority | TTL |
|------|-----------|----------------|----------|-----|
| MX | @ (or leave blank) | mx.sendgrid.net | 10 | 3600 |

**Alternative Setup for Subdomain** (if you want to use inbound.kumbracapital.com):

| Type | Host/Name | Value/Points To | Priority | TTL |
|------|-----------|----------------|----------|-----|
| MX | inbound | mx.sendgrid.net | 10 | 3600 |

### Important Notes:
- If you already have MX records (e.g., for Gmail, Outlook), you'll need to decide which takes priority
- The **lower** the priority number, the higher the priority (10 is high priority)
- DNS changes can take 15 minutes to 48 hours to propagate

---

## Step 2: Configure SendGrid Inbound Parse

1. **Log into SendGrid**
   - Go to https://app.sendgrid.com
   - Navigate to **Settings** → **Inbound Parse**

2. **Click "Add Host & URL"**

3. **Fill in the form:**

   **Domain:**
   ```
   kumbracapital.com
   ```

   **Subdomain (optional):**
   ```
   (leave blank for all emails, OR enter "inbound" if using subdomain)
   ```

   **Destination URL:**
   ```
   https://yfvqjtlzrmiuhesegziz.supabase.co/functions/v1/email-webhook
   ```

   **Check these boxes:**
   - ☑ Check incoming emails for spam
   - ☑ POST the raw, full MIME message

4. **Click "Add"**

---

## Step 3: Test the Setup

### Option A: Send a test email

1. From your personal email (Gmail, Outlook, etc.), send an email to:
   ```
   test@kumbracapital.com
   ```

2. Check your HyperCRM admin email inbox at:
   ```
   /admin/email
   ```

3. The email should appear in the inbox within seconds

### Option B: Use SendGrid's Test Feature

1. In SendGrid Inbound Parse settings
2. Click on your configured domain
3. Click "Test Your Integration"
4. SendGrid will send a test email
5. Check your HyperCRM inbox

---

## How It Works

```
┌─────────────────┐
│ Someone sends   │
│ email to:       │
│ any@kumbra      │
│ capital.com     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ DNS MX Record   │
│ routes to       │
│ SendGrid        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ SendGrid        │
│ Inbound Parse   │
│ processes email │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ POST to your    │
│ webhook URL     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Edge Function   │
│ processes and   │
│ stores in DB    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Email appears   │
│ in HyperCRM     │
│ inbox for all   │
│ admins          │
└─────────────────┘
```

---

## What the Webhook Does Automatically

Your `email-webhook` function automatically:

1. **Identifies the company** based on recipient email domain
   - `*@kumbracapital.com` → Kumbra Capital company

2. **Creates or finds the contact** based on sender email
   - If contact doesn't exist, creates one automatically
   - Uses email to create first/last name

3. **Creates or finds email thread** based on subject
   - Groups emails by subject (handles Re: and Fwd:)
   - Links emails to the same conversation

4. **Stores the email** with all details:
   - From/To addresses
   - Subject and body (text + HTML)
   - Thread association
   - Timestamp

5. **Makes email visible** to all Kumbra admins
   - RLS policies allow company admins to see all company emails

---

## Troubleshooting

### Emails not appearing in inbox

1. **Check DNS propagation**
   ```
   Use: https://dnschecker.org
   Search for: MX records for kumbracapital.com
   ```

2. **Check SendGrid Activity Feed**
   - Go to SendGrid → Activity Feed
   - Look for inbound parse events
   - Check for errors

3. **Check webhook logs**
   - Go to Supabase Dashboard
   - Navigate to Edge Functions → email-webhook
   - Click "Logs" to see what's being received

4. **Verify webhook URL is correct**
   ```
   https://yfvqjtlzrmiuhesegziz.supabase.co/functions/v1/email-webhook
   ```

### DNS conflicts

If you already receive emails at kumbracapital.com addresses:
- Consider using a subdomain: `inbound.kumbracapital.com`
- Or adjust MX priority so existing mail server has higher priority
- Or migrate all email handling to SendGrid

---

## Current Configuration Status

✅ **Webhook deployed**: email-webhook edge function is live
✅ **Database ready**: emails, email_threads, email_analytics tables exist
✅ **RLS configured**: Admins can view all company emails
✅ **Webhook URL**: Ready to receive POST requests

❓ **DNS MX Records**: You need to add these (see Step 1)
❓ **SendGrid Inbound Parse**: You need to configure this (see Step 2)

---

## Security Notes

- Webhook has `verifyJWT: false` to allow SendGrid to POST without authentication
- Webhook validates company based on email domain
- All emails stored with proper RLS policies
- Only company admins can view emails

---

## Support

If you encounter issues:

1. Check SendGrid Activity Feed for errors
2. Check Supabase Edge Function logs
3. Verify DNS records are propagated
4. Test with a simple email from your personal account

---

## Summary

**To complete setup:**

1. Add MX record to kumbracapital.com DNS: `mx.sendgrid.net` (priority 10)
2. Configure SendGrid Inbound Parse with webhook URL
3. Test by sending an email to any@kumbracapital.com
4. Check /admin/email inbox

Once configured, all emails sent to *@kumbracapital.com will automatically appear in your HyperCRM inbox for all Kumbra Capital admins to see!
