import { createClient } from './supabase/server'

export type Profile = {
  id: string
  company_id: string
  full_name: string | null
  email: string | null
  title: string | null
  role: 'super_admin' | 'admin' | 'manager' | 'broker' | 'viewer'
  created_at: string
  updated_at: string
}

export type Company = {
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

export async function getCurrentUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  return user
}

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient()
  const user = await getCurrentUser()

  if (!user) {
    return null
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  return profile
}

export async function getCurrentCompany(): Promise<Company | null> {
  const profile = await getCurrentProfile()

  if (!profile) {
    return null
  }

  const supabase = await createClient()
  const { data: company } = await supabase
    .from('companies')
    .select('*')
    .eq('id', profile.company_id)
    .maybeSingle()

  return company
}

export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }
  return user
}

export async function requireProfile() {
  const profile = await getCurrentProfile()
  if (!profile) {
    throw new Error('Unauthorized')
  }
  return profile
}

export async function requireRole(allowedRoles: Profile['role'][]) {
  const profile = await requireProfile()
  if (!allowedRoles.includes(profile.role)) {
    throw new Error('Forbidden')
  }
  return profile
}
