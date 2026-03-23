# Create Remaining Users

## Users Already Fixed ✅

These users now work correctly:
- **ad@kumbracapital.com** - Admin at Kumbra Capital
- **ad@quotient-capital.com** - Admin at Quotient Capital
- **ad@sentra.capital** - Admin at Sentra Capital

**You can now sign in with these accounts!** (use the passwords you created)

---

## Users Still Needed

Create these 2 users through the sign-up page:

### 1. Tom McCallister (Broker at Quotient Capital)
- Go to `/sign-up`
- **Email**: tom.mccallister@quotient-capital.com
- **Password**: TMwaesrd77@@
- **Full Name**: Tom McCallister

After signup, run this SQL in Supabase:
```sql
UPDATE profiles
SET role = 'broker', company_id = 'bb9cbf8a-3d0d-5218-c423-d1318c0f9202'
WHERE email = 'tom.mccallister@quotient-capital.com';

UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data || jsonb_build_object('role', 'broker', 'company_id', 'bb9cbf8a-3d0d-5218-c423-d1318c0f9202')
WHERE email = 'tom.mccallister@quotient-capital.com';
```

### 2. Clear Cut (Admin at Quotient Capital)
- Go to `/sign-up`
- **Email**: clear@quotient-capital.com
- **Password**: CC422025!!
- **Full Name**: Clear Cut

After signup, run this SQL in Supabase:
```sql
UPDATE profiles
SET role = 'admin', company_id = 'bb9cbf8a-3d0d-5218-c423-d1318c0f9202'
WHERE email = 'clear@quotient-capital.com';

UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data || jsonb_build_object('role', 'admin', 'company_id', 'bb9cbf8a-3d0d-5218-c423-d1318c0f9202')
WHERE email = 'clear@quotient-capital.com';
```

---

## OR - I Can Create Them Via API

Alternatively, tell me and I'll create a script to use Supabase Admin API to create these users programmatically.
