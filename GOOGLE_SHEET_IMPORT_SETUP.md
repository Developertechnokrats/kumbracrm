# Google Sheet Import Setup Guide

This guide explains how to set up the automated import of IPO leads from a Google Sheet into your Kumbra Capital CRM.

## Overview

The system allows Google Sheets to automatically import new leads into your CRM with:
- Automatic duplicate detection (by email or phone)
- Mapping of all lead fields to appropriate CRM fields
- Creation of detailed notes with questionnaire responses
- Unassigned status so admins can distribute leads
- Tracking of which rows have been imported

## API Endpoint

The import API is available at:
```
POST https://your-domain.com/api/google-sheet/import-lead
```

**Authentication:** Requires a secret header
```
x-google-sheet-secret: kumbra-ipo-leads-2025-secure
```

## Field Mappings

### Direct Mappings (to existing CRM fields)

| Google Sheet Column | CRM Field | Notes |
|---------------------|-----------|-------|
| Submitted At | `created_at` | Parsed as timestamp |
| Campaign | `lead_source` | e.g., "IPO Insider Registration" |
| First Name | `first_name` | Required |
| Last Name | `last_name` | Required |
| Phone | `phone1` | Used for duplicate checking |
| Email | `email` | Required, used for duplicate checking |
| Country | `location` | Stored as text |
| What is your occupation | `job_title` | Direct mapping |
| What is your age group | `age` | First number extracted (e.g., "35-44" → 35) |
| What approximate investment budget | `trading_range` | e.g., "Between €10,000 - €25,000" |
| Investment readiness | `readiness` | New field for IPO leads |

### Additional Fields Set

| Field | Value |
|-------|-------|
| `status` | "Unassigned" |
| `assigned_to` | NULL (no owner) |
| `imported_to_crm` | true |
| `company_id` | Kumbra Capital ID (auto-set) |

### Mapped to Notes

The following fields are stored in a structured note attached to the lead:
- Submitted At
- Campaign
- Investment Budget
- Investment Readiness
- Investment Term Preference (col 12)
- Risk Tolerance (col 13)
- Have you ever invested before? (col 14)
- Previous Investments (col 15)
- Source Row Identifier

## Google Apps Script Setup

### Step 1: Open Script Editor

1. Open your Google Sheet with IPO leads
2. Click **Extensions** > **Apps Script**
3. Delete any existing code in the editor

### Step 2: Add the Script

1. Copy the entire contents of `google-sheet-import-script.gs` into the editor
2. Update the `CONFIG` section at the top:

```javascript
const CONFIG = {
  API_ENDPOINT: 'https://your-actual-domain.com/api/google-sheet/import-lead',
  API_SECRET: 'kumbra-ipo-leads-2025-secure',
  SHEET_NAME: 'Sheet1',  // Update if your sheet has a different name
  // ... column indices are already configured
};
```

### Step 3: Save and Authorize

1. Click the **Save** icon or press Ctrl+S (Cmd+S on Mac)
2. Name your project (e.g., "CRM Import Script")
3. Reload your Google Sheet

### Step 4: Test the Connection

1. You should see a new menu item **"CRM Import"** in your sheet's menu bar
2. Click **CRM Import** > **Test Connection**
3. If prompted, authorize the script to run (first time only)
4. You should see a success message if everything is configured correctly

## Using the Import Script

### Import All New Leads

1. Click **CRM Import** > **Import New Leads**
2. The script will:
   - Process all rows where column 16 (ImportedToCRM) is blank
   - Check for duplicates by email or phone
   - Create new leads or note duplicates
   - Mark column 16 with "Yes" for processed rows
3. You'll see a summary showing:
   - Number of leads imported
   - Number skipped (already had "Yes" in column 16)
   - Any errors encountered

### Import a Single Row

1. Click on any cell in the row you want to import
2. Click **CRM Import** > **Import Selected Row**
3. The script will import just that one row
4. Useful for testing or re-importing specific leads

## Column 16: ImportedToCRM Flag

- This column tracks which rows have been imported
- Starts blank for new leads
- Automatically filled with "Yes" after successful import
- Prevents duplicate imports when running the batch import multiple times

## Duplicate Handling

The system checks for duplicates using:
- Email (case-insensitive match)
- Phone number (exact match after trimming spaces)

If a duplicate is found:
- ✅ No new lead is created
- ✅ A note is added to the existing lead with the duplicate import info
- ✅ Column 16 is marked "Yes" so the row isn't processed again
- ✅ The API returns status "duplicate" with the existing lead ID

## Viewing Imported Leads in CRM

### Unassigned Leads View

1. Log into the CRM at https://your-domain.com
2. Navigate to **Contacts**
3. Look for the **"Unassigned"** pipeline stage (gray badge)
4. All imported leads will appear here with status "Unassigned"

### Lead Information Displayed

Each imported lead shows:
- Full name
- Email
- Phone
- Location (country)
- Trading range (investment budget)
- Lead source (campaign name)
- Created date (from Submitted At)
- Readiness level

### Assigning Leads

Admins can:
1. Click on any unassigned lead
2. Change the status from "Unassigned" to any other pipeline stage
3. Assign to a specific broker using the "Assigned To" field
4. View the detailed import notes in the Notes section

## API Response Formats

### Successful Creation
```json
{
  "status": "created",
  "leadId": "uuid-here"
}
```

### Duplicate Detected
```json
{
  "status": "duplicate",
  "leadId": "existing-uuid-here"
}
```

### Error
```json
{
  "status": "error",
  "message": "Description of what went wrong"
}
```

## Security Notes

- The API secret `kumbra-ipo-leads-2025-secure` is stored in your `.env` file
- Only requests with the correct secret header are processed
- The secret should be kept confidential
- Consider rotating the secret periodically for enhanced security

## Troubleshooting

### "Unauthorized" Error
- Check that `API_SECRET` in the script matches the value in your `.env` file
- Ensure the secret doesn't have extra spaces or quotes

### "Sheet not found" Error
- Update `SHEET_NAME` in the script config to match your actual sheet name
- Sheet names are case-sensitive

### Leads Not Appearing in CRM
- Check that you're logged into the correct company (Kumbra Capital)
- Verify the "Unassigned" filter is visible in the Contacts view
- Check browser console for any errors

### Import Keeps Failing
1. Try "Test Connection" first to verify basic connectivity
2. Try "Import Selected Row" on a single row to see detailed error
3. Check that required fields (email, first name, last name) are filled
4. View the CRM server logs for detailed error messages

## Support

For technical issues:
1. Check the Google Apps Script logs (View > Logs in the script editor)
2. Check browser console for frontend errors
3. Check server logs for API errors
4. Verify all environment variables are set correctly

## Next Steps

After setup is complete:
1. Test with a few sample rows first
2. Verify leads appear in the Unassigned view
3. Check that notes contain all the questionnaire responses
4. Run full import once confirmed working
5. Set up a regular schedule (daily/weekly) to process new leads
