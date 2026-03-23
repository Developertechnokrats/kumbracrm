# Complete Setup Instructions for 4 New Users

## Understanding the System Structure

**HyperCRM** is a multi-tenant CRM platform. You have:

- **1 Super Admin Account** (ad@admin.com) - manages all client companies
- **3 Client Companies** - Sentra HQ, Kumbra Capital, Quotient Capital
- Each company has their own admins and brokers who can only see their own data

---

## Step 1: Create the 4 New Users

Run this SQL in **Supabase SQL Editor** (with Service Role Key permissions):

```bash
-- In Supabase Dashboard:
-- 1. Go to SQL Editor
-- 2. Create New Query
-- 3. Paste the contents of CREATE_4_USERS.sql
-- 4. Run the query
```

**File: `CREATE_4_USERS.sql`**

This will create:
1. **tom.mccallister@quotient-capital.com** - Broker at Quotient Capital
2. **ad@quotient-capital.com** - Admin at Quotient Capital
3. **clear@quotient-capital.com** - Admin at Quotient Capital
4. **ad@kumbracapital.com** - Admin at Kumbra Capital

### Credentials:
- **Tom McCallister**: `TMwaesrd77@@`
- **AD - Quotient Admin**: `ADwaesrd77@@`
- **Clear Cut**: `CC422025!!`
- **AD - Kumbra Admin**: `ADwaesrd77@@`

---

## Step 2: Populate Dummy Data

After users are created, run this SQL:

```bash
-- In Supabase SQL Editor:
-- 1. Create New Query
-- 2. Paste the contents of POPULATE_DUMMY_DATA.sql
-- 3. Run the query
```

**File: `POPULATE_DUMMY_DATA.sql`**

This will create:
- **5 dummy contacts** for Tom McCallister (Quotient Capital)
- **2 dummy contacts each** for Daniel, Jennifer, and Michael (Kumbra Capital)
- Each contact has realistic data: names, companies, deal values, status, notes

---

## Step 3: Sign Out and Back In

**IMPORTANT:** Sign out of your super admin account (ad@admin.com) and sign back in.

This refreshes your JWT token so you can see all companies.

---

## Step 4: Verify Everything Works

### As Super Admin (ad@admin.com):

1. Go to `/admin` → **Companies** tab
2. You should see **3 companies**:
   - ✅ **Sentra HQ** (0 users) - Enterprise £499/mo
   - ✅ **Kumbra Capital** (6 users) - Professional £299/mo
   - ✅ **Quotient Capital** (3 users) - Professional £299/mo

3. You should **NOT** see HyperCRM (that's your system admin company, hidden from the list)

4. Click on **Kumbra Capital**:
   - Should show 2 admins + 3 brokers
   - Should show total pipeline value from their contacts

5. Click on **Quotient Capital**:
   - Should show 2 admins + 1 broker (Tom)
   - Should show Tom's pipeline value

---

### Test Individual User Logins:

#### Test 1: Tom McCallister (Broker)
- **Email**: tom.mccallister@quotient-capital.com
- **Password**: TMwaesrd77@@
- **Expected**:
  - Go to `/contacts` → should see 5 contacts (his leads)
  - Should see Kanban board with leads in different stages
  - Should NOT see admin features
  - Should NOT see other companies' data

#### Test 2: AD - Quotient Admin
- **Email**: ad@quotient-capital.com
- **Password**: ADwaesrd77@@
- **Expected**:
  - Go to `/admin` → should see Quotient Capital admin panel
  - Should see 3 users (Tom, yourself, Clear Cut)
  - Should see Tom's contacts and pipeline
  - Should NOT see Kumbra Capital data
  - Should NOT see Sentra HQ data

#### Test 3: Clear Cut (Admin)
- **Email**: clear@quotient-capital.com
- **Password**: CC422025!!
- **Expected**:
  - Same as AD - Quotient Admin
  - Can see all Quotient Capital data
  - Cannot see other companies

#### Test 4: AD - Kumbra Admin
- **Email**: ad@kumbracapital.com
- **Password**: ADwaesrd77@@
- **Expected**:
  - Go to `/admin` → should see Kumbra Capital admin panel
  - Should see 6 users (2 admins + 3 brokers + 1 new admin)
  - Should see all Kumbra brokers' contacts
  - Should NOT see Quotient Capital data
  - Should NOT see Sentra HQ data

---

## Current System State After Setup

### HyperCRM (System Admin - HIDDEN)
**Not visible in Companies list**
- ad@admin.com (AD Super) - Super Admin

### Sentra HQ (Client Company)
**Enterprise £499/mo | Products: Bonds, Managed Funds**
- 0 users (available for testing)

### Kumbra Capital (Client Company)
**Professional £299/mo | Products: IPOs**
- **6 Total Users**
- **Admins (3)**:
  - admin@kumbracapital.com (Sarah Johnson)
  - carlito@kumbracapital.com (Carlito)
  - ad@kumbracapital.com (AD - Kumbra Admin) ← NEW
- **Brokers (3)**:
  - daniel.cavanaugh@kumbracapital.com (Daniel Cavanaugh) - 2 contacts
  - jennifer.williams@kumbracapital.com (Jennifer Williams) - 2 contacts
  - michael.chen@kumbracapital.com (Michael Chen) - 2 contacts

### Quotient Capital (Client Company)
**Professional £299/mo | Products: Bonds, Managed Funds, Gold Contracts**
- **3 Total Users** ← ALL NEW
- **Admins (2)**:
  - ad@quotient-capital.com (AD - Quotient Admin)
  - clear@quotient-capital.com (Clear Cut)
- **Brokers (1)**:
  - tom.mccallister@quotient-capital.com (Tom McCallister) - 5 contacts

---

## Quick Reference: Company IDs

```
HyperCRM:        99999999-9999-9999-9999-999999999999
Sentra HQ:       00000000-0000-0000-0000-000000000000
Kumbra Capital:  aa9cbf8a-2d0d-4218-b423-c1318c0f9101
Quotient Capital: bb9cbf8a-3d0d-5218-c423-d1318c0f9202
```

---

## Troubleshooting

### "I don't see all 3 companies as super admin"
- Sign out and back in (refreshes JWT token)
- Check that you're using ad@admin.com
- Verify HyperCRM is hidden (should NOT appear in list)

### "I can see other companies' data as a company admin"
- This is a bug - company admins should only see their own company
- Check the RLS policies on contacts/profiles tables
- Verify JWT metadata has correct company_id

### "Contacts aren't showing up"
- Make sure you ran POPULATE_DUMMY_DATA.sql
- Check that broker_id matches the profile.id
- Verify company_id is correct

---

## Files Created

1. **CREATE_4_USERS.sql** - Creates all 4 user accounts
2. **POPULATE_DUMMY_DATA.sql** - Adds dummy contacts for brokers
3. **SETUP_COMPLETE_INSTRUCTIONS.md** - This file

---

## Next Steps After Verification

Once you've verified everything works:

1. ✅ Super admin can see all 3 client companies
2. ✅ Company admins can only see their own company's data
3. ✅ Brokers can only see their own contacts
4. ✅ Dummy data is populated and visible

You're ready to:
- Add more brokers to companies
- Import real contact data
- Customize products for each company
- Set up appointments and notes
- Test the full CRM workflow

---

**Your multi-tenant CRM is now fully set up! 🚀**
