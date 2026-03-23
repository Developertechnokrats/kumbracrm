# Company Setup Guide
## Create Users for Sentra Capital & Quotient Capital

## Step 1: Create User Accounts

### Sentra Capital Users
Go to `/sign-up` and create these 3 accounts:

1. **Sarah Mitchell** (Admin)
   - Email: `sarah.admin@sentracapital.com`
   - Password: (your choice)

2. **John Davis** (Broker)
   - Email: `john.broker@sentracapital.com`
   - Password: (your choice)

3. **Emma Thompson** (Broker)
   - Email: `emma.broker@sentracapital.com`
   - Password: (your choice)

### Quotient Capital Users
Go to `/sign-up` and create these 3 accounts:

4. **Michael Roberts** (Admin)
   - Email: `michael.admin@quotient-capital.com`
   - Password: (your choice)

5. **Lisa Anderson** (Broker)
   - Email: `lisa.broker@quotient-capital.com`
   - Password: (your choice)

6. **David Chen** (Broker)
   - Email: `david.broker@quotient-capital.com`
   - Password: (your choice)

---

## Step 2: Run the Seed Script

After all 6 users have signed up, run the seed script in Supabase SQL Editor:

```sql
-- The complete script is in: db/seed_companies.sql
```

Or copy and run this quick version:

```sql
-- SENTRA CAPITAL
UPDATE profiles SET role = 'admin', full_name = 'Sarah Mitchell', company_id = '00000000-0000-0000-0000-000000000000' WHERE email = 'sarah.admin@sentracapital.com';
UPDATE profiles SET role = 'broker', full_name = 'John Davis', company_id = '00000000-0000-0000-0000-000000000000' WHERE email = 'john.broker@sentracapital.com';
UPDATE profiles SET role = 'broker', full_name = 'Emma Thompson', company_id = '00000000-0000-0000-0000-000000000000' WHERE email = 'emma.broker@sentracapital.com';

UPDATE auth.users SET raw_app_meta_data = raw_app_meta_data || jsonb_build_object('company_id', '00000000-0000-0000-0000-000000000000', 'role', 'admin') WHERE email = 'sarah.admin@sentracapital.com';
UPDATE auth.users SET raw_app_meta_data = raw_app_meta_data || jsonb_build_object('company_id', '00000000-0000-0000-0000-000000000000', 'role', 'broker') WHERE email IN ('john.broker@sentracapital.com', 'emma.broker@sentracapital.com');

-- QUOTIENT CAPITAL
UPDATE profiles SET role = 'admin', full_name = 'Michael Roberts', company_id = 'bb9cbf8a-3d0d-5218-c423-d1318c0f9202' WHERE email = 'michael.admin@quotient-capital.com';
UPDATE profiles SET role = 'broker', full_name = 'Lisa Anderson', company_id = 'bb9cbf8a-3d0d-5218-c423-d1318c0f9202' WHERE email = 'lisa.broker@quotient-capital.com';
UPDATE profiles SET role = 'broker', full_name = 'David Chen', company_id = 'bb9cbf8a-3d0d-5218-c423-d1318c0f9202' WHERE email = 'david.broker@quotient-capital.com';

UPDATE auth.users SET raw_app_meta_data = raw_app_meta_data || jsonb_build_object('company_id', 'bb9cbf8a-3d0d-5218-c423-d1318c0f9202', 'role', 'admin') WHERE email = 'michael.admin@quotient-capital.com';
UPDATE auth.users SET raw_app_meta_data = raw_app_meta_data || jsonb_build_object('company_id', 'bb9cbf8a-3d0d-5218-c423-d1318c0f9202', 'role', 'broker') WHERE email IN ('lisa.broker@quotient-capital.com', 'david.broker@quotient-capital.com');
```

---

## Step 3: Add Dummy Contacts (Optional)

To populate with dummy contact data, run the full `db/seed_companies.sql` script. This will create:

- **Sentra Capital**: 19 contacts (8 to John, 8 to Emma, 3 unassigned)
- **Quotient Capital**: 19 contacts (8 to Lisa, 8 to David, 3 unassigned)

Each contact has realistic names, emails, phone numbers, job titles, and various statuses across the sales pipeline.

---

## What You Get

### Three Complete Companies:

1. **Sentra HQ** (Super Admin Company)
   - Location: London, UK
   - Products: Bonds, Managed Funds
   - Subscription: Enterprise (£499/mo)
   - Bolt-ons: Advanced Analytics, API Access

2. **Kumbra Capital**
   - Location: Manchester, UK
   - Products: IPOs
   - Subscription: Professional (£299/mo)
   - Bolt-on: CRM Integration
   - Users: Already set up (Carlito + David Perry)

3. **Quotient Capital**
   - Location: Edinburgh, UK
   - Products: Bonds, Managed Funds, Gold Contracts
   - Subscription: Professional (£299/mo)
   - Bolt-on: WhatsApp Integration
   - Brand Color: #73BA80 (Green)
   - Logo: Quotient Capital branding

### Enhanced Admin Panel Features:

When you sign in as super admin, the Companies tab now shows:

- Location and city for each company
- Products they sell (with badges)
- User counts (Admins, Brokers, Managers)
- Total contacts per company
- Subscription level (Standard/Professional/Enterprise)
- Monthly charge
- Billing status (Active/Inactive)
- Bolt-ons added to each account
- Configure button for settings

---

## Testing the Setup

### As Super Admin:
1. Sign in to your super admin account
2. Go to Admin Panel
3. Click "Companies" tab
4. See all 3 companies with full details

### As Sentra Admin (Sarah):
1. Sign in: sarah.admin@sentracapital.com
2. See Admin Panel
3. Import leads or distribute existing leads
4. Monitor John and Emma's performance

### As Quotient Admin (Michael):
1. Sign in: michael.admin@quotient-capital.com
2. See Admin Panel with Quotient green theme
3. Import leads or distribute existing leads
4. Monitor Lisa and David's performance

### As Brokers:
1. Sign in as any broker
2. Go to Contacts
3. See their assigned leads
4. Work the pipeline

---

## Quick Reference

**Company IDs:**
- Sentra HQ: `00000000-0000-0000-0000-000000000000`
- Kumbra Capital: `aa9cbf8a-2d0d-4218-b423-c1318c0f9101`
- Quotient Capital: `bb9cbf8a-3d0d-5218-c423-d1318c0f9202`

**Pipeline Statuses:**
- Fresh Lead
- Fronted
- Apps In
- KYC In
- Trade Agreed
- Signed Agreement
- Debtor
- Hot Prospect
- Paid Client
- HTR
- Call Backs
- Dead Box

**Products Available:**
- IPOs (Kumbra)
- Bonds (Sentra, Quotient)
- Managed Funds (Sentra, Quotient)
- Gold Contracts (Quotient)
