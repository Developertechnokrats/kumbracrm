# Sentra CRM - Quick Setup Guide

This guide will help you get the CRM up and running in minutes.

## ✅ What's Already Done

- ✅ Database schema created (companies, profiles, contacts, products, etc.)
- ✅ Row-Level Security (RLS) policies applied
- ✅ Seed data loaded (plans, features, demo company, sample products)
- ✅ JWT claims function created
- ✅ Application code built and ready

## 🚀 Quick Start (3 Steps)

### Step 1: Configure JWT Claims Hook

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/yfvqjtlzrmiuhesegziz
2. Navigate to **Authentication** > **Hooks**
3. Find "**Custom access token hook**"
4. **Enable** the hook
5. Set the function to: `public.custom_access_token_hook`
6. Click **Save**

This allows RLS to work properly by adding `role` and `company_id` to the JWT.

### Step 2: Create Test Users

#### Method A: Via Supabase Dashboard (Easiest)

1. Go to **Authentication** > **Users**
2. Click **Add User** > **Create new user**

**Create Super Admin User:**
- Email: `admin@sentra.io`
- Password: `password123` (or your choice)
- Auto Confirm User: ✅ Yes
- Click **Create user**
- **Copy the User ID** (you'll need it in the next step)

3. Go to **SQL Editor** and run:
```sql
-- Replace [USER_ID] with the actual UUID from the user you just created
INSERT INTO public.profiles (id, company_id, full_name, email, role)
VALUES (
  '[USER_ID]'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'Super Admin',
  'admin@sentra.io',
  'super_admin'
);
```

**Create Demo Broker User:**
Repeat the process:
- Email: `broker@demo.capital`
- Password: `password123` (or your choice)
- Auto Confirm User: ✅ Yes
- Copy the User ID

Then run:
```sql
-- Replace [USER_ID] with the actual UUID from the broker user
INSERT INTO public.profiles (id, company_id, full_name, email, role)
VALUES (
  '[USER_ID]'::uuid,
  '11111111-1111-1111-1111-111111111111'::uuid,
  'Demo Broker',
  'broker@demo.capital',
  'broker'
);
```

#### Method B: Quick SQL Script

Run this in the Supabase SQL Editor:

```sql
-- Create profiles (you must create the auth.users first via Dashboard)
-- This script assumes you've already created users with these emails

-- Link Super Admin profile
INSERT INTO public.profiles (id, company_id, full_name, email, role)
SELECT
  id,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'Super Admin',
  'admin@sentra.io',
  'super_admin'
FROM auth.users
WHERE email = 'admin@sentra.io'
ON CONFLICT (id) DO NOTHING;

-- Link Demo Broker profile
INSERT INTO public.profiles (id, company_id, full_name, email, role)
SELECT
  id,
  '11111111-1111-1111-1111-111111111111'::uuid,
  'Demo Broker',
  'broker@demo.capital',
  'broker'
FROM auth.users
WHERE email = 'broker@demo.capital'
ON CONFLICT (id) DO NOTHING;
```

### Step 3: Start the Application

```bash
# Install dependencies (if not already done)
npm install

# Run development server
npm run dev
```

Open http://localhost:3000 and sign in!

## 🎯 Test Your Setup

### Test 1: Super Admin Access
1. Sign in with `admin@sentra.io`
2. You should see the Dashboard
3. In the sidebar, you should see **"HQ Admin"** link
4. Click HQ Admin - you should see all tenants and plans

### Test 2: Demo Broker Access
1. Sign out
2. Sign in with `broker@demo.capital`
3. You should see the Dashboard with Demo Capital data
4. Navigate to **Contacts** - you should see 3 sample contacts
5. Navigate to **Products** - you should see 3 bond products
6. You should **NOT** see the HQ Admin link (broker role)

### Test 3: Feature Gating
1. As broker user, the app shows features based on "Desk" plan
2. Demo Capital has the Desk subscription active
3. Features available: leads, notes, docs, products, proposals, holdings, reminders, sequences, reporting, SSO, WhatsApp, e-sign, voice AI, Pre-IPO, Funds, Gold

## 🗄️ Database Overview

Your Supabase database now has:

### Companies
- **Sentra HQ** (id: 00000000-0000-0000-0000-000000000000) - For super admins
- **Demo Capital** (id: 11111111-1111-1111-1111-111111111111) - Demo tenant

### Plans
- Starter (tier 1) - 7 features
- Growth (tier 2) - 10 features
- Desk (tier 3) - 16 features
- Enterprise (tier 4) - 18 features (all features)

### Sample Data (in Demo Capital)
- 3 Contacts (Fresh Lead, KYC In Progress, Paid Client)
- 3 Issuers (Barclays, BMO, Deutsche Bank)
- 3 Bond Products (with coupon rates, terms, ISINs)

## 🔐 Security Features

- **Multi-Tenant Isolation**: RLS policies enforce company_id matching
- **Role-Based Access**: Different permissions per role
- **JWT Claims**: Role and company_id injected into tokens
- **Audit Logging**: Ready for tracking all changes

## 📚 What You Can Do

### As Super Admin (admin@sentra.io)
- View all companies/tenants
- See subscription status
- Manage plans and features
- Access HQ admin panel

### As Broker (broker@demo.capital)
- View/manage contacts in Demo Capital
- Browse product catalog
- See dashboard with KPIs
- Access based on Desk plan features

## 🛠️ Troubleshooting

### Issue: Can't see any data after login
**Solution**: Make sure the JWT hook is configured correctly (Step 1). Sign out and sign back in to get a fresh token with claims.

### Issue: "Unauthorized" error
**Solution**: Verify that:
1. Profile exists for the user (check `profiles` table)
2. Profile has correct `company_id`
3. JWT hook is enabled and active
4. Clear cookies and sign in again

### Issue: RLS policy errors
**Solution**: Check that the user's JWT contains `role` and `company_id` claims. You can verify by running:
```sql
SELECT auth.jwt();
```
in the SQL Editor after signing in.

### Issue: Can't access HQ Admin
**Solution**: Make sure the user's profile has `role = 'super_admin'`.

## 🎨 Customization

### Change Branding
Edit `.env`:
```env
NEXT_PUBLIC_APP_NAME=Your Company Name
NEXT_PUBLIC_BRAND_PRIMARY=#your-color
NEXT_PUBLIC_BRAND_ACCENT=#your-color
NEXT_PUBLIC_BRAND_MUTED=#your-color
```

### Add More Test Data
Use the SQL Editor to insert more contacts, products, etc. Remember to use the correct `company_id`.

## 📖 Next Steps

Once you're up and running, check out `README.md` for:
- Full feature documentation
- Development guidelines
- API reference
- Extension points

## 🆘 Need Help?

If you encounter issues:
1. Check the browser console for errors
2. Check Supabase logs (Dashboard > Logs)
3. Verify RLS policies are not blocking access
4. Ensure JWT hook is active

---

**🎉 That's it! You're ready to use Sentra CRM.**

Sign in and explore the multi-tenant CRM system with subscription tiers, feature gating, and role-based access control.
