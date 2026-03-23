'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Save, Upload, Phone, MapPin, Mail, Globe, CreditCard, Package, Users, Target } from 'lucide-react'
import { toast } from 'sonner'

type Company = {
  id: string
  name: string
  email: string | null
  phone: string | null
  website: string | null
  location: string | null
  city: string | null
  country: string | null
  logo_url: string | null
  primary_color: string | null
  subscription_level: string | null
  monthly_charge: number | null
  billing_status: string | null
  bolt_ons: any[] | null
  product_categories: string[] | null
}

type Profile = {
  id: string
  full_name: string | null
  email: string
  role: string
  phone: string | null
  created_at: string
}

type Contact = {
  id: string
  first_name: string | null
  last_name: string | null
  email: string | null
  phone: string | null
  status: string | null
  estimated_value: number | null
  broker_id: string
}

export default function CompanyDetailPage() {
  const router = useRouter()
  const params = useParams()
  const companyId = params?.id as string

  const [loading, setLoading] = useState(true)
  const [company, setCompany] = useState<Company | null>(null)
  const [users, setUsers] = useState<Profile[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    website: '',
    location: '',
    city: '',
    country: '',
    primary_color: '',
    subscription_level: 'standard',
    monthly_charge: 0,
    billing_status: 'active',
    product_categories: [] as string[]
  })

  useEffect(() => {
    loadCompanyData()
  }, [companyId])

  async function loadCompanyData() {
    const supabase = createClient()
    setLoading(true)

    // Load company
    const { data: companyData } = await supabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .maybeSingle()

    if (!companyData) {
      toast.error('Company not found')
      router.push('/admin')
      return
    }

    setCompany(companyData)
    setFormData({
      name: companyData.name || '',
      email: companyData.email || '',
      phone: companyData.phone || '',
      website: companyData.website || '',
      location: companyData.location || '',
      city: companyData.city || '',
      country: companyData.country || '',
      primary_color: companyData.primary_color || '#3b82f6',
      subscription_level: companyData.subscription_level || 'standard',
      monthly_charge: companyData.monthly_charge || 0,
      billing_status: companyData.billing_status || 'active',
      product_categories: companyData.product_categories || []
    })

    // Load users
    const { data: usersData } = await supabase
      .from('profiles')
      .select('*')
      .eq('company_id', companyId)
      .order('role', { ascending: true })
      .order('full_name', { ascending: true })

    if (usersData) setUsers(usersData)

    // Load contacts with broker info
    const { data: contactsData } = await supabase
      .from('contacts')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })

    if (contactsData) setContacts(contactsData)

    setLoading(false)
  }

  async function handleSave() {
    setSaving(true)
    const supabase = createClient()

    const { error } = await supabase
      .from('companies')
      .update({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        website: formData.website,
        location: formData.location,
        city: formData.city,
        country: formData.country,
        primary_color: formData.primary_color,
        subscription_level: formData.subscription_level,
        monthly_charge: formData.monthly_charge,
        billing_status: formData.billing_status,
        product_categories: formData.product_categories
      })
      .eq('id', companyId)

    setSaving(false)

    if (error) {
      toast.error('Failed to update company')
    } else {
      toast.success('Company updated successfully')
      loadCompanyData()
    }
  }

  function addProductCategory(product: string) {
    if (product && !formData.product_categories.includes(product)) {
      setFormData({
        ...formData,
        product_categories: [...formData.product_categories, product]
      })
    }
  }

  function removeProductCategory(product: string) {
    setFormData({
      ...formData,
      product_categories: formData.product_categories.filter(p => p !== product)
    })
  }

  const roleColors: Record<string, string> = {
    admin: 'bg-red-100 text-red-700 border-red-200',
    manager: 'bg-orange-100 text-orange-700 border-orange-200',
    broker: 'bg-blue-100 text-blue-700 border-blue-200'
  }

  const getUserContactCount = (userId: string) => {
    return contacts.filter(c => c.broker_id === userId).length
  }

  const getUserPipelineValue = (userId: string) => {
    return contacts
      .filter(c => c.broker_id === userId)
      .reduce((sum, c) => sum + (c.estimated_value || 0), 0)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading company details...</p>
        </div>
      </div>
    )
  }

  if (!company) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/admin')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{company.name}</h1>
              <p className="text-muted-foreground">Manage company settings and users</p>
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
              <p className="text-xs text-muted-foreground">
                {users.filter(u => u.role === 'admin').length} admins, {users.filter(u => u.role === 'broker').length} brokers
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{contacts.length}</div>
              <p className="text-xs text-muted-foreground">
                Across all brokers
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pipeline Value</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                £{contacts.reduce((sum, c) => sum + (c.estimated_value || 0), 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">Total estimated value</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Charge</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">£{formData.monthly_charge.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground capitalize">{formData.subscription_level}</p>
            </CardContent>
          </Card>
        </div>

        {/* Company Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
            <CardDescription>Basic company details and contact information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Company Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="contact@company.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+44 20 7946 0958"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://company.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Full Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="123 Business Street"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="color">Brand Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="color"
                    type="color"
                    value={formData.primary_color}
                    onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                    className="w-20 h-10"
                  />
                  <Input
                    value={formData.primary_color}
                    onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                    placeholder="#3b82f6"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subscription & Products */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Subscription Details</CardTitle>
              <CardDescription>Billing and subscription information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subscription">Subscription Level</Label>
                <Select
                  value={formData.subscription_level}
                  onValueChange={(value) => setFormData({ ...formData, subscription_level: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="charge">Monthly Charge (£)</Label>
                <Input
                  id="charge"
                  type="number"
                  step="0.01"
                  value={formData.monthly_charge}
                  onChange={(e) => setFormData({ ...formData, monthly_charge: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Billing Status</Label>
                <Select
                  value={formData.billing_status}
                  onValueChange={(value) => setFormData({ ...formData, billing_status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Product Categories</CardTitle>
              <CardDescription>Asset classes this company sells</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {formData.product_categories.map((product, idx) => (
                  <Badge
                    key={idx}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => removeProductCategory(product)}
                  >
                    {product} ×
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Select onValueChange={addProductCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Add product category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Bonds">Bonds</SelectItem>
                    <SelectItem value="Managed Funds">Managed Funds</SelectItem>
                    <SelectItem value="IPOs">IPOs</SelectItem>
                    <SelectItem value="Gold Contracts">Gold Contracts</SelectItem>
                    <SelectItem value="Forex">Forex</SelectItem>
                    <SelectItem value="Crypto">Crypto</SelectItem>
                    <SelectItem value="Real Estate">Real Estate</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users List */}
        <Card>
          <CardHeader>
            <CardTitle>Company Users</CardTitle>
            <CardDescription>All users and their details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {users.map((user) => {
                const contactCount = getUserContactCount(user.id)
                const pipelineValue = getUserPipelineValue(user.id)

                return (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{user.full_name || 'No name'}</p>
                        <Badge className={roleColors[user.role] || ''}>
                          {user.role}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {user.email}
                        </span>
                        {user.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {user.phone}
                          </span>
                        )}
                      </div>
                    </div>
                    {user.role === 'broker' && (
                      <div className="text-right space-y-1">
                        <p className="text-sm font-medium">{contactCount} contacts</p>
                        <p className="text-xs text-muted-foreground">
                          £{pipelineValue.toLocaleString()} pipeline
                        </p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
