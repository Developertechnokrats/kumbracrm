'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Users, Package, FileText, LogOut, Building2, Menu, Calendar, MapPin, Phone, Mail, Globe, Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useState } from 'react'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import Image from 'next/image'
import { useTheme } from 'next-themes'

type Profile = {
  id: string
  company_id: string
  full_name: string | null
  email: string | null
  role: string
}

type Company = {
  name: string
  logo_url?: string | null
  address?: string | null
  phone?: string | null
  email?: string | null
  website?: string | null
} | null

interface AppShellProps {
  children: React.ReactNode
  profile: Profile
  company: Company
  entitlements: string[]
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, feature: null },
  { name: 'Contacts', href: '/contacts', icon: Users, feature: null },
  { name: 'Calendar', href: '/calendar', icon: Calendar, feature: null },
  { name: 'Products', href: '/products', icon: Package, feature: null },
  { name: 'Documents', href: '/documents', icon: FileText, feature: null },
]

export function AppShell({ children, profile, company, entitlements }: AppShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const { theme, setTheme } = useTheme()
  const entSet = new Set(entitlements)

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    toast.success('Signed out successfully')
    router.push('/sign-in')
    router.refresh()
  }

  const filteredNav = navigation.filter(item => !item.feature || entSet.has(item.feature))

  const NavItems = () => (
    <>
      {filteredNav.map((item) => {
        const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
        return (
          <Link
            key={item.name}
            href={item.href}
            onClick={() => setIsOpen(false)}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent',
              isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.name}
          </Link>
        )
      })}
      {(profile.role === 'admin' || profile.role === 'super_admin') && (
        <Link
          href="/admin"
          onClick={() => setIsOpen(false)}
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent',
            pathname?.startsWith('/admin') ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'
          )}
        >
          <Building2 className="h-4 w-4" />
          {profile.role === 'super_admin' ? 'HQ Admin' : 'Admin Panel'}
        </Link>
      )}
    </>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside className="hidden w-64 flex-col border-r bg-card md:flex">
        <div className="flex h-20 items-center justify-center border-b px-4">
          {company?.logo_url ? (
            <img src={company.logo_url} alt={company.name} className="h-12 object-contain" />
          ) : (
            <h1 className="text-lg font-semibold text-foreground">{company?.name || 'HyperCRM'}</h1>
          )}
        </div>
        <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
          <NavItems />
        </nav>
        {company && (company.address || company.phone || company.email) && (
          <div className="border-t bg-muted/50 p-4">
            <h3 className="text-xs font-semibold text-muted-foreground mb-3">CONTACT INFO</h3>
            <div className="space-y-2 text-xs text-muted-foreground">
              {company.address && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0 text-blue-600" />
                  <span className="leading-relaxed">{company.address}</span>
                </div>
              )}
              {company.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-3 w-3 flex-shrink-0 text-blue-600" />
                  <a href={`tel:${company.phone}`} className="hover:text-blue-600 transition-colors">
                    {company.phone}
                  </a>
                </div>
              )}
              {company.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-3 w-3 flex-shrink-0 text-blue-600" />
                  <a href={`mailto:${company.email}`} className="hover:text-blue-600 transition-colors">
                    {company.email}
                  </a>
                </div>
              )}
              {company.website && (
                <div className="flex items-center gap-2">
                  <Globe className="h-3 w-3 flex-shrink-0 text-blue-600" />
                  <a href={company.website.startsWith('http') ? company.website : `https://${company.website}`} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors">
                    {company.website}
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
        <div className="border-t p-4 space-y-2">
          <div className="mb-2 text-xs text-muted-foreground">
            {profile.full_name || profile.email}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
            {theme === 'dark' ? 'Light' : 'Dark'} Mode
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={handleSignOut}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center gap-4 border-b bg-card px-4 md:px-6">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <div className="flex h-14 items-center border-b px-4">
                <h1 className="text-lg font-semibold">{company?.name || 'HyperCRM'}</h1>
              </div>
              <nav className="flex-1 space-y-1 p-4">
                <NavItems />
              </nav>
              <div className="border-t p-4">
                <div className="mb-2 text-xs text-muted-foreground">
                  {profile.full_name || profile.email}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={handleSignOut}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </Button>
              </div>
            </SheetContent>
          </Sheet>
          <div className="flex-1" />
        </header>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
