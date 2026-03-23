# Sentra CRM

A production-ready, multi-tenant, modular CRM for financial sales floors built with Next.js, Supabase, and TypeScript.

## Features

- **Multi-Tenant Architecture**: Complete tenant isolation with Row-Level Security (RLS)
- **Subscription Tiers**: Starter, Growth, Desk, Enterprise plans with feature gating
- **Modular Design**: À-la-carte modules with clean upgrade paths
- **Role-Based Access Control**: Super Admin, Admin, Manager, Broker, Viewer roles
- **CRM Core**: Contacts, Notes, Call Logs, KYC Documents
- **Products Catalog**: Unified system for Bonds, Funds, Pre-IPO, Gold products
- **Holdings Management**: Orders, fills, holdings, cash ledger
- **HQ Admin Panel**: Tenant management, subscription control, usage tracking
- **Audit Logging**: Complete activity tracking for compliance

## Tech Stack

- **Framework**: Next.js 13.5 (App Router)
- **Database**: Supabase (PostgreSQL with RLS)
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS + shadcn/ui
- **Forms**: React Hook Form + Zod
- **State Management**: TanStack Query
- **Charts**: Recharts
- **Icons**: Lucide React

## Project Structure

```
/db                     # SQL migrations and seeds
/lib                    # Core libraries
  /supabase            # Supabase client/server
  auth.ts              # Authentication helpers
  entitlements.ts      # Feature gating logic
  types.ts             # TypeScript types
/app
  /(auth)              # Authentication pages
  /(app)               # Main application (broker workspace)
  /(hq)                # HQ Super Admin panel
/components
  /shell               # Navigation and layout
  /ui                  # shadcn/ui components
```

## Environment Variables

The following environment variables are already configured in `.env`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://yfvqjtlzrmiuhesegziz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]
NEXT_PUBLIC_APP_NAME=Sentra CRM
NEXT_PUBLIC_BRAND_PRIMARY=#1b263f
NEXT_PUBLIC_BRAND_ACCENT=#00b2e3
NEXT_PUBLIC_BRAND_MUTED=#878786
```

## Database Setup

### 1. Apply Migrations

The database schema and seed data have already been applied to your Supabase instance. The migrations include:

#### Schema (`db/000_init.sql`)
- **Tenancy**: companies, profiles with RLS
- **Entitlements**: plans, features, subscriptions, feature overrides
- **CRM**: contacts, call_logs, notes, accounts
- **Products**: issuers, products (multi-type), product details
- **Trading**: orders, fills, holdings, cash_ledger
- **Compliance**: documents, audit_log

#### Seed Data (`db/010_seed.sql`)
- **Plans**: Starter, Growth, Desk, Enterprise
- **Features**: 18 feature flags (crm.leads, crm.notes, auto.sequences, etc.)
- **Demo Company**: "Demo Capital" with active Desk subscription
- **Sample Data**: 3 contacts, 3 bond products, 3 issuers

### 2. Create Test Users

To use the system, you'll need to create users in Supabase Auth. Here's how:

#### Option 1: Via Supabase Dashboard

1. Go to https://supabase.com/dashboard/project/[your-project-id]/auth/users
2. Click "Add User"
3. Create these users:

**Super Admin (for HQ access)**
- Email: `admin@sentra.io`
- Password: `password123`
- After creation, run this SQL:
```sql
INSERT INTO public.profiles (id, company_id, full_name, email, role)
VALUES (
  '[user-id-from-auth]',
  '00000000-0000-0000-0000-000000000000',
  'Super Admin',
  'admin@sentra.io',
  'super_admin'
);
```

**Demo Broker**
- Email: `broker@demo.capital`
- Password: `password123`
- After creation, run this SQL:
```sql
INSERT INTO public.profiles (id, company_id, full_name, email, role)
VALUES (
  '[user-id-from-auth]',
  '11111111-1111-1111-1111-111111111111',
  'Demo Broker',
  'broker@demo.capital',
  'broker'
);
```

#### Option 2: Via SQL

Run this SQL in the Supabase SQL Editor to create users with profiles:

```sql
-- Note: In production, users should be created via Supabase Auth API
-- This is simplified for development setup

-- The actual user creation must be done through Supabase Auth
-- Then link profiles manually as shown above
```

### 3. Add JWT Claims (Important!)

For RLS to work properly, you need to add custom claims to the JWT. Create a database function:

```sql
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  claims jsonb;
  user_role text;
  user_company_id uuid;
BEGIN
  -- Fetch user profile
  SELECT role, company_id INTO user_role, user_company_id
  FROM public.profiles
  WHERE id = (event->>'user_id')::uuid;

  claims := event->'claims';

  IF user_role IS NOT NULL THEN
    claims := jsonb_set(claims, '{role}', to_jsonb(user_role));
  END IF;

  IF user_company_id IS NOT NULL THEN
    claims := jsonb_set(claims, '{company_id}', to_jsonb(user_company_id));
  END IF;

  event := jsonb_set(event, '{claims}', claims);

  RETURN event;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO postgres;
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO anon;
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO authenticated;
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO service_role;
```

Then configure the hook in Supabase Dashboard:
1. Go to Authentication > Hooks
2. Enable "Custom access token hook"
3. Set the function to `public.custom_access_token_hook`

## Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Available Routes

### Authentication
- `/sign-in` - Sign in page

### Broker Workspace (Requires authentication)
- `/dashboard` - Overview with KPIs and recent activity
- `/contacts` - Contact list with status badges
- `/products` - Product catalog with filters
- `/documents` - Document management (placeholder)

### HQ Admin (Requires super_admin role)
- `/hq/admin` - Tenant management, subscriptions, system overview

## Subscription Tiers

### Starter (Tier 1)
- Leads & Contacts
- Notes & Call Logs
- KYC Documents
- Products
- Proposals PDF
- Holdings Lite
- Reminders

### Growth (Tier 2)
All Starter features plus:
- Sequences
- Advanced Reporting
- OAuth SSO

### Desk (Tier 3)
All Growth features plus:
- WhatsApp/SMS
- E-sign
- AI Call Summaries
- Pre-IPO
- Funds
- Gold/Metals

### Enterprise (Tier 4)
All features including:
- Warehouse Sync
- White-Label

## Feature Gating

Features are controlled via the entitlements system:

```typescript
import { can } from '@/lib/entitlements'

// Server-side
const hasAccess = await can(companyId, 'crm.products')

// Client-side
const { has } = useEntitlements(initialKeys)
if (has('esign.core')) {
  // Show e-sign features
}
```

## Security

- **Row-Level Security (RLS)**: All tables enforce company_id isolation
- **JWT Claims**: Role and company_id injected into auth tokens
- **Role-Based Access**: Fine-grained permissions per role
- **Audit Logging**: All critical actions are logged
- **Data Encryption**: Supabase handles encryption at rest

## Data Model Highlights

### Contacts
- Complete KYC fields (proof of address, ID, signature)
- Financial profile (net worth, income, liquidity)
- Preferences (ideal term, currency, asset classes)
- Assignment and pipeline tracking

### Products
- Unified catalog for multiple asset types
- Type-specific details in separate tables
- Issuer relationships with ratings
- Min investment and terms

### Entitlements
- Plan-based feature sets
- Company-specific overrides
- Usage tracking per feature

## Development Notes

- **Server Components**: Most pages are RSC for optimal performance
- **Server Actions**: For mutations (to be added)
- **Optimistic Updates**: For better UX (to be implemented)
- **Type Safety**: Full TypeScript coverage

## Next Steps

To complete the system, consider adding:

1. **Server Actions**: Create/update/delete for contacts, products, etc.
2. **Contact Detail Page**: Full profile with tabs (notes, calls, KYC, products, holdings)
3. **Product Selector**: Up to 3 product selections per contact
4. **Document Upload**: Supabase Storage integration for KYC files
5. **Proposal Generator**: PDF generation from contact + product data
6. **Command Palette**: Cmd+K for quick actions
7. **Keyboard Shortcuts**: n (note), c (call), u (upload)
8. **Advanced Filters**: Saved views for contact lists
9. **Kanban View**: Drag-and-drop status updates
10. **Usage Metering**: Track feature usage for billing

## License

Proprietary - All rights reserved

## Support

For issues or questions, contact the development team.
