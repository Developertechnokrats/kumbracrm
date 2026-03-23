# Deploy Sentra CRM to Netlify - Quick Start

Your application is ready to deploy! Follow these steps to get it live.

## ✅ What's Ready

- ✅ Git repository initialized and committed
- ✅ Netlify configuration file created (`netlify.toml`)
- ✅ Next.js Netlify plugin installed
- ✅ Environment variables documented
- ✅ Build tested and passing

## 🚀 Deploy Now (Choose One Method)

### Method 1: Netlify CLI (Fastest - 5 minutes)

1. **Login to Netlify**
   ```bash
   netlify login
   ```
   This opens a browser to authenticate.

2. **Initialize Netlify Site**
   ```bash
   netlify init
   ```

   When prompted:
   - **Create & configure a new site**: Yes
   - **Team**: Select your team
   - **Site name**: `sentra-crm` (or your choice)
   - **Build command**: `npm run build`
   - **Directory to deploy**: `.next`
   - **Netlify functions folder**: (leave empty)

3. **Set Environment Variables**
   ```bash
   netlify env:set NEXT_PUBLIC_SUPABASE_URL "https://0ec90b57d6e95fcbda19832f.supabase.co"
   netlify env:set NEXT_PUBLIC_SUPABASE_ANON_KEY "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJib2x0IiwicmVmIjoiMGVjOTBiNTdkNmU5NWZjYmRhMTk4MzJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4ODE1NzQsImV4cCI6MTc1ODg4MTU3NH0.9I8-U0x86Ak8t2DGaIk0HfvTSLsAyzdnz-Nw00mMkKw"
   netlify env:set NEXT_PUBLIC_APP_NAME "Sentra CRM"
   netlify env:set NEXT_PUBLIC_BRAND_PRIMARY "#1b263f"
   netlify env:set NEXT_PUBLIC_BRAND_ACCENT "#00b2e3"
   netlify env:set NEXT_PUBLIC_BRAND_MUTED "#878786"
   ```

4. **Deploy!**
   ```bash
   netlify deploy --prod
   ```

5. **Your site is live!** 🎉
   URL will be shown in the terminal: `https://[site-name].netlify.app`

---

### Method 2: GitHub + Netlify UI (More Control)

1. **Create GitHub Repository**

   Go to https://github.com/new and create a new repository.

2. **Push Code to GitHub**
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/sentra-crm.git
   git branch -M main
   git push -u origin main
   ```

3. **Connect to Netlify**

   - Go to https://app.netlify.com
   - Click "Add new site" > "Import an existing project"
   - Choose GitHub
   - Select your `sentra-crm` repository

4. **Configure Build**

   Netlify will auto-detect Next.js settings. Verify:
   - Build command: `npm run build`
   - Publish directory: `.next`

5. **Add Environment Variables**

   Click "Show advanced" then "New variable" for each:

   | Variable | Value |
   |----------|-------|
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://0ec90b57d6e95fcbda19832f.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJib2x0IiwicmVmIjoiMGVjOTBiNTdkNmU5NWZjYmRhMTk4MzJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4ODE1NzQsImV4cCI6MTc1ODg4MTU3NH0.9I8-U0x86Ak8t2DGaIk0HfvTSLsAyzdnz-Nw00mMkKw` |
   | `NEXT_PUBLIC_APP_NAME` | `Sentra CRM` |
   | `NEXT_PUBLIC_BRAND_PRIMARY` | `#1b263f` |
   | `NEXT_PUBLIC_BRAND_ACCENT` | `#00b2e3` |
   | `NEXT_PUBLIC_BRAND_MUTED` | `#878786` |

6. **Deploy**

   Click "Deploy site" and wait 2-3 minutes.

7. **Your site is live!** 🎉

---

## 🔧 Post-Deployment Setup (Important!)

### 1. Update Supabase URL Allowlist

Your Netlify URL needs to be added to Supabase:

1. Go to https://supabase.com/dashboard/project/0ec90b57d6e95fcbda19832f
2. Navigate to **Authentication** > **URL Configuration**
3. Add to **Site URL**: `https://[your-site-name].netlify.app`
4. Add to **Redirect URLs**: `https://[your-site-name].netlify.app/**`
5. Click **Save**

### 2. Enable JWT Claims Hook (If Not Done)

If you haven't done this yet:

1. Go to **Authentication** > **Hooks**
2. Enable "Custom access token hook"
3. Set function to: `public.custom_access_token_hook`
4. Click **Save**

### 3. Create Test Users (If Not Done)

Follow the steps in `SETUP_GUIDE.md` to create test users:
- Super Admin: `admin@sentra.io`
- Demo Broker: `broker@demo.capital`

---

## ✅ Test Your Deployment

1. Visit your Netlify URL: `https://[your-site-name].netlify.app`
2. You should see the sign-in page
3. Sign in with `broker@demo.capital` / `password123`
4. Verify:
   - ✅ Dashboard loads
   - ✅ Contacts page shows 3 sample contacts
   - ✅ Products page shows 3 bond products
   - ✅ Navigation works
5. Sign out and test super admin access

---

## 🎨 Customize Your Site

### Change Site Name
```bash
netlify sites:update --name your-new-name
```

### Custom Domain
1. Go to Netlify dashboard > Domain management
2. Add custom domain
3. Follow DNS instructions
4. Update Supabase URL allowlist with new domain

---

## 📊 Monitor Your Site

### View Logs
```bash
netlify logs
```

### Live Tail Logs
```bash
netlify logs:function [function-name] --live
```

### Check Build Status
```bash
netlify status
```

---

## 🔄 Continuous Deployment

Once connected to Git:
- **Push to main branch** = Auto deploy to production
- **Pull requests** = Deploy previews automatically created

---

## 🆘 Troubleshooting

### Build Fails
- Check Netlify build logs
- Verify all environment variables are set
- Ensure `node_modules` is not in Git

### Can't Sign In
- Check browser console for errors
- Verify Supabase URL allowlist includes Netlify URL
- Check JWT claims hook is enabled
- Clear browser cache and try again

### RLS Errors
- Verify JWT claims function is working
- Check environment variables are correct
- Test locally first: `npm run dev`

### Middleware Issues
- Check that `middleware.ts` is not in `.gitignore`
- Verify Supabase credentials are correct
- Check Netlify function logs

---

## 📚 Additional Resources

- **Full Documentation**: See `README.md`
- **Setup Guide**: See `SETUP_GUIDE.md`
- **Deployment Details**: See `NETLIFY_DEPLOYMENT.md`
- **Project Overview**: See `PROJECT_SUMMARY.md`

---

## 🎉 Success!

Once deployed and configured, your Sentra CRM will be:
- ✅ Live on the internet
- ✅ Secured with HTTPS
- ✅ Multi-tenant ready
- ✅ Backed by Supabase
- ✅ Auto-deploying on Git push

**Next Steps**:
1. Create your real users
2. Customize branding
3. Add more features
4. Set up monitoring
5. Configure custom domain

---

**Need help?** Check the troubleshooting section or documentation files.
