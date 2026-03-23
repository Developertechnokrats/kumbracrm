'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar as CalendarIcon, Clock, User, Phone, Bell, BellOff } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

type Appointment = {
  id: string
  title: string
  description: string | null
  appointment_date: string
  duration_minutes: number
  status: string
  contact_id: string
  contacts: {
    full_name: string | null
    phone1: string | null
  } | null
}

export default function CalendarPage() {
  const router = useRouter()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'day' | 'week'>('day')
  const [selectedDate, setSelectedDate] = useState(new Date())

  useEffect(() => {
    loadAppointments()
    checkUpcomingAppointments()
    const interval = setInterval(checkUpcomingAppointments, 60000)
    return () => clearInterval(interval)
  }, [selectedDate, view])

  async function loadAppointments() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const startDate = getStartDate()
    const endDate = getEndDate()

    const { data } = await supabase
      .from('appointments')
      .select(`
        *,
        contacts (
          full_name,
          phone1
        )
      `)
      .eq('broker_id', user.id)
      .gte('appointment_date', startDate.toISOString())
      .lte('appointment_date', endDate.toISOString())
      .order('appointment_date', { ascending: true })

    setAppointments(data || [])
    setLoading(false)
  }

  async function checkUpcomingAppointments() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const now = new Date()
    const fifteenMinutesFromNow = new Date(now.getTime() + 15 * 60000)

    const { data } = await supabase
      .from('appointments')
      .select(`
        *,
        contacts (full_name)
      `)
      .eq('broker_id', user.id)
      .eq('status', 'scheduled')
      .gte('appointment_date', now.toISOString())
      .lte('appointment_date', fifteenMinutesFromNow.toISOString())
      .eq('reminder_sent', false)

    if (data && data.length > 0) {
      data.forEach((appointment: any) => {
        const aptTime = new Date(appointment.appointment_date)
        const minutesUntil = Math.floor((aptTime.getTime() - now.getTime()) / 60000)

        showAppointmentNotification(appointment, minutesUntil)

        supabase
          .from('appointments')
          .update({ reminder_sent: true })
          .eq('id', appointment.id)
          .then(() => {})
      })
    }
  }

  function showAppointmentNotification(appointment: any, minutesUntil: number) {
    const audio = new Audio('/notification.mp3')
    audio.play().catch(() => {})

    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Upcoming Appointment', {
        body: `${appointment.title} with ${appointment.contacts?.full_name} in ${minutesUntil} minutes`,
        icon: '/favicon.ico'
      })
    }

    toast.warning(
      `Appointment in ${minutesUntil} minutes: ${appointment.title} with ${appointment.contacts?.full_name}`,
      {
        duration: 10000,
        action: {
          label: 'View',
          onClick: () => router.push(`/contacts/${appointment.contact_id}`)
        }
      }
    )
  }

  function getStartDate() {
    const date = new Date(selectedDate)
    if (view === 'day') {
      date.setHours(0, 0, 0, 0)
    } else {
      const day = date.getDay()
      const diff = date.getDate() - day
      date.setDate(diff)
      date.setHours(0, 0, 0, 0)
    }
    return date
  }

  function getEndDate() {
    const date = new Date(selectedDate)
    if (view === 'day') {
      date.setHours(23, 59, 59, 999)
    } else {
      const day = date.getDay()
      const diff = date.getDate() - day + 6
      date.setDate(diff)
      date.setHours(23, 59, 59, 999)
    }
    return date
  }

  function goToPrevious() {
    const newDate = new Date(selectedDate)
    if (view === 'day') {
      newDate.setDate(newDate.getDate() - 1)
    } else {
      newDate.setDate(newDate.getDate() - 7)
    }
    setSelectedDate(newDate)
  }

  function goToNext() {
    const newDate = new Date(selectedDate)
    if (view === 'day') {
      newDate.setDate(newDate.getDate() + 1)
    } else {
      newDate.setDate(newDate.getDate() + 7)
    }
    setSelectedDate(newDate)
  }

  function goToToday() {
    setSelectedDate(new Date())
  }

  function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          toast.success('Notifications enabled')
        }
      })
    }
  }

  const groupedAppointments = appointments.reduce((acc, apt) => {
    const date = new Date(apt.appointment_date).toLocaleDateString()
    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(apt)
    return acc
  }, {} as Record<string, Appointment[]>)

  const sortedDates = Object.keys(groupedAppointments).sort((a, b) =>
    new Date(a).getTime() - new Date(b).getTime()
  )

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Calendar</h2>
          <p className="text-muted-foreground">Manage your appointments and schedule</p>
        </div>
        <div className="flex items-center gap-2">
          {Notification.permission === 'default' && (
            <Button
              variant="outline"
              size="sm"
              onClick={requestNotificationPermission}
            >
              <Bell className="h-4 w-4 mr-2" />
              Enable Notifications
            </Button>
          )}
          {Notification.permission === 'granted' && (
            <Badge variant="outline" className="gap-1">
              <Bell className="h-3 w-3" />
              Notifications On
            </Badge>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={goToPrevious}>
                Previous
              </Button>
              <Button variant="outline" size="sm" onClick={goToToday}>
                Today
              </Button>
              <Button variant="outline" size="sm" onClick={goToNext}>
                Next
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={view === 'day' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setView('day')}
              >
                Day
              </Button>
              <Button
                variant={view === 'week' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setView('week')}
              >
                Week
              </Button>
            </div>
          </div>
          <CardTitle className="pt-4">
            {view === 'day'
              ? selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
              : `Week of ${getStartDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
            }
          </CardTitle>
        </CardHeader>
        <CardContent>
          {appointments.length === 0 ? (
            <div className="text-center py-12">
              <CalendarIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No appointments scheduled for this period</p>
            </div>
          ) : (
            <div className="space-y-6">
              {sortedDates.map(date => (
                <div key={date}>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5" />
                    {new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                  </h3>
                  <div className="space-y-3">
                    {groupedAppointments[date].map(apt => {
                      const aptDate = new Date(apt.appointment_date)
                      const now = new Date()
                      const isPast = aptDate < now
                      const isUpcoming = aptDate >= now && aptDate <= new Date(now.getTime() + 60 * 60000)

                      return (
                        <Card
                          key={apt.id}
                          className={cn(
                            'cursor-pointer transition-all hover:shadow-md',
                            isUpcoming && 'border-orange-500 bg-orange-50',
                            isPast && 'opacity-60'
                          )}
                          onClick={() => router.push(`/contacts/${apt.contact_id}`)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Clock className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-medium">
                                    {aptDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                                  </span>
                                  <span className="text-sm text-muted-foreground">
                                    ({apt.duration_minutes} min)
                                  </span>
                                  <Badge variant={apt.status === 'scheduled' ? 'default' : 'secondary'}>
                                    {apt.status}
                                  </Badge>
                                  {isUpcoming && (
                                    <Badge variant="outline" className="bg-orange-100">
                                      Starting Soon
                                    </Badge>
                                  )}
                                </div>
                                <h4 className="text-lg font-semibold mb-1">{apt.title}</h4>
                                {apt.contacts && (
                                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                      <User className="h-3 w-3" />
                                      {apt.contacts.full_name}
                                    </div>
                                    {apt.contacts.phone1 && (
                                      <div className="flex items-center gap-1">
                                        <Phone className="h-3 w-3" />
                                        {apt.contacts.phone1}
                                      </div>
                                    )}
                                  </div>
                                )}
                                {apt.description && (
                                  <p className="text-sm text-muted-foreground mt-2">{apt.description}</p>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
