'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Users, TrendingUp, Calendar, Clock, MapPin, CloudRain, Cloud, Sun, Phone, Target, ArrowRight, UserX } from 'lucide-react'

type RecentContact = {
  id: string
  full_name: string | null
  status: string | null
  created_at: string
}

type Appointment = {
  id: string
  title: string
  appointment_date: string
  duration_minutes: number
  contact_id: string
  contacts: {
    full_name: string | null
    phone1: string | null
  } | null
}

type WeatherData = {
  temp: number
  description: string
  icon: string
}

export default function DashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [company, setCompany] = useState<any>(null)
  const [contactsCount, setContactsCount] = useState(0)
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([])
  const [recentContacts, setRecentContacts] = useState<RecentContact[]>([])
  const [londonTime, setLondonTime] = useState('')
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({})
  const [unassignedCount, setUnassignedCount] = useState(0)

  useEffect(() => {
    loadDashboard()
    loadWeather()

    const timeInterval = setInterval(() => {
      setLondonTime(new Date().toLocaleString('en-GB', {
        timeZone: 'Europe/London',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }))
    }, 1000)

    return () => clearInterval(timeInterval)
  }, [])

  async function loadDashboard() {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

      if (!profileData) return
      setProfile(profileData)

      const { data: companyData } = await supabase
        .from('companies')
        .select('*')
        .eq('id', profileData.company_id)
        .maybeSingle()

      setCompany(companyData)

      let contactsQuery = supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', profileData.company_id)

      let recentQuery = supabase
        .from('contacts')
        .select('id, full_name, status, created_at')
        .eq('company_id', profileData.company_id)

      let statusQuery = supabase
        .from('contacts')
        .select('status')
        .eq('company_id', profileData.company_id)

      if (profileData.role === 'broker') {
        contactsQuery = contactsQuery.eq('assigned_to', user.id)
        recentQuery = recentQuery.eq('assigned_to', user.id)
        statusQuery = statusQuery.eq('assigned_to', user.id)
      }

      const { count: contactsCountData } = await contactsQuery
      setContactsCount(contactsCountData || 0)

      const { data: recentContactsData } = await recentQuery
        .order('created_at', { ascending: false })
        .limit(5)

      setRecentContacts(recentContactsData || [])

      const { data: statusData } = await statusQuery
      const counts: Record<string, number> = {}
      statusData?.forEach(item => {
        if (item.status) {
          counts[item.status] = (counts[item.status] || 0) + 1
        }
      })
      setStatusCounts(counts)

      // Load unassigned count (admins only)
      if (profileData.role === 'admin' || profileData.role === 'super_admin') {
        const { count: unassignedCountData } = await supabase
          .from('contacts')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', profileData.company_id)
          .eq('status', 'Unassigned')
          .is('assigned_to', null)

        setUnassignedCount(unassignedCountData || 0)
      }

      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      const { data: appointmentsData } = await supabase
        .from('appointments')
        .select(`
          *,
          contacts (
            full_name,
            phone1
          )
        `)
        .eq('broker_id', user.id)
        .eq('status', 'scheduled')
        .gte('appointment_date', today.toISOString())
        .lt('appointment_date', tomorrow.toISOString())
        .order('appointment_date', { ascending: true })

      setTodayAppointments(appointmentsData || [])
    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  async function loadWeather() {
    try {
      const response = await fetch(
        'https://api.open-meteo.com/v1/forecast?latitude=51.5074&longitude=-0.1278&current=temperature_2m,weather_code&timezone=Europe/London'
      )
      const data = await response.json()

      if (data.current) {
        const weatherCode = data.current.weather_code
        let description = 'Clear'
        let icon = 'sun'

        if (weatherCode >= 80) {
          description = 'Rainy'
          icon = 'rain'
        } else if (weatherCode >= 71) {
          description = 'Snow'
          icon = 'snow'
        } else if (weatherCode >= 51) {
          description = 'Drizzle'
          icon = 'rain'
        } else if (weatherCode >= 2) {
          description = 'Cloudy'
          icon = 'cloud'
        }

        setWeather({
          temp: Math.round(data.current.temperature_2m),
          description,
          icon
        })
      }
    } catch (error) {
      console.error('Error loading weather:', error)
    }
  }

  function getWeatherIcon(icon: string) {
    if (icon.includes('rain')) return <CloudRain className="h-6 w-6" />
    if (icon.includes('cloud')) return <Cloud className="h-6 w-6" />
    return <Sun className="h-6 w-6" />
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'Fresh Lead': 'bg-blue-500',
      'Call Backs': 'bg-yellow-500',
      'KYC In': 'bg-orange-500',
      'Apps In': 'bg-cyan-500',
      'Fronted': 'bg-green-500',
      'Banked': 'bg-emerald-600',
      'Paid Client': 'bg-green-700',
      'Kickers': 'bg-red-500',
      'Dead Box': 'bg-gray-400'
    }
    return colors[status] || 'bg-gray-500'
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  const greeting = new Date().getHours() < 12 ? 'Good Morning' : new Date().getHours() < 18 ? 'Good Afternoon' : 'Good Evening'

  return (
    <div className="flex-1 p-6 lg:p-8 space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">{greeting}</h1>
          <p className="text-lg text-muted-foreground mt-2">
            Welcome back, {profile?.full_name}
          </p>
        </div>

        <Card className="w-full lg:w-auto">
          <CardContent className="p-6 flex items-center gap-6">
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground font-medium">London, UK</p>
                <p className="text-2xl font-bold tabular-nums">{londonTime}</p>
              </div>
            </div>
            {weather && (
              <div className="flex items-center gap-3 pl-6 border-l">
                {getWeatherIcon(weather.icon)}
                <div>
                  <p className="text-2xl font-bold">{weather.temp}°C</p>
                  <p className="text-sm text-muted-foreground capitalize">{weather.description}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className={`grid gap-6 md:grid-cols-2 ${(profile?.role === 'admin' || profile?.role === 'super_admin') ? 'lg:grid-cols-5' : 'lg:grid-cols-4'}`}>
        {(profile?.role === 'admin' || profile?.role === 'super_admin') && (
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-orange-200" onClick={() => router.push('/admin')}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Unassigned</CardTitle>
              <div className="p-2 rounded-lg bg-orange-500/10">
                <UserX className="h-5 w-5 text-orange-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">{unassignedCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Awaiting assignment</p>
            </CardContent>
          </Card>
        )}

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/contacts')}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Pipeline</CardTitle>
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Users className="h-5 w-5 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{contactsCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Active contacts</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/calendar')}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Today's Meetings</CardTitle>
            <div className="p-2 rounded-lg bg-green-500/10">
              <Calendar className="h-5 w-5 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{todayAppointments.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Scheduled today</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Hot Leads</CardTitle>
            <div className="p-2 rounded-lg bg-orange-500/10">
              <Target className="h-5 w-5 text-orange-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {(statusCounts['Fresh Lead'] || 0) + (statusCounts['Call Backs'] || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Need follow-up</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {(statusCounts['Paid Client'] || 0) + (statusCounts['Banked'] || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Generating revenue</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-2 shadow-lg bg-card">
          <CardHeader className="border-b bg-muted/30">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Today's Appointments</CardTitle>
                <CardDescription className="mt-1">Your scheduled meetings for today</CardDescription>
              </div>
              <Button variant="outline" onClick={() => router.push('/calendar')}>
                View Calendar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {todayAppointments.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-16 w-16 mx-auto text-muted-foreground opacity-50 mb-4" />
                <p className="font-medium">No appointments today</p>
                <p className="text-sm text-muted-foreground mt-1">Enjoy your free day or schedule some calls</p>
              </div>
            ) : (
              <div className="space-y-4">
                {todayAppointments.map((apt) => {
                  const aptDate = new Date(apt.appointment_date)
                  const now = new Date()
                  const isUpcoming = aptDate >= now && aptDate <= new Date(now.getTime() + 60 * 60000)

                  return (
                    <div
                      key={apt.id}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md ${
                        isUpcoming
                          ? 'border-orange-500 bg-orange-500/10'
                          : 'border-border bg-card hover:border-primary'
                      }`}
                      onClick={() => router.push(`/contacts/${apt.contact_id}`)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full">
                              <Clock className="h-3 w-3" />
                              <span className="text-sm font-semibold">
                                {aptDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {apt.duration_minutes} minutes
                            </span>
                            {isUpcoming && (
                              <Badge className="bg-orange-500 hover:bg-orange-600">
                                Starting Soon
                              </Badge>
                            )}
                          </div>
                          <h4 className="text-lg font-semibold mb-1">{apt.title}</h4>
                          {apt.contacts && (
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1.5">
                                <Users className="h-4 w-4" />
                                <span>{apt.contacts.full_name}</span>
                              </div>
                              {apt.contacts.phone1 && (
                                <div className="flex items-center gap-1.5">
                                  <Phone className="h-4 w-4" />
                                  <a
                                    href={`tel:${apt.contacts.phone1}`}
                                    className="hover:text-blue-600 transition-colors"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {apt.contacts.phone1}
                                  </a>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-2 shadow-lg bg-card">
            <CardHeader className="border-b bg-muted/30">
              <CardTitle className="text-xl">Pipeline Overview</CardTitle>
              <CardDescription className="mt-1">Contacts by stage</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                {Object.entries(statusCounts)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 8)
                  .map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between group hover:bg-accent/50 p-2 rounded-lg transition-colors">
                      <div className="flex items-center gap-3 flex-1">
                        <div className={`w-3 h-3 rounded-full flex-shrink-0 ${getStatusColor(status)}`} />
                        <span className="text-sm font-medium">{status}</span>
                      </div>
                      <span className="text-sm font-bold">{count}</span>
                    </div>
                  ))}
                {Object.keys(statusCounts).length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No contacts yet</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 shadow-lg bg-card">
            <CardHeader className="border-b bg-muted/30">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">Recent Activity</CardTitle>
                  <CardDescription className="mt-1">Latest contacts</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                {recentContacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="flex items-start justify-between p-3 rounded-lg hover:bg-accent/50 cursor-pointer transition-colors group"
                    onClick={() => router.push(`/contacts/${contact.id}`)}
                  >
                    <div className="flex-1">
                      <p className="text-sm font-semibold group-hover:text-primary transition-colors">
                        {contact.full_name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(contact.status || '')}`} />
                        <p className="text-xs text-muted-foreground">{contact.status || 'No status'}</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(contact.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
                {recentContacts.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No recent contacts</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
