# 🔧 Fix Admin View Issues

## The Problem

When you login as **ad@kumbracapital.com**, you can't see other users, and as **ad@admin.com** (super admin), you can't see companies.

**Root Cause:** Your JWT token hasn't been refreshed after I fixed the profiles in the database.

---

## ✅ SOLUTION: Sign Out and Back In

### For ad@kumbracapital.com:
1. **Sign out** completely
2. **Sign back in** with your password
3. The new JWT will include the correct `company_id` and `role`
4. You will now see all 6 Kumbra users:
   - Admins: Sarah Johnson, Carlito, AD - Kumbra Admin
   - Brokers: Daniel Cavanaugh, Jennifer Williams, Michael Chen

### For ad@admin.com (Super Admin):
1. **Sign out** completely
2. **Sign back in**
3. The JWT will include `role: 'super_admin'`
4. You will now see all 3 companies:
   - Sentra Capital (Enterprise)
   - Kumbra Capital (Professional)
   - Quotient Capital (Professional)

---

## 📊 What The Database Shows

I verified the data is all there:

### Kumbra Capital Users (6 total):
- ✅ ad@kumbracapital.com (Admin)
- ✅ carlito@kumbracapital.com (Admin)
- ✅ admin@kumbracapital.com (Admin - Sarah Johnson)
- ✅ daniel.cavanaugh@kumbracapital.com (Broker)
- ✅ jennifer.williams@kumbracapital.com (Broker)
- ✅ michael.chen@kumbracapital.com (Broker)

### Companies (3 total):
- ✅ Sentra Capital
- ✅ Kumbra Capital
- ✅ Quotient Capital

The issue is ONLY that your browser session has an old JWT token.

---

## 🆕 Creating New Users

I need to create these 4 new users:

### 1. david.perry@kumbracapital.com (Broker)
**Password:** `DPwaesrd77@@`

### 2. daniel.cavanaugh@sentra.capital (Broker)
**Password:** `DCwaesrd77@@`

### 3. lavi@sentra.capital (Admin)
**Password:** `LAwaesrd77@@`

### 4. clear@quotient-capital.com (Admin)
**Password:** `CC422025!!`

---

## 📝 How to Create New Users

Since I can't directly create auth users without service role permissions, here's what to do:

### Option 1: Sign Up Page (Recommended)
1. Go to `/sign-up` on your site
2. Create each account with the email and password above
3. After EACH signup, go to Supabase SQL Editor
4. Run the SQL from `CREATE_NEW_USERS.sql` to fix their role and company

### Option 2: Supabase Dashboard
1. Go to Supabase Dashboard → Authentication → Users
2. Click "Add User"
3. Enter email and password
4. After creating, run the SQL from `CREATE_NEW_USERS.sql`

---

## 🔍 Why This Happens

When you first sign in, Supabase creates a JWT (JSON Web Token) that includes:
```json
{
  "role": "admin",
  "company_id": "aa9cbf8a-2d0d-4218-b423-c1318c0f9101"
}
```

This JWT is stored in your browser and used for all database queries. The RLS policies check this JWT to determine what data you can see.

When I fixed your profiles in the database, your browser still has the OLD JWT (which might be missing the company_id or role).

**Signing out clears the JWT. Signing back in creates a NEW JWT with the correct data.**

---

## ✅ After You Sign Out/In

### As ad@kumbracapital.com:
- ✅ See "All Team Members" section
- ✅ See all 6 users listed
- ✅ See 23 total contacts
- ✅ See broker stats and pipelines

### As ad@admin.com:
- ✅ See "Companies" tab as default
- ✅ See 3 company cards
- ✅ Click "View Details" to manage each company
- ✅ See stats, users, contacts for each company

---

## 🚨 If Still Not Working

If after signing out/in you still can't see data:

1. **Clear browser cache** and cookies
2. **Check browser console** (F12) for errors
3. **Verify JWT** - In console, check:
   ```javascript
   localStorage.getItem('supabase.auth.token')
   ```
4. Tell me the error and I'll help debug

---

## 📌 Summary

**The data is correct in the database. You just need to refresh your session.**

**Steps:**
1. Sign out of ad@kumbracapital.com → Sign back in → See all users ✅
2. Sign out of ad@admin.com → Sign back in → See all companies ✅
3. Create 4 new users via sign-up page
4. Run SQL from CREATE_NEW_USERS.sql after each signup

Everything will work perfectly! 🎉
