'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Mail, Phone, FileText, TrendingUp, Users,
  Clock, PhoneIncoming, PhoneOutgoing, MessageSquare,
  ArrowRight, Activity, Loader2
} from 'lucide-react'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'

type BrokerPerformance = {
  broker: {
    id: string
    full_name: string
    email: string
  }
  emailStats: {
    sent: number
    received: number
    opened: number
    clicked: number
  }
  noteStats: {
    total: number
  }
  statusChanges: {
    total: number
    changes: Array<{
      from_status: string
      to_status: string
      count: number
    }>
  }
  callStats: {
    outbound: {
      total: number
      completed: number
      totalMinutes: number
    }
    inbound: {
      total: number
      completed: number
      totalMinutes: number
    }
  }
}

export default function PerformancePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState('7')
  const [performance, setPerformance] = useState<BrokerPerformance[]>([])

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (companyId) {
      loadPerformance()
    }
  }, [companyId, dateRange])

  async function loadData() {
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/sign-in')
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id, role')
      .eq('id', user.id)
      .maybeSingle()

    if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
      router.push('/dashboard')
      return
    }

    setCompanyId(profile.company_id)
    setLoading(false)
  }

  async function loadPerformance() {
    if (!companyId) return

    const supabase = createClient()
    const days = parseInt(dateRange)
    const startDate = startOfDay(subDays(new Date(), days))
    const endDate = endOfDay(new Date())

    // Get all brokers
    const { data: brokers } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('company_id', companyId)
      .in('role', ['broker', 'admin', 'manager'])
      .order('full_name')

    if (!brokers) return

    const performanceData: BrokerPerformance[] = []

    for (const broker of brokers) {
      // Email stats
      const { data: sentEmails } = await supabase
        .from('emails')
        .select('id, status, opened_at, clicked_at')
        .eq('company_id', companyId)
        .eq('user_id', broker.id)
        .eq('direction', 'sent')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())

      const { data: receivedEmails } = await supabase
        .from('emails')
        .select('id')
        .eq('company_id', companyId)
        .eq('direction', 'received')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())

      // Note stats
      const { data: notes } = await supabase
        .from('notes')
        .select('id')
        .eq('company_id', companyId)
        .eq('created_by', broker.id)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())

      // Status change stats
      const { data: statusChanges } = await supabase
        .from('contact_status_history')
        .select('from_status, to_status')
        .eq('company_id', companyId)
        .eq('changed_by', broker.id)
        .gte('changed_at', startDate.toISOString())
        .lte('changed_at', endDate.toISOString())

      // Aggregate status changes
      const statusChangeMap = new Map<string, number>()
      statusChanges?.forEach(change => {
        const key = `${change.from_status}→${change.to_status}`
        statusChangeMap.set(key, (statusChangeMap.get(key) || 0) + 1)
      })

      const statusChangeArray = Array.from(statusChangeMap.entries())
        .map(([key, count]) => {
          const [from_status, to_status] = key.split('→')
          return { from_status, to_status, count }
        })
        .sort((a, b) => b.count - a.count)

      // Call stats
      const { data: outboundCalls } = await supabase
        .from('call_logs')
        .select('status, duration_seconds')
        .eq('company_id', companyId)
        .eq('broker_id', broker.id)
        .eq('direction', 'outbound')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())

      const { data: inboundCalls } = await supabase
        .from('call_logs')
        .select('status, duration_seconds')
        .eq('company_id', companyId)
        .eq('broker_id', broker.id)
        .eq('direction', 'inbound')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())

      const outboundCompleted = outboundCalls?.filter(c => c.status === 'completed').length || 0
      const outboundMinutes = Math.round((outboundCalls?.reduce((sum, c) => sum + (c.duration_seconds || 0), 0) || 0) / 60)

      const inboundCompleted = inboundCalls?.filter(c => c.status === 'completed').length || 0
      const inboundMinutes = Math.round((inboundCalls?.reduce((sum, c) => sum + (c.duration_seconds || 0), 0) || 0) / 60)

      performanceData.push({
        broker: {
          id: broker.id,
          full_name: broker.full_name || 'Unknown',
          email: broker.email || ''
        },
        emailStats: {
          sent: sentEmails?.length || 0,
          received: receivedEmails?.length || 0,
          opened: sentEmails?.filter(e => e.opened_at).length || 0,
          clicked: sentEmails?.filter(e => e.clicked_at).length || 0
        },
        noteStats: {
          total: notes?.length || 0
        },
        statusChanges: {
          total: statusChanges?.length || 0,
          changes: statusChangeArray
        },
        callStats: {
          outbound: {
            total: outboundCalls?.length || 0,
            completed: outboundCompleted,
            totalMinutes: outboundMinutes
          },
          inbound: {
            total: inboundCalls?.length || 0,
            completed: inboundCompleted,
            totalMinutes: inboundMinutes
          }
        }
      })
    }

    setPerformance(performanceData)
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const totalEmails = performance.reduce((sum, p) => sum + p.emailStats.sent, 0)
  const totalNotes = performance.reduce((sum, p) => sum + p.noteStats.total, 0)
  const totalStatusChanges = performance.reduce((sum, p) => sum + p.statusChanges.total, 0)
  const totalCalls = performance.reduce((sum, p) => sum + p.callStats.outbound.total + p.callStats.inbound.total, 0)

  return (
    <div className="flex h-screen flex-col bg-background">
      <div className="border-b">
        <div className="flex items-center justify-between p-6">
          <div>
            <h1 className="text-3xl font-bold">Broker Performance</h1>
            <p className="text-muted-foreground mt-1">Track team activity and productivity</p>
          </div>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Last 24 hours</SelectItem>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="14">Last 14 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          {/* Overview Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Emails Sent</CardTitle>
                <Mail className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalEmails}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Notes Added</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalNotes}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Status Changes</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalStatusChanges}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
                <Phone className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalCalls}</div>
              </CardContent>
            </Card>
          </div>

          {/* Broker Performance Details */}
          <div className="space-y-4">
            {performance.map((perf) => (
              <Card key={perf.broker.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{perf.broker.full_name}</CardTitle>
                      <CardDescription>{perf.broker.email}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="emails" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="emails">
                        <Mail className="h-4 w-4 mr-2" />
                        Emails
                      </TabsTrigger>
                      <TabsTrigger value="notes">
                        <FileText className="h-4 w-4 mr-2" />
                        Notes
                      </TabsTrigger>
                      <TabsTrigger value="status">
                        <Activity className="h-4 w-4 mr-2" />
                        Status
                      </TabsTrigger>
                      <TabsTrigger value="calls">
                        <Phone className="h-4 w-4 mr-2" />
                        Calls
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="emails" className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-4">
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Sent</p>
                          <p className="text-2xl font-bold">{perf.emailStats.sent}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Received</p>
                          <p className="text-2xl font-bold">{perf.emailStats.received}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Opened</p>
                          <p className="text-2xl font-bold">{perf.emailStats.opened}</p>
                          {perf.emailStats.sent > 0 && (
                            <p className="text-xs text-muted-foreground">
                              {Math.round((perf.emailStats.opened / perf.emailStats.sent) * 100)}% open rate
                            </p>
                          )}
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Clicked</p>
                          <p className="text-2xl font-bold">{perf.emailStats.clicked}</p>
                          {perf.emailStats.sent > 0 && (
                            <p className="text-xs text-muted-foreground">
                              {Math.round((perf.emailStats.clicked / perf.emailStats.sent) * 100)}% click rate
                            </p>
                          )}
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="notes">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Total Notes Added</span>
                          <span className="text-2xl font-bold">{perf.noteStats.total}</span>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="status" className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-sm text-muted-foreground">Total Status Changes</span>
                          <span className="text-2xl font-bold">{perf.statusChanges.total}</span>
                        </div>

                        {perf.statusChanges.changes.length > 0 ? (
                          <div className="space-y-2">
                            <p className="text-sm font-medium">Status Change Breakdown:</p>
                            {perf.statusChanges.changes.slice(0, 5).map((change, idx) => (
                              <div key={idx} className="flex items-center justify-between rounded-lg border p-3">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline">{change.from_status}</Badge>
                                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                  <Badge variant="outline">{change.to_status}</Badge>
                                </div>
                                <span className="font-semibold">{change.count}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">No status changes recorded</p>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="calls" className="space-y-4">
                      <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <PhoneOutgoing className="h-5 w-5" />
                            <h3 className="font-semibold">Outbound Calls</h3>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Total Dialed</span>
                              <span className="text-xl font-bold">{perf.callStats.outbound.total}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Completed</span>
                              <span className="text-xl font-bold">{perf.callStats.outbound.completed}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Talk Time</span>
                              <span className="text-xl font-bold">{perf.callStats.outbound.totalMinutes} min</span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <PhoneIncoming className="h-5 w-5" />
                            <h3 className="font-semibold">Inbound Calls</h3>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Total Received</span>
                              <span className="text-xl font-bold">{perf.callStats.inbound.total}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Answered</span>
                              <span className="text-xl font-bold">{perf.callStats.inbound.completed}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Talk Time</span>
                              <span className="text-xl font-bold">{perf.callStats.inbound.totalMinutes} min</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            ))}
          </div>

          {performance.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No broker data available</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
