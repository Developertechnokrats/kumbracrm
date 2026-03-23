# Setup New Users for Quotient and Kumbra

## Step 1: Sign Up These Accounts

Go to `/sign-up` and create these 4 new accounts:

### Quotient Capital Users

1. **Tom McCallister** (Broker)
   - Email: `tom.mccallister@quotient-capital.com`
   - Full Name: Tom McCallister
   - Password: (your choice)

2. **Ad (You)** (Admin)
   - Email: `ad@quotient-capital.com`
   - Full Name: (your name)
   - Password: (your choice)

3. **Mr Clear Cut** (Admin)
   - Email: `clear@quotient-capital.com`
   - Full Name: Mr Clear Cut
   - Password: (your choice)

### Kumbra Capital Users

4. **Ad (You)** (Admin)
   - Email: `ad@kumbracapital.com`
   - Full Name: (your name)
   - Password: (your choice)

---

## Step 2: Run This SQL After Sign-Up

After all 4 accounts are created, run this SQL in Supabase SQL Editor:

```sql
-- ============================================================================
-- QUOTIENT CAPITAL USERS
-- ============================================================================

-- Tom McCallister (Broker)
UPDATE profiles
SET role = 'broker',
    full_name = 'Tom McCallister',
    company_id = 'bb9cbf8a-3d0d-5218-c423-d1318c0f9202'
WHERE email = 'tom.mccallister@quotient-capital.com';

UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data ||
  jsonb_build_object('company_id', 'bb9cbf8a-3d0d-5218-c423-d1318c0f9202', 'role', 'broker')
WHERE email = 'tom.mccallister@quotient-capital.com';

-- Ad @ Quotient (Admin)
UPDATE profiles
SET role = 'admin',
    company_id = 'bb9cbf8a-3d0d-5218-c423-d1318c0f9202'
WHERE email = 'ad@quotient-capital.com';

UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data ||
  jsonb_build_object('company_id', 'bb9cbf8a-3d0d-5218-c423-d1318c0f9202', 'role', 'admin')
WHERE email = 'ad@quotient-capital.com';

-- Mr Clear Cut (Admin)
UPDATE profiles
SET role = 'admin',
    full_name = 'Mr Clear Cut',
    company_id = 'bb9cbf8a-3d0d-5218-c423-d1318c0f9202'
WHERE email = 'clear@quotient-capital.com';

UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data ||
  jsonb_build_object('company_id', 'bb9cbf8a-3d0d-5218-c423-d1318c0f9202', 'role', 'admin')
WHERE email = 'clear@quotient-capital.com';

-- ============================================================================
-- KUMBRA CAPITAL USERS
-- ============================================================================

-- Ad @ Kumbra (Admin)
UPDATE profiles
SET role = 'admin',
    company_id = 'aa9cbf8a-2d0d-4218-b423-c1318c0f9101'
WHERE email = 'ad@kumbracapital.com';

UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data ||
  jsonb_build_object('company_id', 'aa9cbf8a-2d0d-4218-b423-c1318c0f9101', 'role', 'admin')
WHERE email = 'ad@kumbracapital.com';

-- ============================================================================
-- VERIFY ALL USERS
-- ============================================================================

-- Check all users by company
SELECT
  c.name as company,
  p.role,
  p.full_name,
  p.email
FROM profiles p
LEFT JOIN companies c ON c.id = p.company_id
WHERE c.id IN (
  '00000000-0000-0000-0000-000000000000',  -- Sentra HQ
  'aa9cbf8a-2d0d-4218-b423-c1318c0f9101',  -- Kumbra Capital
  'bb9cbf8a-3d0d-5218-c423-d1318c0f9202'   -- Quotient Capital
)
ORDER BY c.name, p.role DESC, p.email;
```

---

## Step 3: Verify Setup

After running the SQL, sign in as your super admin (`ad@admin.com`) and check the Admin Panel → Companies tab.

You should now see:

### Kumbra Capital
- **Admins (2)**: Carlito, Sarah Johnson, ad@kumbracapital.com
- **Brokers (3)**: Daniel Cavanaugh, Jennifer Williams, Michael Chen

### Quotient Capital
- **Admins (2)**: ad@quotient-capital.com, Mr Clear Cut
- **Brokers (1)**: Tom McCallister

### Sentra HQ
- **Super Admins (1)**: AD Super (you)

---

## Current User Summary

### Already Set Up (Kumbra Capital):
✅ admin@kumbracapital.com - Sarah Johnson (Admin)
✅ carlito@kumbracapital.com - Carlito (Admin)
✅ daniel.cavanaugh@kumbracapital.com - Daniel Cavanaugh (Broker)
✅ jennifer.williams@kumbracapital.com - Jennifer Williams (Broker)
✅ michael.chen@kumbracapital.com - Michael Chen (Broker)

### Already Set Up (Sentra HQ):
✅ ad@admin.com - AD Super (Super Admin)

### Need to Create (Quotient Capital):
❌ tom.mccallister@quotient-capital.com - Tom McCallister (Broker)
❌ ad@quotient-capital.com - You (Admin)
❌ clear@quotient-capital.com - Mr Clear Cut (Admin)

### Need to Create (Kumbra Capital):
❌ ad@kumbracapital.com - You (Admin)

---

## Company IDs Reference

- **Sentra HQ**: `00000000-0000-0000-0000-000000000000`
- **Kumbra Capital**: `aa9cbf8a-2d0d-4218-b423-c1318c0f9101`
- **Quotient Capital**: `bb9cbf8a-3d0d-5218-c423-d1318c0f9202`

---

## Quick Access URLs

- **Sign Up**: `/sign-up`
- **Super Admin Panel**: `/admin` (after signing in as ad@admin.com)
- **Companies Overview**: `/admin` → Companies tab
