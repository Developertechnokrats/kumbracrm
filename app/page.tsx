import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Building2, Shield, Users, TrendingUp, ChevronRight } from 'lucide-react'

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5"></div>

      <div className="relative">
        <nav className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Building2 className="w-8 h-8 text-primary" />
              <span className="text-2xl font-bold">HyperCRM</span>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" asChild>
                <Link href="/sign-in">Sign In</Link>
              </Button>
              <Button asChild>
                <Link href="/sign-up">Get Started</Link>
              </Button>
            </div>
          </div>
        </nav>

        <div className="container mx-auto px-4 py-12 sm:py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center max-w-7xl mx-auto">
            <div className="space-y-8">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
                  <TrendingUp className="w-4 h-4" />
                  <span>Professional CRM Solution</span>
                </div>

                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight">
                  Manage Your
                  <span className="block text-primary mt-2">Sales Pipeline</span>
                </h1>

                <p className="text-xl text-muted-foreground max-w-xl leading-relaxed">
                  The complete CRM platform for financial professionals. Track contacts, manage appointments, and close more deals.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild size="lg" className="text-lg">
                  <Link href="/sign-up">
                    Start Free Trial
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="text-lg">
                  <Link href="/sign-in">Employee Login</Link>
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-6 pt-8 border-t">
                <div>
                  <div className="text-3xl font-bold text-primary">500+</div>
                  <div className="text-sm text-muted-foreground mt-1">Active Users</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-primary">50K+</div>
                  <div className="text-sm text-muted-foreground mt-1">Contacts Managed</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-primary">99%</div>
                  <div className="text-sm text-muted-foreground mt-1">Uptime</div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-3xl blur-3xl"></div>
              <div className="relative rounded-2xl overflow-hidden border-2 border-border shadow-2xl bg-card">
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-auto"
                >
                  <source src="/hyper.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-20">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">Everything You Need</h2>
              <p className="text-xl text-muted-foreground">Powerful features to help your team succeed</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="p-8 rounded-2xl border bg-card hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Contact Management</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Organize and track all your leads and clients in one place. Advanced filtering and search capabilities.
                </p>
              </div>

              <div className="p-8 rounded-2xl border bg-card hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                  <TrendingUp className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Pipeline Tracking</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Visual Kanban boards to track deals through every stage. Drag and drop to update status.
                </p>
              </div>

              <div className="p-8 rounded-2xl border bg-card hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Secure & Compliant</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Enterprise-grade security with role-based access control. Your data is always protected.
                </p>
              </div>

              <div className="p-8 rounded-2xl border bg-card hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                  <Building2 className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Product Catalog</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Manage your investment products and offerings. Automated calculations and reporting.
                </p>
              </div>

              <div className="p-8 rounded-2xl border bg-card hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                  <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-3">Smart Calendar</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Schedule appointments and get reminders. Never miss an important meeting again.
                </p>
              </div>

              <div className="p-8 rounded-2xl border bg-card hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                  <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-3">Analytics & Reports</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Real-time dashboards and insights. Track performance and make data-driven decisions.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-20">
          <div className="max-w-4xl mx-auto text-center">
            <div className="p-12 rounded-3xl bg-gradient-to-br from-primary to-secondary text-primary-foreground">
              <h2 className="text-4xl font-bold mb-4">Ready to Get Started?</h2>
              <p className="text-xl opacity-90 mb-8">
                Join hundreds of professionals already using HyperCRM to grow their business.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" variant="secondary" className="text-lg">
                  <Link href="/sign-up">
                    Create Free Account
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="text-lg border-primary-foreground/20 hover:bg-primary-foreground/10">
                  <Link href="/sign-in">Sign In</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>

        <footer className="border-t py-12">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-3">
                <Building2 className="w-6 h-6 text-primary" />
                <span className="font-semibold">HyperCRM</span>
              </div>
              <div className="text-sm text-muted-foreground">
                © 2025 HyperCRM. All rights reserved.
              </div>
              <Link
                href="/adhdd"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                dev
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
