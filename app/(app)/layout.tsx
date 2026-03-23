'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AppShell } from '@/components/shell/app-shell'
import { toast } from 'sonner'

type Profile = {
  id: string
  company_id: string
  full_name: string | null
  email: string | null
  title: string | null
  role: 'super_admin' | 'admin' | 'manager' | 'broker' | 'viewer'
  created_at: string
  updated_at: string
}

type Company = {
  id: string
  name: string
  logo_url: string | null
  primary_color: string
  address: string | null
  phone: string | null
  email: string | null
  website: string | null
  data_region: string
  created_at: string
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [company, setCompany] = useState<Company | null>(null)
  const [entitlements, setEntitlements] = useState<string[]>([])

  useEffect(() => {
    let isMounted = true

    async function loadAuth() {
      try {
        const supabase = createClient()

        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
          console.error('Auth error:', userError)
          if (isMounted) router.push('/sign-in')
          return
        }

        console.log('Fetching profile for user:', user.id)
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle()

        console.log('Profile fetch result:', { profileData, profileError })

        if (profileError) {
          console.error('Profile error:', profileError)
          toast.error('Failed to load profile: ' + profileError.message)
          if (isMounted) router.push('/sign-in')
          return
        }

        if (!profileData) {
          console.error('No profile found for user:', user.id)
          toast.error('No profile found for your account')
          if (isMounted) router.push('/sign-in')
          return
        }

        if (isMounted) setProfile(profileData)

        const { data: companyData, error: companyError } = await supabase
          .from('companies')
          .select('*')
          .eq('id', profileData.company_id)
          .maybeSingle()

        if (companyError) {
          console.error('Company error:', companyError)
        }

        if (isMounted) setCompany(companyData)

        const { data: subscriptionData } = await supabase
          .from('company_subscriptions')
          .select('plan_id')
          .eq('company_id', profileData.company_id)
          .eq('status', 'active')
          .maybeSingle()

        if (subscriptionData) {
          const { data: planData } = await supabase
            .from('plans')
            .select('entitlements')
            .eq('id', subscriptionData.plan_id)
            .maybeSingle()

          if (planData?.entitlements && isMounted) {
            setEntitlements(planData.entitlements)
          }
        }

        if (isMounted) setLoading(false)
      } catch (error) {
        console.error('Unexpected error in loadAuth:', error)
        if (isMounted) {
          setLoading(false)
          router.push('/sign-in')
        }
      }
    }

    loadAuth()

    return () => {
      isMounted = false
    }
  }, [])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!profile) {
    return null
  }

  const companyName = company?.name || 'Your Company'

  return (
    <AppShell
      profile={profile}
      company={company || {
        id: profile.company_id,
        name: companyName,
        logo_url: null,
        primary_color: '#000000',
        address: null,
        phone: null,
        email: null,
        website: null,
        data_region: 'US',
        created_at: new Date().toISOString()
      }}
      entitlements={entitlements}
    >
      {children}
    </AppShell>
  )
}
