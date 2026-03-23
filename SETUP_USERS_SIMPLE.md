# Create Admin & Broker Accounts - Simple Guide

## 🎯 Quick Setup (3 Steps)

### Step 1: Sign Up Both Users

#### Create Carlito (Admin):
1. Go to `/sign-up`
2. Enter:
   - Full Name: **Carlito**
   - Email: **carlito@kumbracapital.com**
   - Password: (your choice - e.g., Admin2024!)
3. Click "Sign up"

#### Create David Perry (Broker):
1. Go to `/sign-up` (or open in another browser/incognito)
2. Enter:
   - Full Name: **David Perry**
   - Email: **david.perry@kumbracapital.com**
   - Password: (your choice - e.g., Broker2024!)
3. Click "Sign up"

---

### Step 2: Run This SQL

Copy and paste this entire block into your Supabase SQL Editor:

```sql
-- Update Carlito to admin at Kumbra Capital
UPDATE profiles
SET role = 'admin',
    full_name = 'Carlito',
    company_id = 'aa9cbf8a-2d0d-4218-b423-c1318c0f9101'
WHERE email = 'carlito@kumbracapital.com';

-- Update David Perry to broker at Kumbra Capital
UPDATE profiles
SET role = 'broker',
    full_name = 'David Perry',
    company_id = 'aa9cbf8a-2d0d-4218-b423-c1318c0f9101'
WHERE email = 'david.perry@kumbracapital.com';

-- Update JWT claims for Carlito
UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data ||
  jsonb_build_object('company_id', 'aa9cbf8a-2d0d-4218-b423-c1318c0f9101', 'role', 'admin')
WHERE email = 'carlito@kumbracapital.com';

-- Update JWT claims for David Perry
UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data ||
  jsonb_build_object('company_id', 'aa9cbf8a-2d0d-4218-b423-c1318c0f9101', 'role', 'broker')
WHERE email = 'david.perry@kumbracapital.com';
```

---

### Step 3: Test the Accounts

#### Test Carlito (Admin):
1. Go to `/sign-in`
2. Sign in with: carlito@kumbracapital.com
3. Check sidebar - should see **"Admin Panel"** link
4. Click "Admin Panel"
5. You should see 5 tabs:
   - Operations Overview
   - Import Leads
   - Lead Distribution
   - Broker Performance
   - Companies (if super_admin)

#### Test David Perry (Broker):
1. Go to `/sign-in` (in another browser/incognito)
2. Sign in with: david.perry@kumbracapital.com
3. Check sidebar - should NOT see "Admin Panel"
4. Click "Contacts"
5. Should see contact list (empty for now)

---

## ✅ Verify Setup

Run this SQL to check everything is correct:

```sql
SELECT
  p.full_name,
  p.email,
  p.role,
  c.name as company_name
FROM profiles p
LEFT JOIN companies c ON c.id = p.company_id
WHERE p.email IN ('carlito@kumbracapital.com', 'david.perry@kumbracapital.com')
ORDER BY p.role DESC;
```

**Expected Result:**
```
Carlito       | carlito@kumbracapital.com      | admin  | Kumbra Capital
David Perry   | david.perry@kumbracapital.com  | broker | Kumbra Capital
```

---

## 🎬 Demo Workflow

### As Carlito (Admin):
1. Sign in as carlito@kumbracapital.com
2. Click "Admin Panel"
3. Click "Import Leads" tab
4. Create a test CSV file:
   ```csv
   full_name,email,phone1
   Test Lead 1,test1@example.com,+1234567890
   Test Lead 2,test2@example.com,+0987654321
   ```
5. Upload the CSV
6. Click "Import 2 Leads"
7. Go to "Lead Distribution" tab
8. Assign both leads to David Perry
9. Done!

### As David Perry (Broker):
1. Sign in as david.perry@kumbracapital.com
2. Click "Contacts"
3. See 2 leads assigned by Carlito!
4. Click on a lead to see details
5. Add a note
6. Change status
7. Work the lead!

---

## 🔒 Important Notes

- **They MUST sign up through `/sign-up` first** - you can't create auth users via SQL
- **Then run the SQL** to set correct roles and company
- **Both users need to sign out and sign in again** after running SQL for changes to take effect
- **Passwords:** Choose strong passwords for production use

---

## ❓ Troubleshooting

**Problem:** Carlito doesn't see "Admin Panel" link
- **Solution:** Make sure you ran the SQL UPDATE statements
- **Solution:** Have Carlito sign out and sign in again

**Problem:** David Perry sees "Admin Panel" link
- **Solution:** Check his role in database (should be 'broker' not 'admin')
- **Solution:** Re-run the SQL to set role to 'broker'

**Problem:** They belong to different companies
- **Solution:** Both should have company_id = 'aa9cbf8a-2d0d-4218-b423-c1318c0f9101'
- **Solution:** Re-run the SQL UPDATE statements

---

## 🚀 That's It!

Three simple steps:
1. ✅ Sign up both users through `/sign-up`
2. ✅ Run the SQL to set roles and company
3. ✅ Test both accounts

**Now Carlito can import and distribute leads to David Perry!** 🎉
