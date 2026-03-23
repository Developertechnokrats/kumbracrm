# Setup Instructions for Kumbra Capital IPO Leads Import

## Your Google Sheet
https://docs.google.com/spreadsheets/d/1Wi8Kw3Om2DygRwFYYF9wBDgfPf4XI9OpDfczzbd89BU/edit?gid=0#gid=0

## Steps to Connect Your Google Sheet

### Step 1: Add ImportedToCRM Column
1. Open your Google Sheet (link above)
2. Go to the "IPO Insider Forms" tab
3. In **column P (column 16)**, add a header: `ImportedToCRM`
4. Leave all the cells below it blank (the script will fill them automatically)

### Step 2: Install the Apps Script
1. In your Google Sheet, click **Extensions** → **Apps Script**
2. Delete any code that's already there
3. Open the file `google-sheet-import-script.gs` from your project
4. Copy the **entire file** (it's already configured with your domain)
5. Paste it into the Apps Script editor
6. Click the **Save** icon (💾)
7. Name it "Kumbra CRM Import" when prompted
8. Close the Apps Script tab

### Step 3: Test the Connection
1. **Refresh your Google Sheet page** (reload the browser)
2. You should see a new menu: **CRM Import** (next to Help)
3. Click **CRM Import** → **Test Connection**
4. Google will ask you to authorize (first time only):
   - Click "Review Permissions"
   - Choose your Google account
   - Click "Advanced" → "Go to Kumbra CRM Import (unsafe)"
   - Click "Allow"
5. You should see: **"Connection Success!"**

### Step 4: Import Your Leads
1. Click **CRM Import** → **Import New Leads**
2. The script will:
   - Process every row where column P (ImportedToCRM) is blank
   - Create the lead in Kumbra Capital CRM
   - Mark column P with "Yes" when done
3. Watch the progress in column P as rows get marked "Yes"
4. You'll see a summary at the end showing how many were imported

### Step 5: View in Your CRM
1. Go to https://crmadhdd.netlify.app/
2. Log in with your Kumbra Capital admin account
3. Click **Contacts** in the sidebar
4. Look for the **"Unassigned"** stage (gray badge) at the start of the pipeline
5. All your imported IPO leads will be there!

## Important Notes

✅ **Automatic Protection**: The system will NOT create duplicates. If an email or phone already exists in Kumbra Capital, it skips that row and just adds a note.

✅ **Company Locked**: All leads go ONLY to Kumbra Capital (company ID: aa9cbf8a-2d0d-4218-b423-c1318c0f9101). They won't appear in any other company's CRM.

✅ **Unassigned Status**: All imported leads start as "Unassigned" with no broker assigned, so admins can distribute them.

✅ **All Data Preserved**: Everything from the Google Sheet questionnaire is saved in the lead's notes.

## Quick Reference

**Import All New Rows**: CRM Import → Import New Leads
**Import Just One Row**: Select the row, then CRM Import → Import Selected Row
**Test Connection**: CRM Import → Test Connection

## Troubleshooting

**No "CRM Import" menu?**
→ Refresh your Google Sheet page

**"Unauthorized" error?**
→ The secret key doesn't match. Check with your developer.

**Leads not showing in CRM?**
→ Make sure you're logged into Kumbra Capital (not another company)
→ Look in the "Unassigned" stage

**Need to re-import a row?**
→ Clear the "Yes" from column P, then import again
