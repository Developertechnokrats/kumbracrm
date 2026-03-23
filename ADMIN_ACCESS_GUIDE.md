# Admin Access Guide - How to Add Leads

## 🔐 How to Access Admin Panel

### For Admin Users:

1. **Sign in** at `/sign-in` with your admin credentials
   - Your account must have `role = 'admin'` or `role = 'super_admin'` in the database

2. **Navigate to Admin Panel:**
   - **Option 1:** Click "Admin Panel" in the left sidebar navigation
   - **Option 2:** Type `/admin` in the URL bar and press Enter

3. Once in the admin panel, you'll see these tabs:
   - **Operations Overview** - See all metrics
   - **Import Leads** - Upload CSV files
   - **Lead Distribution** - Assign leads to brokers
   - **Broker Performance** - Monitor team stats
   - **Companies** (Super Admin only)

---

## 📥 How to Add Leads to Brokers

### Method 1: Import from CSV (Bulk Import)

1. Go to **Admin Panel** (`/admin`)
2. Click the **"Import Leads"** tab
3. Click **"Choose File"** and select your CSV file
4. Review the preview (shows first 5 rows)
5. Click **"Import X Leads"** button
6. Wait for import to complete
7. See success message with count

**Result:** All leads imported with status "Fresh Lead" and no broker assigned yet.

### Method 2: Distribute Imported Leads

After importing (or if you already have unassigned leads):

1. Go to **Admin Panel** (`/admin`)
2. Click the **"Lead Distribution"** tab
3. You'll see a list of all unassigned leads
4. For each lead:
   - Click the dropdown menu
   - Select a broker's name
   - Lead is instantly assigned!
5. Lead disappears from unassigned list
6. Broker can now see it in their Contacts page

---

## 👥 Where Do Brokers See Their Leads?

Once you assign a lead to a broker:

1. Broker signs in to their account
2. Broker goes to **"Contacts"** page (`/contacts`)
3. They see the lead in their contact list
4. They can click on it to view full details
5. They can add notes, make calls, track progress

---

## 📊 What Admins Can See

### Operations Overview Tab:
- Total pipeline across all brokers
- Active deals count
- Total conversions
- Conversion rate percentage
- Top 5 brokers by performance
- Last 10 contacts added
- Unassigned leads count

### Broker Performance Tab:
- Each broker's total pipeline
- Active deals per broker
- Conversions per broker
- Success rate per broker
- Last activity date per broker

---

## 🔑 User Roles Explained

### Super Admin (You):
- ✅ Full system access
- ✅ See all companies
- ✅ Configure company settings
- ✅ Import leads
- ✅ Distribute leads
- ✅ View all broker stats
- **Navigation shows:** "HQ Admin"

### Admin:
- ✅ Import leads for their company
- ✅ Distribute leads to their brokers
- ✅ View their company's broker stats
- ✅ See operations overview
- ❌ Cannot see other companies
- **Navigation shows:** "Admin Panel"

### Broker:
- ✅ See their own contacts
- ✅ Add notes to contacts
- ✅ Track contact status
- ❌ Cannot access admin panel
- ❌ Cannot see other brokers' contacts
- **Navigation shows:** No admin link

---

## 📋 Quick Workflow Example

### Daily Lead Management:

**Morning - Import Leads:**
```
1. Sign in as admin
2. Click "Admin Panel" in sidebar
3. Go to "Import Leads" tab
4. Upload CSV with 50 new leads
5. Click "Import 50 Leads"
6. See success message
```

**Midday - Distribute Leads:**
```
1. Go to "Lead Distribution" tab
2. See 50 unassigned leads
3. Assign 10 leads to Broker A
4. Assign 10 leads to Broker B
5. Assign 10 leads to Broker C
6. Assign 10 leads to Broker D
7. Assign 10 leads to Broker E
8. All 50 leads now distributed!
```

**Afternoon - Monitor Progress:**
```
1. Go to "Broker Performance" tab
2. See which brokers are active
3. Check conversion rates
4. Identify top performers
5. Balance workload if needed
```

---

## 🎯 Setting Up Admin Access

If you need to make someone an admin:

1. They need to sign up first at `/sign-up`
2. Then you update their role in the database:

```sql
UPDATE profiles
SET role = 'admin'
WHERE email = 'their-email@example.com';
```

Roles available:
- `super_admin` - Full system access (you)
- `admin` - Company admin (can import/distribute leads)
- `manager` - Team manager (future use)
- `broker` - Sales person (sees own contacts)
- `viewer` - Read-only (future use)

---

## 📱 Navigation After Sign In

When an admin signs in, their sidebar shows:
- Dashboard
- Contacts
- Calendar
- Products
- Documents
- **Admin Panel** ← Click here!
- [Sign Out button at bottom]

---

## ✅ Summary

**To add leads to brokers as admin:**

1. ✅ Sign in with admin account
2. ✅ Click "Admin Panel" in sidebar (or go to `/admin`)
3. ✅ Click "Import Leads" tab
4. ✅ Upload CSV file
5. ✅ Click "Import X Leads"
6. ✅ Go to "Lead Distribution" tab
7. ✅ Select broker from dropdown for each lead
8. ✅ Lead assigned instantly!
9. ✅ Broker sees it in their Contacts page

**That's it! Simple, fast, no data lost.** 🚀
