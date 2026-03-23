'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Users, TrendingUp, Target, UserPlus, Settings, Building2, Upload, FileText, AlertCircle, CheckCircle2, DollarSign, Activity, MapPin, Package, CreditCard, Crown, Mail, User, Phone } from 'lucide-react'
import { toast } from 'sonner'
import { Alert, AlertDescription } from '@/components/ui/alert'

type Profile = {
  id: string
  full_name: string | null
  email: string | null
  role: string
  company_id: string
  phone: string | null
}

type Contact = {
  id: string
  full_name: string | null
  email: string | null
  phone1: string | null
  status: string | null
  broker_id: string | null
  assigned_to: string | null
  lead_source: string | null
  created_at: string
  profiles: {
    full_name: string | null
  } | null
}

type BrokerStats = {
  broker: Profile
  totalContacts: number
  activeContacts: number
  conversions: number
  lastActivity: string
  revenue?: number
  leadTypes: {
    'AI booked calls': number
    'AI Qualified': number
    'AI Handraised': number
    'Newsletter Leads': number
    'Other': number
  }
}

type Company = {
  id: string
  name: string
  email: string | null
  website: string | null
  primary_color: string | null
  data_region: string
  created_at: string
  location: string | null
  city: string | null
  country: string | null
  logo_url: string | null
  subscription_level: string | null
  monthly_charge: number | null
  billing_status: string | null
  bolt_ons: any[] | null
  product_categories: string[] | null
}

type CompanyStats = {
  company: Company
  adminCount: number
  brokerCount: number
  managerCount: number
  totalUsers: number
  contactCount: number
}

type CSVRow = {
  full_name?: string
  email?: string
  phone1?: string
  phone2?: string
  location?: string
  nationality?: string
  age?: string
  job_title?: string
  [key: string]: string | undefined
}

export default function AdminPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<Profile | null>(null)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [brokers, setBrokers] = useState<Profile[]>([])
  const [allUsers, setAllUsers] = useState<Profile[]>([])
  const [unassignedLeads, setUnassignedLeads] = useState<Contact[]>([])
  const [allContacts, setAllContacts] = useState<Contact[]>([])
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([])
  const [selectedLeadType, setSelectedLeadType] = useState<string>('all')
  const [brokerStats, setBrokerStats] = useState<BrokerStats[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [companyStats, setCompanyStats] = useState<CompanyStats[]>([])
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [colorInput, setColorInput] = useState('')
  const [importDialog, setImportDialog] = useState(false)
  const [csvFile, setCSVFile] = useState<File | null>(null)
  const [csvData, setCSVData] = useState<CSVRow[]>([])
  const [importing, setImporting] = useState(false)
  const [importResults, setImportResults] = useState<{ success: number; failed: number } | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    title: string
    description: string
    action: () => void
  }>({
    open: false,
    title: '',
    description: '',
    action: () => {}
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/sign-in')
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()

    if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
      router.push('/dashboard')
      return
    }

    setCurrentUser(profile)
    setIsSuperAdmin(profile.role === 'super_admin')

    if (profile.role === 'super_admin') {
      console.log('🔍 Loading companies as super admin...')
      console.log('User object:', user)
      console.log('Profile role:', profile.role)
      console.log('User app_metadata:', user.app_metadata)
      console.log('User user_metadata:', user.user_metadata)

      // Check what JWT Supabase actually sees
      const { data: jwtDebug } = await supabase.rpc('debug_jwt_claims')
      console.log('🔑 JWT as seen by Supabase RLS:', jwtDebug)

      const { data: companiesData, error: companiesError } = await supabase
        .from('companies')
        .select('*')
        .neq('id', '99999999-9999-9999-9999-999999999999')
        .order('created_at', { ascending: false })

      console.log('Companies query result:', { companiesData, companiesError })
      if (companiesError) {
        console.error('❌ ERROR DETAILS:', JSON.stringify(companiesError, null, 2))
      }
      if (companiesData) {
        console.log('Companies data:', JSON.stringify(companiesData, null, 2))
      }

      if (companiesError) {
        console.error('❌ Error loading companies:', companiesError)
        toast.error('Failed to load companies. Please sign out and back in.')
      }

      if (companiesData) {
        console.log('✅ Loaded companies:', companiesData.length)
        setCompanies(companiesData)
        await loadCompanyStats(companiesData)
      }
    }

    console.log('Loading brokers for company:', profile.company_id)
    const { data: brokersData, error: brokersError } = await supabase
      .from('profiles')
      .select('*')
      .eq('company_id', profile.company_id)
      .eq('role', 'broker')
      .order('full_name', { ascending: true })

    console.log('Brokers result:', { brokersData, brokersError })
    if (brokersError) {
      console.error('Error loading brokers:', brokersError)
      toast.error('Failed to load brokers')
    }
    if (brokersData) setBrokers(brokersData)

    // Load all users for company admin view
    console.log('Loading all users for company:', profile.company_id)
    const { data: allUsersData, error: allUsersError } = await supabase
      .from('profiles')
      .select('*')
      .eq('company_id', profile.company_id)
      .order('role', { ascending: true })
      .order('full_name', { ascending: true })

    console.log('All users result:', { allUsersData, allUsersError })
    if (allUsersError) {
      console.error('Error loading all users:', allUsersError)
      toast.error('Failed to load team members')
    }
    if (allUsersData) setAllUsers(allUsersData)

    console.log('Loading unassigned leads for company:', profile.company_id)
    const { data: leadsData, error: leadsError } = await supabase
      .from('contacts')
      .select('*, profiles!contacts_assigned_to_fkey(full_name)')
      .eq('company_id', profile.company_id)
      .eq('status', 'Unassigned')
      .is('assigned_to', null)
      .order('created_at', { ascending: false })

    console.log('Unassigned leads result:', { leadsData, leadsError, count: leadsData?.length })
    if (leadsError) {
      console.error('Error loading unassigned leads:', leadsError)
      toast.error('Failed to load unassigned leads')
    }
    if (leadsData) {
      console.log('✅ Setting unassigned leads:', leadsData.length)
      setUnassignedLeads(leadsData)
    }

    const { data: contactsData } = await supabase
      .from('contacts')
      .select('*, profiles!contacts_assigned_to_fkey(full_name)')
      .eq('company_id', profile.company_id)
      .order('created_at', { ascending: false })

    if (contactsData) {
      setAllContacts(contactsData)
      setFilteredContacts(contactsData)
    }

    await loadBrokerStats(profile.company_id)
    setLoading(false)
  }

  async function loadCompanyStats(companies: Company[]) {
    console.log('📊 Loading stats for', companies.length, 'companies')
    const supabase = createClient()
    const stats: CompanyStats[] = []

    for (const company of companies) {
      console.log('Loading stats for:', company.name)

      const { count: adminCount, error: adminError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', company.id)
        .eq('role', 'admin')

      const { count: brokerCount, error: brokerError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', company.id)
        .eq('role', 'broker')

      const { count: managerCount, error: managerError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', company.id)
        .eq('role', 'manager')

      const { count: totalUsers, error: usersError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', company.id)

      const { count: contactCount, error: contactError } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', company.id)

      if (adminError || brokerError || managerError || usersError || contactError) {
        console.error('Error loading stats for', company.name, {
          adminError, brokerError, managerError, usersError, contactError
        })
      }

      stats.push({
        company,
        adminCount: adminCount || 0,
        brokerCount: brokerCount || 0,
        managerCount: managerCount || 0,
        totalUsers: totalUsers || 0,
        contactCount: contactCount || 0
      })
    }

    console.log('✅ Stats loaded:', stats)
    setCompanyStats(stats)
  }

  async function loadBrokerStats(companyId: string) {
    const supabase = createClient()

    const { data: brokersData } = await supabase
      .from('profiles')
      .select('*')
      .eq('company_id', companyId)
      .eq('role', 'broker')

    if (!brokersData) return

    const stats: BrokerStats[] = []

    for (const broker of brokersData) {
      const { count: totalContacts } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_to', broker.id)

      const { count: activeContacts } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_to', broker.id)
        .in('status', ['Fresh Lead', 'Call Backs', 'KYC In', 'Apps In'])

      const { count: conversions } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_to', broker.id)
        .in('status', ['Paid Client', 'Banked', 'Fronted'])

      const { data: lastContact } = await supabase
        .from('contacts')
        .select('created_at')
        .eq('assigned_to', broker.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      const { data: leadsByType } = await supabase
        .from('contacts')
        .select('lead_source')
        .eq('assigned_to', broker.id)

      const leadTypes = {
        'AI booked calls': 0,
        'AI Qualified': 0,
        'AI Handraised': 0,
        'Newsletter Leads': 0,
        'Other': 0
      }

      leadsByType?.forEach(lead => {
        const source = lead.lead_source
        if (source === 'AI booked calls' || source === 'AI Qualified' ||
            source === 'AI Handraised' || source === 'Newsletter Leads') {
          leadTypes[source as keyof typeof leadTypes]++
        } else {
          leadTypes['Other']++
        }
      })

      stats.push({
        broker,
        totalContacts: totalContacts || 0,
        activeContacts: activeContacts || 0,
        conversions: conversions || 0,
        lastActivity: lastContact?.created_at || broker.created_at,
        leadTypes
      })
    }

    stats.sort((a, b) => b.totalContacts - a.totalContacts)
    setBrokerStats(stats)
  }

  async function assignLead(leadId: string, brokerId: string) {
    const supabase = createClient()

    const { data: contact } = await supabase
      .from('contacts')
      .select('assigned_to, status')
      .eq('id', leadId)
      .maybeSingle()

    const isReassignment = contact?.assigned_to !== null
    const updateData: any = { assigned_to: brokerId }

    if (contact?.status === 'Unassigned') {
      updateData.status = 'Fresh Lead'
    }

    const { error } = await supabase
      .from('contacts')
      .update(updateData)
      .eq('id', leadId)

    if (error) {
      toast.error(isReassignment ? 'Failed to reassign contact' : 'Failed to assign lead')
    } else {
      toast.success(isReassignment ? 'Contact reassigned successfully' : 'Lead assigned successfully')
      loadData()
    }
  }

  function confirmBulkAssign(leadIds: string[], brokerId: string) {
    const broker = brokers.find(b => b.id === brokerId)
    setConfirmDialog({
      open: true,
      title: 'Confirm Bulk Assignment',
      description: `Are you sure you want to assign ${leadIds.length} leads to ${broker?.full_name || 'this broker'}?`,
      action: () => bulkAssignLeads(leadIds, brokerId)
    })
  }

  async function bulkAssignLeads(leadIds: string[], brokerId: string) {
    setConfirmDialog({ ...confirmDialog, open: false })
    const supabase = createClient()

    const { data: contacts } = await supabase
      .from('contacts')
      .select('id, status')
      .in('id', leadIds)

    let successCount = 0

    for (const contact of contacts || []) {
      const updateData: any = { assigned_to: brokerId }

      if (contact.status === 'Unassigned') {
        updateData.status = 'Fresh Lead'
      }

      const { error } = await supabase
        .from('contacts')
        .update(updateData)
        .eq('id', contact.id)

      if (!error) {
        successCount++
      }
    }

    if (successCount > 0) {
      toast.success(`Successfully assigned ${successCount} leads`)
      loadData()
    } else {
      toast.error('Failed to assign leads')
    }
  }

  function confirmDistributeEqually(leadIds: string[]) {
    setConfirmDialog({
      open: true,
      title: 'Confirm Equal Distribution',
      description: `Are you sure you want to distribute ${leadIds.length} leads equally among ${brokers.length} brokers? This action will assign leads automatically.`,
      action: () => distributeLeadsEqually(leadIds)
    })
  }

  async function distributeLeadsEqually(leadIds: string[]) {
    setConfirmDialog({ ...confirmDialog, open: false })
    if (brokers.length === 0) {
      toast.error('No brokers available')
      return
    }

    const leadsPerBroker = Math.floor(leadIds.length / brokers.length)
    const remainder = leadIds.length % brokers.length

    const supabase = createClient()
    let assigned = 0

    for (let i = 0; i < brokers.length; i++) {
      const start = i * leadsPerBroker + Math.min(i, remainder)
      const end = start + leadsPerBroker + (i < remainder ? 1 : 0)
      const brokerLeads = leadIds.slice(start, end)

      if (brokerLeads.length > 0) {
        const { data: contacts } = await supabase
          .from('contacts')
          .select('id, status')
          .in('id', brokerLeads)

        for (const contact of contacts || []) {
          const updateData: any = { assigned_to: brokers[i].id }

          if (contact.status === 'Unassigned') {
            updateData.status = 'Fresh Lead'
          }

          const { error } = await supabase
            .from('contacts')
            .update(updateData)
            .eq('id', contact.id)

          if (!error) {
            assigned++
          }
        }
      }
    }

    if (assigned > 0) {
      toast.success(`Distributed ${assigned} leads equally among ${brokers.length} brokers`)
      loadData()
    } else {
      toast.error('Failed to distribute leads')
    }
  }

  function filterContacts(leadType: string) {
    setSelectedLeadType(leadType)
    if (leadType === 'all') {
      setFilteredContacts(allContacts)
    } else if (leadType === 'unassigned') {
      setFilteredContacts(allContacts.filter(c => c.status === 'Unassigned' && c.assigned_to === null))
    } else {
      setFilteredContacts(allContacts.filter(c => c.lead_source === leadType))
    }
  }

  function getLeadTypeBadge(leadSource: string | null) {
    const colors: Record<string, string> = {
      'AI booked calls': 'bg-green-100 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300',
      'AI Qualified': 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300',
      'AI Handraised': 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300',
      'Newsletter Leads': 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300'
    }

    const color = colors[leadSource || ''] || 'bg-gray-100 text-gray-700 border-gray-200'
    const label = leadSource || 'Other'

    return <Badge variant="outline" className={`text-xs ${color}`}>{label}</Badge>
  }

  async function updateCompanyColor(companyId: string, color: string) {
    if (!isSuperAdmin) return

    const supabase = createClient()

    const { error } = await supabase
      .from('companies')
      .update({ primary_color: color })
      .eq('id', companyId)

    if (error) {
      toast.error('Failed to update color')
    } else {
      toast.success('Company color updated')
      loadData()
    }
  }

  function parseCSV(text: string): CSVRow[] {
    const lines = text.split('\n').filter(line => line.trim())
    if (lines.length < 2) return []

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_'))
    const rows: CSVRow[] = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim())
      const row: CSVRow = {}

      headers.forEach((header, index) => {
        if (values[index]) {
          row[header] = values[index]
        }
      })

      if (row.full_name || row.email || row.phone1) {
        rows.push(row)
      }
    }

    return rows
  }

  function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    setCSVFile(file)
    const reader = new FileReader()

    reader.onload = (e) => {
      const text = e.target?.result as string
      const parsed = parseCSV(text)
      setCSVData(parsed)

      if (parsed.length === 0) {
        toast.error('No valid data found in CSV file')
      } else {
        toast.success(`Found ${parsed.length} leads to import`)
      }
    }

    reader.readAsText(file)
  }

  async function importLeads() {
    if (!currentUser || csvData.length === 0) return

    setImporting(true)
    const supabase = createClient()

    let successCount = 0
    let failedCount = 0

    for (const row of csvData) {
      const contactData = {
        company_id: currentUser.company_id,
        full_name: row.full_name || row.name || 'Unknown',
        email: row.email || null,
        phone1: row.phone1 || row.phone || null,
        phone2: row.phone2 || null,
        location: row.location || row.city || null,
        nationality: row.nationality || row.country || null,
        age: row.age ? parseInt(row.age) : null,
        job_title: row.job_title || row.title || null,
        status: 'Unassigned',
        assigned_to: null,
        created_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('contacts')
        .insert(contactData)

      if (error) {
        console.error('Failed to import:', row, error)
        failedCount++
      } else {
        successCount++
      }
    }

    setImporting(false)
    setImportResults({ success: successCount, failed: failedCount })

    if (successCount > 0) {
      toast.success(`Successfully imported ${successCount} leads`)
      loadData()
      setCSVData([])
      setCSVFile(null)
    }

    if (failedCount > 0) {
      toast.error(`Failed to import ${failedCount} leads`)
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading admin panel...</p>
        </div>
      </div>
    )
  }

  const totalContacts = brokerStats.reduce((sum, stat) => sum + stat.totalContacts, 0)
  const totalActive = brokerStats.reduce((sum, stat) => sum + stat.activeContacts, 0)
  const totalConversions = brokerStats.reduce((sum, stat) => sum + stat.conversions, 0)
  const conversionRate = totalContacts > 0 ? ((totalConversions / totalContacts) * 100).toFixed(1) : '0'

  return (
    <div className="flex-1 p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between p-6 rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-background border shadow-sm">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            {isSuperAdmin ? 'Super Admin Panel' : 'Admin Dashboard'}
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            {isSuperAdmin
              ? 'Manage all companies, configurations, and system settings'
              : 'Complete operations overview and team management'}
          </p>
        </div>
        <Badge
          variant={isSuperAdmin ? 'default' : 'secondary'}
          className={`text-sm px-4 py-2 font-semibold ${isSuperAdmin ? 'bg-gradient-to-r from-primary to-primary/80 shadow-md' : ''}`}
        >
          {isSuperAdmin ? '⚡ Super Admin' : 'Admin'}
        </Badge>
      </div>

      <div className="mb-6 grid gap-3 md:grid-cols-2">
        <Button
          onClick={() => router.push('/admin/email')}
          size="lg"
          className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-lg"
        >
          <Mail className="h-5 w-5 mr-2" />
          Email Management
        </Button>
        <Button
          onClick={() => router.push('/admin/performance')}
          size="lg"
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg"
        >
          <Activity className="h-5 w-5 mr-2" />
          Performance Reports
        </Button>
      </div>

      <Tabs defaultValue={isSuperAdmin ? "companies" : "overview"} className="space-y-6">
        <TabsList>
          {isSuperAdmin && <TabsTrigger value="companies">Companies</TabsTrigger>}
          <TabsTrigger value="overview">{isSuperAdmin ? 'System Overview' : 'Operations Overview'}</TabsTrigger>
          <TabsTrigger value="import">Import Leads</TabsTrigger>
          <TabsTrigger value="distribution">Lead Distribution</TabsTrigger>
          <TabsTrigger value="reassign">Reassign Contacts</TabsTrigger>
          <TabsTrigger value="brokers">Broker Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {!isSuperAdmin && (
            <div className="mb-6">
              <h2 className="text-2xl font-bold">Company Dashboard</h2>
              <p className="text-muted-foreground">Overview of all users and contacts in your company</p>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-2 hover:shadow-lg transition-all duration-300 hover:border-blue-200 dark:hover:border-blue-900">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950">
                  <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold bg-gradient-to-br from-blue-600 to-cyan-600 bg-clip-text text-transparent">{allUsers.length}</div>
                <p className="text-xs text-muted-foreground mt-1 font-medium">Active team members</p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:shadow-lg transition-all duration-300 hover:border-purple-200 dark:hover:border-purple-900">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Pipeline</CardTitle>
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-950">
                  <Target className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold bg-gradient-to-br from-purple-600 to-pink-600 bg-clip-text text-transparent">{totalContacts}</div>
                <p className="text-xs text-muted-foreground mt-1 font-medium">All contacts in system</p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:shadow-lg transition-all duration-300 hover:border-orange-200 dark:hover:border-orange-900">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Deals</CardTitle>
                <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-950">
                  <Activity className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold bg-gradient-to-br from-orange-600 to-amber-600 bg-clip-text text-transparent">{totalActive}</div>
                <p className="text-xs text-muted-foreground mt-1 font-medium">Currently in pipeline</p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:shadow-lg transition-all duration-300 hover:border-green-200 dark:hover:border-green-900">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Conversions</CardTitle>
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-950">
                  <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold bg-gradient-to-br from-green-600 to-emerald-600 bg-clip-text text-transparent">{totalConversions}</div>
                <p className="text-xs text-muted-foreground mt-1 font-medium">{conversionRate}% conversion rate</p>
              </CardContent>
            </Card>
          </div>

          {!isSuperAdmin && (
            <Card>
              <CardHeader>
                <CardTitle>All Team Members</CardTitle>
                <CardDescription>Complete list of users in your company ({allUsers.length} total)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {allUsers.map((user) => {
                    const stat = brokerStats.find(s => s.broker.id === user.id)
                    const roleColors: Record<string, string> = {
                      admin: 'bg-red-100 text-red-700 border-red-200',
                      manager: 'bg-orange-100 text-orange-700 border-orange-200',
                      broker: 'bg-blue-100 text-blue-700 border-blue-200'
                    }

                    return (
                      <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">{user.full_name || 'No name'}</p>
                            <Badge className={roleColors[user.role] || ''}>
                              {user.role}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{user.email}</p>
                        </div>
                        {stat && (
                          <div className="text-right space-y-1">
                            <p className="text-sm font-medium">{stat.totalContacts} contacts</p>
                            <div className="flex gap-2 text-xs text-muted-foreground">
                              <span>{stat.activeContacts} active</span>
                              <span>•</span>
                              <span className="text-green-600">{stat.conversions} won</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-6 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Unassigned Leads</CardTitle>
                <CardDescription>Leads awaiting broker assignment</CardDescription>
              </CardHeader>
              <CardContent>
                {unassignedLeads.length === 0 ? (
                  <div className="text-center py-6">
                    <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">All leads assigned</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="p-4 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 rounded-lg border border-orange-200 dark:border-orange-900">
                      <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">{unassignedLeads.length}</div>
                      <div className="text-sm text-orange-700 dark:text-orange-300 mt-1">Unassigned</div>
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {unassignedLeads.slice(0, 5).map((lead) => (
                        <div key={lead.id} className="flex items-center justify-between text-sm p-2 border rounded hover:bg-muted/50">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{lead.full_name || 'No name'}</p>
                            <div className="flex items-center gap-1 mt-0.5">
                              {getLeadTypeBadge(lead.lead_source)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {unassignedLeads.length > 5 && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => {
                          const tabs = document.querySelector('[role="tablist"]') as HTMLElement
                          const distributionTab = tabs?.querySelector('[value="distribution"]') as HTMLElement
                          distributionTab?.click()
                        }}
                      >
                        View all {unassignedLeads.length} leads
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Performers</CardTitle>
                <CardDescription>Highest performing brokers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {brokerStats.slice(0, 5).map((stat) => (
                    <div key={stat.broker.id} className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium">{stat.broker.full_name || stat.broker.email}</p>
                        <p className="text-xs text-muted-foreground">
                          {stat.totalContacts} contacts • {stat.conversions} conversions
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant={stat.activeContacts > 0 ? 'default' : 'secondary'}>
                          {stat.activeContacts} active
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest contacts (last 10)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {allContacts.slice(0, 10).map((contact) => (
                    <div key={contact.id} className="flex items-center justify-between text-sm">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          <p className="font-medium truncate">{contact.full_name || 'No name'}</p>
                          {getLeadTypeBadge(contact.lead_source)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {contact.profiles?.full_name || 'Unassigned'}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs ml-2">
                        {contact.status || 'Fresh Lead'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {isSuperAdmin && (
          <TabsContent value="companies" className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold">Client Companies</h2>
                <p className="text-muted-foreground">Manage your client companies and their subscriptions</p>
              </div>
              <Button onClick={() => router.push('/admin/companies/new')}>
                <Building2 className="h-4 w-4 mr-2" />
                Onboard New Company
              </Button>
            </div>
            <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
              {companyStats.map((stat) => {
                const company = stat.company
                const subscriptionColors: Record<string, string> = {
                  enterprise: 'text-purple-500',
                  professional: 'text-blue-500',
                  standard: 'text-gray-500'
                }
                return (
                  <Card key={company.id} className="overflow-hidden hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/20">
                    <div
                      className="h-1.5 bg-gradient-to-r"
                      style={{
                        backgroundImage: `linear-gradient(to right, ${company.primary_color || '#3b82f6'}, ${company.primary_color || '#3b82f6'}dd)`
                      }}
                    />
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            {company.logo_url ? (
                              <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex items-center justify-center border shadow-sm">
                                <img
                                  src={company.logo_url}
                                  alt={company.name}
                                  className="w-full h-full object-contain p-1"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    e.currentTarget.parentElement!.innerHTML = `<div class="w-10 h-10 rounded-lg flex items-center justify-center" style="background-color: ${company.primary_color || '#3b82f6'}20"><svg class="w-6 h-6" style="color: ${company.primary_color || '#3b82f6'}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg></div>`;
                                  }}
                                />
                              </div>
                            ) : (
                              <div
                                className="w-12 h-12 rounded-lg flex items-center justify-center shadow-sm"
                                style={{ backgroundColor: `${company.primary_color || '#3b82f6'}15` }}
                              >
                                <Building2 className="h-6 w-6" style={{ color: company.primary_color || '#3b82f6' }} />
                              </div>
                            )}
                            {company.subscription_level === 'enterprise' && (
                              <div className="flex items-center gap-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-0.5 rounded-full text-xs font-semibold shadow-md">
                                <Crown className="h-3 w-3" />
                                <span>Enterprise</span>
                              </div>
                            )}
                          </div>
                          <CardTitle className="text-xl font-bold">{company.name}</CardTitle>
                          <CardDescription className="mt-1 flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5" />
                            {company.city || 'Location not set'}
                          </CardDescription>
                        </div>
                        <Badge
                          variant={company.billing_status === 'active' ? 'default' : 'secondary'}
                          className="capitalize font-semibold"
                        >
                          {company.billing_status || 'active'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-4">
                      <div className="grid grid-cols-3 gap-2 p-4 bg-gradient-to-br from-muted/30 to-muted/60 rounded-xl border">
                        <div className="text-center">
                          <div className="text-2xl font-bold bg-gradient-to-br from-red-500 to-rose-600 bg-clip-text text-transparent">{stat.adminCount}</div>
                          <div className="text-xs font-medium text-muted-foreground mt-1">Admins</div>
                        </div>
                        <div className="text-center border-x border-border/50">
                          <div className="text-2xl font-bold bg-gradient-to-br from-blue-500 to-cyan-600 bg-clip-text text-transparent">{stat.brokerCount}</div>
                          <div className="text-xs font-medium text-muted-foreground mt-1">Brokers</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold bg-gradient-to-br from-green-500 to-emerald-600 bg-clip-text text-transparent">{stat.managerCount}</div>
                          <div className="text-xs font-medium text-muted-foreground mt-1">Managers</div>
                        </div>
                      </div>

                      <div className="space-y-3 text-sm">
                        <div className="flex items-start gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                          <Package className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs text-muted-foreground mb-1">Products</div>
                            <div className="flex flex-wrap gap-1">
                              {company.product_categories && company.product_categories.length > 0 ? (
                                company.product_categories.map((product, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs font-medium">
                                    {product}
                                  </Badge>
                                ))
                              ) : (
                                <span className="text-xs text-muted-foreground italic">None configured</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border">
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">Subscription</span>
                          </div>
                          <span className={`font-bold capitalize text-sm ${subscriptionColors[company.subscription_level || 'standard']}`}>
                            {company.subscription_level || 'standard'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/10">
                          <span className="text-sm font-medium text-muted-foreground">Monthly Revenue</span>
                          <span className="text-xl font-bold" style={{ color: company.primary_color || '#3b82f6' }}>
                            £{(company.monthly_charge || 0).toFixed(2)}
                          </span>
                        </div>

                        {company.bolt_ons && Array.isArray(company.bolt_ons) && company.bolt_ons.length > 0 && (
                          <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900">
                            <div className="text-xs font-semibold text-amber-900 dark:text-amber-100 mb-1.5">Active Bolt-ons</div>
                            <div className="flex flex-wrap gap-1">
                              {company.bolt_ons.map((addon, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs bg-amber-100 dark:bg-amber-900 text-amber-900 dark:text-amber-100">
                                  {addon}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="pt-2 border-t grid grid-cols-2 gap-2">
                          <div className="p-2 rounded-lg bg-muted/30">
                            <div className="text-xs text-muted-foreground">Total Users</div>
                            <div className="text-lg font-bold mt-0.5">{stat.totalUsers}</div>
                          </div>
                          <div className="p-2 rounded-lg bg-muted/30">
                            <div className="text-xs text-muted-foreground">Total Contacts</div>
                            <div className="text-lg font-bold mt-0.5">{stat.contactCount}</div>
                          </div>
                        </div>
                      </div>

                      <Button
                        variant="default"
                        size="default"
                        className="w-full mt-2 font-semibold shadow-md hover:shadow-lg transition-all"
                        onClick={() => router.push(`/admin/companies/${company.id}`)}
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Manage Company
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>
        )}

        <TabsContent value="import" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Import Leads from CSV</CardTitle>
              <CardDescription>
                Upload a CSV file to import multiple leads at once. No data will be lost.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>CSV Format:</strong> Include columns: full_name, email, phone1, phone2, location, nationality, age, job_title
                  <br />
                  <strong>Example:</strong> full_name,email,phone1,location,age
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Input
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    disabled={importing}
                  />
                  {csvFile && (
                    <Badge variant="outline">
                      <FileText className="h-3 w-3 mr-1" />
                      {csvFile.name}
                    </Badge>
                  )}
                </div>

                {csvData.length > 0 && (
                  <div className="space-y-4">
                    <Alert>
                      <CheckCircle2 className="h-4 w-4" />
                      <AlertDescription>
                        Ready to import <strong>{csvData.length}</strong> leads. All data will be preserved.
                      </AlertDescription>
                    </Alert>

                    <div className="border rounded-lg p-4 max-h-64 overflow-auto">
                      <p className="text-sm font-medium mb-2">Preview (first 5 rows):</p>
                      {csvData.slice(0, 5).map((row, idx) => (
                        <div key={idx} className="text-sm py-1 border-b last:border-0">
                          <strong>{row.full_name || 'Unknown'}</strong>
                          {row.email && ` • ${row.email}`}
                          {row.phone1 && ` • ${row.phone1}`}
                        </div>
                      ))}
                    </div>

                    <Button
                      onClick={importLeads}
                      disabled={importing}
                      className="w-full"
                      size="lg"
                    >
                      {importing ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Importing...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Import {csvData.length} Leads
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {importResults && (
                  <Alert>
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Import Complete!</strong>
                      <br />
                      Successfully imported: {importResults.success}
                      {importResults.failed > 0 && <> • Failed: {importResults.failed}</>}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution" className="space-y-6">
          <div className="grid gap-6">
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-500 rounded-xl">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Unassigned Leads</p>
                      <p className="text-3xl font-bold">{unassignedLeads.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-green-500 rounded-xl">
                      <TrendingUp className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Active Brokers</p>
                      <p className="text-3xl font-bold">{brokers.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-500 rounded-xl">
                      <Target className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Assigned Today</p>
                      <p className="text-3xl font-bold">0</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-2 shadow-lg">
              <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-900 dark:to-gray-900">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl flex items-center gap-2">
                      <Users className="h-6 w-6 text-primary" />
                      Unassigned Leads Pool
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {unassignedLeads.length} leads waiting to be assigned • Click to assign individually or distribute equally
                    </CardDescription>
                  </div>
                  {unassignedLeads.length > 0 && (
                    <Button
                      onClick={() => confirmDistributeEqually(unassignedLeads.map(l => l.id))}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                      size="lg"
                    >
                      <Target className="h-4 w-4 mr-2" />
                      Distribute Equally
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {unassignedLeads.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="inline-flex p-4 bg-green-100 dark:bg-green-900 rounded-full mb-4">
                      <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">All Leads Assigned!</h3>
                    <p className="text-muted-foreground">There are no unassigned leads at the moment.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {unassignedLeads.map((lead) => (
                      <div
                        key={lead.id}
                        className="flex items-center justify-between p-5 border-2 rounded-xl hover:border-primary hover:bg-accent/30 transition-all group"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                              <User className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <p className="font-semibold text-lg">{lead.full_name || 'No name'}</p>
                              <div className="flex items-center gap-2 mt-1">
                                {getLeadTypeBadge(lead.lead_source)}
                                <Badge variant="outline" className="text-xs">
                                  {new Date(lead.created_at).toLocaleDateString()}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 ml-12 text-sm text-muted-foreground">
                            {lead.email && (
                              <div className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                <span>{lead.email}</span>
                              </div>
                            )}
                            {lead.phone1 && (
                              <div className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                <span>{lead.phone1}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <Select onValueChange={(brokerId) => assignLead(lead.id, brokerId)}>
                          <SelectTrigger className="w-[220px] border-2 hover:border-primary transition-colors">
                            <SelectValue placeholder="Select broker..." />
                          </SelectTrigger>
                          <SelectContent>
                            {brokers.map((broker) => (
                              <SelectItem key={broker.id} value={broker.id}>
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                  {broker.full_name || broker.email || 'Unknown'}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-2 shadow-lg">
              <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-900 dark:to-gray-900">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Lead Source Breakdown
                </CardTitle>
                <CardDescription>Unassigned leads by type</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {['AI booked calls', 'AI Qualified', 'AI Handraised', 'Newsletter Leads'].map((type) => {
                    const count = unassignedLeads.filter(l => l.lead_source === type).length
                    const percentage = unassignedLeads.length > 0 ? (count / unassignedLeads.length) * 100 : 0
                    const color = type === 'AI booked calls' ? 'bg-green-500' :
                                  type === 'AI Qualified' ? 'bg-blue-500' :
                                  type === 'AI Handraised' ? 'bg-purple-500' : 'bg-orange-500'
                    return (
                      <div key={type} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold">{type}</span>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="font-bold">{count}</Badge>
                            <span className="text-xs text-muted-foreground w-12 text-right">{percentage.toFixed(0)}%</span>
                          </div>
                        </div>
                        <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                          <div
                            className={`h-3 rounded-full transition-all duration-500 ${color}`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-2 shadow-lg">
            <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-900 dark:to-gray-900">
              <CardTitle className="text-2xl flex items-center gap-2">
                <Users className="h-6 w-6 text-primary" />
                Broker Load Distribution
              </CardTitle>
              <CardDescription>Current lead allocation across your team</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {brokerStats.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No broker statistics available</p>
                  </div>
                ) : (
                  brokerStats.map((stat) => (
                    <div key={stat.broker.id} className="p-5 border-2 rounded-xl hover:border-primary transition-all bg-gradient-to-r from-slate-50/50 to-gray-50/50 dark:from-slate-900/50 dark:to-gray-900/50">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary rounded-lg">
                            <User className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <p className="font-bold text-lg">{stat.broker.full_name || stat.broker.email}</p>
                            <p className="text-sm text-muted-foreground">
                              Managing {stat.totalContacts} {stat.totalContacts === 1 ? 'lead' : 'leads'}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-lg px-3 py-1 font-bold">
                          {stat.totalContacts}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                        <div className="p-3 rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-2 border-green-200 dark:border-green-900">
                          <div className="text-xs text-green-700 dark:text-green-300 font-semibold mb-1">AI Booked</div>
                          <div className="text-2xl font-bold text-green-700 dark:text-green-300">{stat.leadTypes['AI booked calls']}</div>
                        </div>
                        <div className="p-3 rounded-lg bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 border-2 border-blue-200 dark:border-blue-900">
                          <div className="text-xs text-blue-700 dark:text-blue-300 font-semibold mb-1">AI Qualified</div>
                          <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{stat.leadTypes['AI Qualified']}</div>
                        </div>
                        <div className="p-3 rounded-lg bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 border-2 border-purple-200 dark:border-purple-900">
                          <div className="text-xs text-purple-700 dark:text-purple-300 font-semibold mb-1">AI Handraised</div>
                          <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">{stat.leadTypes['AI Handraised']}</div>
                        </div>
                        <div className="p-3 rounded-lg bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950 dark:to-amber-950 border-2 border-orange-200 dark:border-orange-900">
                          <div className="text-xs text-orange-700 dark:text-orange-300 font-semibold mb-1">Newsletter</div>
                          <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">{stat.leadTypes['Newsletter Leads']}</div>
                        </div>
                        <div className="p-3 rounded-lg bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-950 dark:to-slate-950 border-2 border-gray-200 dark:border-gray-900">
                          <div className="text-xs text-gray-700 dark:text-gray-300 font-semibold mb-1">Other</div>
                          <div className="text-2xl font-bold text-gray-700 dark:text-gray-300">{stat.leadTypes['Other']}</div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reassign" className="space-y-6">
          <Card className="border-2 shadow-lg">
            <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-900 dark:to-gray-900">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <TrendingUp className="h-6 w-6 text-primary" />
                    Manage & Reassign Contacts
                  </CardTitle>
                  <CardDescription className="mt-2">
                    {filteredContacts.length} contacts {selectedLeadType !== 'all' ? `filtered by ${selectedLeadType}` : 'in total'}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Select value={selectedLeadType} onValueChange={filterContacts}>
                    <SelectTrigger className="w-[220px] border-2">
                      <SelectValue placeholder="Filter by lead type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                          All Leads
                        </div>
                      </SelectItem>
                      <SelectItem value="unassigned">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                          Unassigned Only
                        </div>
                      </SelectItem>
                      <SelectItem value="AI booked calls">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          AI Booked Calls
                        </div>
                      </SelectItem>
                      <SelectItem value="AI Qualified">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          AI Qualified
                        </div>
                      </SelectItem>
                      <SelectItem value="AI Handraised">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                          AI Handraised
                        </div>
                      </SelectItem>
                      <SelectItem value="Newsletter Leads">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                          Newsletter Leads
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {selectedLeadType !== 'all' && filteredContacts.length > 0 && (
                <div className="mb-6 p-5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-xl border-2 border-blue-200 dark:border-blue-900">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-500 rounded-lg">
                        <Target className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-lg">Bulk Actions</p>
                        <p className="text-sm text-muted-foreground">{filteredContacts.length} {selectedLeadType} leads selected</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Select onValueChange={(brokerId) => confirmBulkAssign(filteredContacts.map(c => c.id), brokerId)}>
                        <SelectTrigger className="w-[220px] border-2 bg-white dark:bg-slate-900">
                          <SelectValue placeholder="Assign all to..." />
                        </SelectTrigger>
                        <SelectContent>
                          {brokers.map((broker) => (
                            <SelectItem key={broker.id} value={broker.id}>
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                {broker.full_name || broker.email || 'Unknown'}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        onClick={() => confirmDistributeEqually(filteredContacts.map(c => c.id))}
                        className="border-2 bg-white dark:bg-slate-900"
                      >
                        <Target className="h-4 w-4 mr-2" />
                        Split Equally
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              {filteredContacts.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No contacts found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredContacts.map((contact) => (
                    <div
                      key={contact.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <p className="font-medium">{contact.full_name || 'No name'}</p>
                          <Badge variant="outline" className="text-xs">
                            {contact.status || 'Fresh Lead'}
                          </Badge>
                          {getLeadTypeBadge(contact.lead_source)}
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          <span>{contact.email || 'No email'}</span>
                          {contact.phone1 && <span>• {contact.phone1}</span>}
                          <span>• Created {new Date(contact.created_at).toLocaleDateString()}</span>
                        </div>
                        {contact.profiles?.full_name && (
                          <div className="mt-2">
                            <Badge variant="secondary" className="text-xs">
                              Currently assigned to: {contact.profiles.full_name}
                            </Badge>
                          </div>
                        )}
                        {!contact.profiles?.full_name && (
                          <div className="mt-2">
                            <Badge variant="outline" className="text-xs text-orange-600 border-orange-600">
                              Unassigned
                            </Badge>
                          </div>
                        )}
                      </div>
                      <Select
                        onValueChange={(brokerId) => assignLead(contact.id, brokerId)}
                        defaultValue={contact.profiles?.full_name ? undefined : undefined}
                      >
                        <SelectTrigger className="w-[220px]">
                          <SelectValue placeholder="Assign/Reassign broker" />
                        </SelectTrigger>
                        <SelectContent>
                          {brokers.map((broker) => (
                            <SelectItem key={broker.id} value={broker.id}>
                              {broker.full_name || broker.email || 'Unknown'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="brokers" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {brokerStats.map((stat) => (
              <Card key={stat.broker.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Users className="h-5 w-5 text-primary" />
                    <Badge variant="outline">Broker</Badge>
                  </div>
                  <CardTitle className="mt-4">
                    {stat.broker.full_name || stat.broker.email || 'Unknown'}
                  </CardTitle>
                  <CardDescription>{stat.broker.email}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Total Pipeline</span>
                      <span className="text-lg font-bold">{stat.totalContacts}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Active Deals</span>
                      <span className="text-lg font-bold text-primary">{stat.activeContacts}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Conversions</span>
                      <span className="text-lg font-bold text-green-500">{stat.conversions}</span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-sm text-muted-foreground">Success Rate</span>
                      <span className="text-sm font-bold">
                        {stat.totalContacts > 0
                          ? ((stat.conversions / stat.totalContacts) * 100).toFixed(1)
                          : '0'}%
                      </span>
                    </div>
                    <div className="pt-2 text-xs text-muted-foreground">
                      Last activity: {new Date(stat.lastActivity).toLocaleDateString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmDialog.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmDialog({ ...confirmDialog, open: false })}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDialog.action}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
