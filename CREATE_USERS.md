# Create Admin and Broker Accounts

## 🔐 Users to Create

### 1. Admin Account
- **Email:** carlito@kumbracapital.com
- **Password:** (you choose - suggest: Admin123!)
- **Role:** admin
- **Company:** Kumbra Capital

### 2. Broker Account
- **Email:** david.perry@kumbracapital.com
- **Password:** (you choose - suggest: Broker123!)
- **Role:** broker
- **Company:** Kumbra Capital

---

## 📋 Method 1: Sign Up Through App (Recommended)

### For Carlito (Admin):
1. Go to `/sign-up` in your browser
2. Fill in the form:
   - **Full Name:** Carlito
   - **Email:** carlito@kumbracapital.com
   - **Password:** (your choice)
   - Click "Sign up"
3. Once signed up, you need to update their role to admin

### For David Perry (Broker):
1. Go to `/sign-up` in your browser
2. Fill in the form:
   - **Full Name:** David Perry
   - **Email:** david.perry@kumbracapital.com
   - **Password:** (your choice)
   - Click "Sign up"
3. This account will be broker by default (already correct)

---

## 🔧 Method 2: Update Roles After Sign Up

After they sign up through the app, run this SQL to set the correct roles:

```sql
-- Make Carlito an admin
UPDATE profiles
SET role = 'admin',
    full_name = 'Carlito'
WHERE email = 'carlito@kumbracapital.com';

-- Ensure David Perry is a broker (should be default)
UPDATE profiles
SET role = 'broker',
    full_name = 'David Perry'
WHERE email = 'david.perry@kumbracapital.com';
```

---

## 🎯 Method 3: Direct Database Insert (If You Have Auth User IDs)

If the users already exist in auth.users, you can update or insert their profiles:

```sql
-- Update Carlito to admin
UPDATE profiles
SET role = 'admin',
    full_name = 'Carlito',
    company_id = 'aa9cbf8a-2d0d-4218-b423-c1318c0f9101' -- Kumbra Capital
WHERE email = 'carlito@kumbracapital.com';

-- Update David Perry to broker
UPDATE profiles
SET role = 'broker',
    full_name = 'David Perry',
    company_id = 'aa9cbf8a-2d0d-4218-b423-c1318c0f9101' -- Kumbra Capital
WHERE email = 'david.perry@kumbracapital.com';
```

---

## ✅ After Creation - What They See

### Carlito (Admin) Signs In:
1. Goes to `/sign-in`
2. Enters: carlito@kumbracapital.com + password
3. Sees sidebar with "Admin Panel" link
4. Can click "Admin Panel" to:
   - Import leads from CSV
   - Distribute leads to brokers
   - Monitor broker performance
   - See operations overview

### David Perry (Broker) Signs In:
1. Goes to `/sign-in`
2. Enters: david.perry@kumbracapital.com + password
3. Sees sidebar with regular navigation
4. Goes to "Contacts" page
5. Sees contacts assigned to him by Carlito
6. Can work on his leads

---

## 🔒 Testing the Setup

### Test Admin Access:
1. Sign in as carlito@kumbracapital.com
2. Click "Admin Panel" in sidebar
3. Try importing a test CSV
4. Try assigning a lead to David Perry

### Test Broker Access:
1. Sign in as david.perry@kumbracapital.com
2. Go to "Contacts" page
3. Should see any leads assigned by Carlito
4. Try adding a note to a contact

---

## 📊 Quick SQL Check

To verify the accounts are set up correctly:

```sql
-- Check both profiles
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

Expected result:
- Carlito | carlito@kumbracapital.com | admin | Kumbra Capital
- David Perry | david.perry@kumbracapital.com | broker | Kumbra Capital

---

## 🚀 Next Steps

1. Have both users sign up at `/sign-up`
2. Run the SQL update to set Carlito as admin
3. Carlito signs in and goes to Admin Panel
4. Carlito imports CSV leads
5. Carlito distributes leads to David Perry
6. David Perry signs in and sees his assigned leads
7. System working! 🎉

---

## ⚠️ Important Notes

- **Email Confirmation:** If email confirmation is enabled in Supabase, users need to confirm their email first
- **Company ID:** Both users should belong to Kumbra Capital (id: aa9cbf8a-2d0d-4218-b423-c1318c0f9101)
- **Default Role:** New signups default to 'broker' role, so you only need to update Carlito to 'admin'
- **Passwords:** Choose strong passwords for production use

---

## 🔑 Suggested Passwords (Change These!)

For testing purposes:
- **Carlito:** Admin2024!
- **David Perry:** Broker2024!

**Remember to change these to secure passwords!**
