'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ArrowLeft, Mail, Phone, DollarSign, Calendar, User, MessageSquare, Clock, MapPin, Globe, Briefcase, TrendingUp, Target, PhoneCall, CalendarPlus, AlertCircle, CheckCircle2, ArrowRight, Lightbulb } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { EmailComposer } from '@/components/email/email-composer'
import { EmailThreadView } from '@/components/email/email-thread-view'
import { DealTicketDialog } from '@/components/deal-ticket-dialog'

type Contact = {
  id: string
  full_name: string | null
  first_name: string | null
  last_name: string | null
  email: string | null
  phone1: string | null
  phone2: string | null
  status: string | null
  lead_source: string | null
  ideal_value: string | null
  ideal_currency: string | null
  next_action: string | null
  street_address: string | null
  city: string | null
  province: string | null
  postcode: string | null
  job_title: string | null
  age: number | null
  trading_range: string | null
  preferred_investment: string | null
  nationality: string | null
  location: string | null
  timezone: string | null
  kyc_approved: boolean | null
  kyc_approved_at: string | null
  kyc_approved_by: string | null
  created_at: string
}

type Note = {
  id: string
  content: string
  created_at: string
  broker_id: string
  profiles: {
    full_name: string | null
  } | null
}

type Appointment = {
  id: string
  title: string
  description: string | null
  appointment_date: string
  duration_minutes: number
  status: string
}

type StageScript = {
  objective: string
  talking_points: string[]
  script: string | null
  next_steps: string[]
}

const STATUSES = [
  'Fresh Lead',
  'Call Backs',
  'KYC In',
  'Apps In',
  'Agreement Signed',
  'TT Received',
  'Fronted',
  'Banked',
  'Paid Client',
  'Kickers',
  'Dead Box'
]

const STATUS_COLORS: Record<string, string> = {
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

const PRIORITY_NATIONALITIES = [
  'British', 'German', 'Swiss', 'Dutch', 'Irish', 'French', 'Spanish', 'Italian'
]

const OTHER_NATIONALITIES = [
  'American', 'Australian', 'Austrian', 'Belgian', 'Brazilian', 'Canadian',
  'Chinese', 'Danish', 'Finnish', 'Greek', 'Indian', 'Japanese', 'Mexican',
  'Norwegian', 'Polish', 'Portuguese', 'Russian', 'Swedish', 'Turkish'
]

const LOCATIONS_WITH_TIMEZONES: Record<string, string> = {
  'UK': 'Europe/London',
  'Germany': 'Europe/Berlin',
  'Switzerland': 'Europe/Zurich',
  'Netherlands': 'Europe/Amsterdam',
  'Ireland': 'Europe/Dublin',
  'France': 'Europe/Paris',
  'Spain': 'Europe/Madrid',
  'Italy': 'Europe/Rome',
  'USA': 'America/New_York',
  'Canada': 'America/Toronto',
  'Australia': 'Australia/Sydney',
  'Japan': 'Asia/Tokyo',
  'China': 'Asia/Shanghai',
  'India': 'Asia/Kolkata',
  'Brazil': 'America/Sao_Paulo',
  'Mexico': 'America/Mexico_City'
}

const TRADING_RANGES = [
  '$1,000 - $5,000',
  '$5,000 - $10,000',
  '$10,000 - $25,000',
  '$25,000 - $50,000',
  '$50,000 - $100,000',
  '$100,000 - $250,000',
  '$250,000 - $500,000',
  '$500,000+'
]

const KUMBRA_INVESTMENTS = [
  'OpenAI',
  'Starlink/SpaceX',
  'Stripe',
  'Databricks',
  'Plaid',
  'Chime',
  'Klarna',
  'Discord',
  'Impossible Foods'
]

export default function ContactDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [contact, setContact] = useState<Contact | null>(null)
  const [notes, setNotes] = useState<Note[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [stageScript, setStageScript] = useState<StageScript | null>(null)
  const [newNote, setNewNote] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editedContact, setEditedContact] = useState<Partial<Contact>>({})
  const [localTime, setLocalTime] = useState<string>('')

  const [appointmentDialog, setAppointmentDialog] = useState(false)
  const [newAppointment, setNewAppointment] = useState({
    title: '',
    description: '',
    appointment_date: '',
    duration_minutes: 30
  })
  const [emailComposerOpen, setEmailComposerOpen] = useState(false)
  const [dealTicketOpen, setDealTicketOpen] = useState(false)
  const [userRole, setUserRole] = useState<string>('')
  const [companyId, setCompanyId] = useState<string>('')

  useEffect(() => {
    loadContact()
    loadNotes()
    loadAppointments()
  }, [params.id])

  useEffect(() => {
    const updateLocalTime = () => {
      if (contact?.timezone) {
        try {
          const time = new Intl.DateTimeFormat('en-US', {
            timeZone: contact.timezone,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
          }).format(new Date())
          setLocalTime(time)
        } catch (error) {
          setLocalTime('')
        }
      } else {
        setLocalTime('')
      }
    }

    updateLocalTime()
    const interval = setInterval(updateLocalTime, 1000)

    return () => clearInterval(interval)
  }, [contact?.timezone])

  useEffect(() => {
    if (contact?.status) {
      loadStageScript(contact.status)
    }
  }, [contact?.status])

  async function loadContact() {
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, company_id')
        .eq('id', user.id)
        .maybeSingle()

      if (profile) {
        setUserRole(profile.role)
        setCompanyId(profile.company_id)
      }
    }

    const { data } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', params.id as string)
      .maybeSingle()

    setContact(data)
    setEditedContact(data || {})
    setLoading(false)
  }

  async function loadNotes() {
    const supabase = createClient()
    const { data } = await supabase
      .from('notes')
      .select(`
        *,
        profiles (full_name)
      `)
      .eq('contact_id', params.id as string)
      .order('created_at', { ascending: false })

    setNotes(data || [])
  }

  async function loadAppointments() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('appointments')
      .select('*')
      .eq('contact_id', params.id as string)
      .eq('broker_id', user.id)
      .order('appointment_date', { ascending: true })

    setAppointments(data || [])
  }

  async function loadStageScript(stage: string) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .maybeSingle()

    if (!profile) return

    const { data } = await supabase
      .from('stage_scripts')
      .select('*')
      .eq('company_id', profile.company_id)
      .eq('stage', stage)
      .maybeSingle()

    if (data) {
      setStageScript({
        objective: data.objective,
        talking_points: data.talking_points || [],
        script: data.script,
        next_steps: data.next_steps || []
      })
    }
  }

  async function handleAddNote() {
    if (!newNote.trim()) return

    setSaving(true)
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .maybeSingle()

    if (!profile || !contact) return

    const { error } = await supabase
      .from('notes')
      .insert({
        company_id: profile.company_id,
        contact_id: contact.id,
        broker_id: user.id,
        content: newNote
      })

    if (error) {
      toast.error('Failed to add note')
    } else {
      toast.success('Note added')
      setNewNote('')
      loadNotes()
    }

    setSaving(false)
  }

  async function handleStatusChange(newStatus: string) {
    if (!contact) return

    const supabase = createClient()
    const { error } = await supabase
      .from('contacts')
      .update({ status: newStatus })
      .eq('id', contact.id)

    if (error) {
      toast.error('Failed to update status')
    } else {
      toast.success('Status updated')
      setContact({ ...contact, status: newStatus })
    }
  }

  async function handleKYCApproval() {
    if (!contact) return

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('contacts')
      .update({
        kyc_approved: true,
        kyc_approved_at: new Date().toISOString(),
        kyc_approved_by: user.id
      })
      .eq('id', contact.id)

    if (error) {
      toast.error('Failed to approve KYC')
    } else {
      toast.success('KYC approved successfully')
      setContact({ ...contact, kyc_approved: true, kyc_approved_at: new Date().toISOString(), kyc_approved_by: user.id })
    }
  }

  async function handleSaveContact() {
    if (!contact) return

    setSaving(true)
    const supabase = createClient()

    const { error } = await supabase
      .from('contacts')
      .update(editedContact)
      .eq('id', contact.id)

    if (error) {
      toast.error('Failed to update contact')
    } else {
      toast.success('Contact updated')
      setContact({ ...contact, ...editedContact })
      setIsEditing(false)
    }

    setSaving(false)
  }

  async function handleCreateAppointment() {
    if (!newAppointment.title || !newAppointment.appointment_date) {
      toast.error('Please fill in required fields')
      return
    }

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('appointments')
      .insert({
        contact_id: params.id as string,
        broker_id: user.id,
        ...newAppointment
      })

    if (error) {
      toast.error('Failed to create appointment')
    } else {
      toast.success('Appointment scheduled')
      setAppointmentDialog(false)
      setNewAppointment({
        title: '',
        description: '',
        appointment_date: '',
        duration_minutes: 30
      })
      loadAppointments()
    }
  }

  function handleCallClick(phone: string) {
    window.location.href = `tel:${phone}`
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading contact...</p>
        </div>
      </div>
    )
  }

  if (!contact) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Contact not found</p>
          <Button className="mt-4" onClick={() => router.push('/contacts')}>
            Back to Contacts
          </Button>
        </div>
      </div>
    )
  }

  const statusColor = STATUS_COLORS[contact.status || ''] || 'bg-gray-500'

  return (
    <div className="flex-1 min-h-screen p-6 lg:p-8 space-y-6">
      <div className="max-w-7xl mx-auto p-8 space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/contacts')}
            className="hover:bg-accent transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-4xl font-bold tracking-tight">{contact.full_name}</h1>
              <div className={cn("w-3 h-3 rounded-full", statusColor)} />
            </div>
            <p className="text-lg text-muted-foreground mt-1">
              {contact.job_title || 'Contact'} {contact.age ? `• ${contact.age} years old` : ''}
              {contact.location ? ` • ${contact.location}` : ''}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {contact.kyc_approved && (
              <Badge className="bg-green-600 text-white px-4 py-2 text-sm">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                KYC Approved
              </Badge>
            )}
            {!contact.kyc_approved && userRole && ['admin', 'company_admin', 'super_admin'].includes(userRole) && (
              <Button
                onClick={handleKYCApproval}
                variant="outline"
                className="border-green-600 text-green-600 hover:bg-green-50"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Approve KYC
              </Button>
            )}
            {contact.kyc_approved && (
              <Button
                onClick={() => setDealTicketOpen(true)}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Write Deal Ticket
              </Button>
            )}
            <Select value={contact.status || ''} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-[220px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    <div className="flex items-center gap-2">
                      <div className={cn("w-2 h-2 rounded-full", STATUS_COLORS[status])} />
                      {status}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {stageScript && (
          <Card className="bg-primary text-primary-foreground overflow-hidden">
            <CardHeader className="relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary-foreground rounded-full opacity-10 blur-3xl"></div>
              <div className="relative">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                    <Target className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-2xl font-bold">Call Objective</CardTitle>
                </div>
                <p className="text-xl font-semibold opacity-90">{stageScript.objective}</p>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 relative">
              <div className="grid md:grid-cols-2 gap-6">
                {stageScript.talking_points.length > 0 && (
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20">
                    <div className="flex items-center gap-2 mb-4">
                      <CheckCircle2 className="h-5 w-5" />
                      <h4 className="font-bold text-lg">Key Talking Points</h4>
                    </div>
                    <ul className="space-y-2">
                      {stageScript.talking_points.map((point, idx) => (
                        <li key={idx} className="flex items-start gap-2 opacity-90">
                          <span className="font-bold text-white mt-0.5">•</span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {stageScript.next_steps.length > 0 && (
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20">
                    <div className="flex items-center gap-2 mb-4">
                      <ArrowRight className="h-5 w-5" />
                      <h4 className="font-bold text-lg">Next Steps</h4>
                    </div>
                    <ul className="space-y-2">
                      {stageScript.next_steps.map((step, idx) => (
                        <li key={idx} className="flex items-start gap-2 opacity-90">
                          <span className="font-bold text-white mt-0.5">{idx + 1}.</span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {stageScript.script && (
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20">
                  <div className="flex items-center gap-2 mb-4">
                    <Lightbulb className="h-5 w-5" />
                    <h4 className="font-bold text-lg">Suggested Script</h4>
                  </div>
                  <p className="opacity-90 italic leading-relaxed">
                    {stageScript.script}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">Client Profile</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (isEditing) {
                        handleSaveContact()
                      } else {
                        setEditedContact({
                          job_title: contact.job_title,
                          age: contact.age,
                          nationality: contact.nationality,
                          location: contact.location,
                          timezone: contact.timezone,
                          trading_range: contact.trading_range,
                          preferred_investment: contact.preferred_investment
                        })
                        setIsEditing(true)
                      }
                    }}
                  >
                    {isEditing ? (saving ? 'Saving...' : 'Save Changes') : 'Edit Profile'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-5">
                    <div className="flex items-start gap-4 p-3 bg-muted/50 rounded-lg">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Mail className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-muted-foreground mb-1">Email Address</p>
                        <p className="text-sm text-foreground break-all">{contact.email || 'Not provided'}</p>
                      </div>
                    </div>

                    {contact.phone1 && (
                      <div className="flex items-start gap-4 p-3 bg-muted/50 rounded-lg">
                        <div className="p-2 bg-green-500/10 rounded-lg">
                          <Phone className="h-5 w-5 text-green-500" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-muted-foreground mb-1">Phone Number</p>
                          <Button
                            variant="link"
                            className="h-auto p-0 text-sm font-medium text-primary hover:text-primary"
                            onClick={() => handleCallClick(contact.phone1!)}
                          >
                            <PhoneCall className="h-3 w-3 mr-1" />
                            {contact.phone1}
                          </Button>
                        </div>
                      </div>
                    )}

                    <InfoField
                      icon={<Briefcase className="h-5 w-5 text-orange-500" />}
                      label="Job Title"
                      value={contact.job_title}
                      isEditing={isEditing}
                      onEdit={(val) => setEditedContact({ ...editedContact, job_title: val })}
                      editValue={editedContact.job_title}
                    />

                    <InfoField
                      icon={<User className="h-5 w-5 text-purple-500" />}
                      label="Age"
                      value={contact.age?.toString()}
                      isEditing={isEditing}
                      onEdit={(val) => setEditedContact({ ...editedContact, age: parseInt(val) || null })}
                      editValue={editedContact.age?.toString()}
                      type="number"
                    />

                    <SelectField
                      icon={<Globe className="h-5 w-5 text-cyan-500" />}
                      label="Nationality"
                      value={contact.nationality}
                      isEditing={isEditing}
                      onEdit={(val) => setEditedContact({ ...editedContact, nationality: val })}
                      editValue={editedContact.nationality}
                      options={[...PRIORITY_NATIONALITIES, '---', ...OTHER_NATIONALITIES]}
                    />
                  </div>

                  <div className="space-y-5">
                    <SelectField
                      icon={<MapPin className="h-5 w-5 text-red-500" />}
                      label="Location"
                      value={contact.location}
                      isEditing={isEditing}
                      onEdit={(val) => {
                        const timezone = LOCATIONS_WITH_TIMEZONES[val] || null
                        setEditedContact({ ...editedContact, location: val, timezone })
                      }}
                      editValue={editedContact.location}
                      options={Object.keys(LOCATIONS_WITH_TIMEZONES)}
                    />

                    <div className="flex items-start gap-4 p-3 bg-muted/50 rounded-lg">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Clock className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-muted-foreground mb-1">Timezone</p>
                        {isEditing ? (
                          <Input
                            value={editedContact.timezone || ''}
                            onChange={(e) => setEditedContact({ ...editedContact, timezone: e.target.value })}
                            className="h-8 mt-1"
                            placeholder="e.g., America/New_York"
                          />
                        ) : (
                          <div>
                            <p className="text-sm text-foreground">{contact.timezone || 'Not provided'}</p>
                            {localTime && (
                              <p className="text-xs text-green-500 font-semibold mt-1">
                                Local time: {localTime}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <SelectField
                      icon={<TrendingUp className="h-5 w-5 text-emerald-600" />}
                      label="Trading Range"
                      value={contact.trading_range}
                      isEditing={isEditing}
                      onEdit={(val) => setEditedContact({ ...editedContact, trading_range: val })}
                      editValue={editedContact.trading_range}
                      options={TRADING_RANGES}
                    />

                    <SelectField
                      icon={<Target className="h-5 w-5 text-indigo-600" />}
                      label="Preferred Investment"
                      value={contact.preferred_investment}
                      isEditing={isEditing}
                      onEdit={(val) => setEditedContact({ ...editedContact, preferred_investment: val })}
                      editValue={editedContact.preferred_investment}
                      options={KUMBRA_INVESTMENTS}
                    />

                    {contact.ideal_value && (
                      <div className="flex items-start gap-4 p-3 bg-muted/50 rounded-lg">
                        <div className="p-2 bg-yellow-100 rounded-lg">
                          <DollarSign className="h-5 w-5 text-yellow-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-muted-foreground mb-1">Investment Amount</p>
                          <p className="text-sm text-foreground font-semibold">
                            {contact.ideal_currency} {contact.ideal_value}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="border-b">
                <CardTitle className="text-xl flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Notes & Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                  <Textarea
                    placeholder="Add a note about this contact..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    rows={3}
                    className="border-2 focus:border-blue-400"
                  />
                  <Button onClick={handleAddNote} disabled={saving || !newNote.trim()} className="w-full">
                    {saving ? 'Adding...' : 'Add Note'}
                  </Button>
                </div>

                <div className="space-y-3 pt-4">
                  {notes.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No notes yet. Add your first note above.
                    </p>
                  ) : (
                    notes.map((note) => (
                      <div key={note.id} className="border-l-4 border-blue-500 pl-4 py-3 bg-muted/50 rounded-r-lg">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-bold text-foreground">
                            {note.profiles?.full_name || 'Unknown'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(note.created_at).toLocaleString()}
                          </p>
                        </div>
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">
                          {note.content}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader className="border-b">
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-3">
                {contact.phone1 && (
                  <Button
                    className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg"
                    onClick={() => handleCallClick(contact.phone1!)}
                  >
                    <PhoneCall className="h-4 w-4 mr-2" />
                    Call Now
                  </Button>
                )}

                <Dialog open={appointmentDialog} onOpenChange={setAppointmentDialog}>
                  <DialogTrigger asChild>
                    <Button className="w-full" variant="outline">
                      <CalendarPlus className="h-4 w-4 mr-2" />
                      Schedule Appointment
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Schedule Appointment</DialogTitle>
                      <DialogDescription>
                        Set up a call or meeting with {contact.full_name}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div>
                        <Label>Title *</Label>
                        <Input
                          value={newAppointment.title}
                          onChange={(e) => setNewAppointment({ ...newAppointment, title: e.target.value })}
                          placeholder="e.g., Follow-up call"
                        />
                      </div>
                      <div>
                        <Label>Date & Time *</Label>
                        <Input
                          type="datetime-local"
                          value={newAppointment.appointment_date}
                          onChange={(e) => setNewAppointment({ ...newAppointment, appointment_date: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Duration (minutes)</Label>
                        <Input
                          type="number"
                          value={newAppointment.duration_minutes}
                          onChange={(e) => setNewAppointment({ ...newAppointment, duration_minutes: parseInt(e.target.value) })}
                        />
                      </div>
                      <div>
                        <Label>Notes</Label>
                        <Textarea
                          value={newAppointment.description}
                          onChange={(e) => setNewAppointment({ ...newAppointment, description: e.target.value })}
                          placeholder="Any additional details..."
                        />
                      </div>
                      <Button onClick={handleCreateAppointment} className="w-full">
                        Schedule Appointment
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => setEmailComposerOpen(true)}
                  disabled={!contact.email}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Send Email
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="border-b">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Upcoming Appointments
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {appointments.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No appointments scheduled
                  </p>
                ) : (
                  <div className="space-y-3">
                    {appointments.slice(0, 5).map((apt) => (
                      <div key={apt.id} className="border-l-4 border-blue-500 pl-3 py-2 bg-muted/50 rounded-r-lg">
                        <p className="text-sm font-semibold text-foreground">{apt.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(apt.appointment_date).toLocaleString()}
                        </p>
                        <Badge variant="outline" className="mt-2 text-xs">
                          {apt.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="border-b">
                <CardTitle className="text-lg">Timeline</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3 text-sm text-muted-foreground">
                  <div className="flex justify-between">
                    <span className="font-medium">Created:</span>
                    <span>{new Date(contact.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Status:</span>
                    <Badge className={statusColor}>{contact.status}</Badge>
                  </div>
                  {contact.lead_source && (
                    <div className="flex justify-between">
                      <span className="font-medium">Source:</span>
                      <span>{contact.lead_source}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card>
          <CardHeader className="border-b">
            <CardTitle className="text-xl flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email History
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <EmailThreadView contactId={contact.id} contactEmail={contact.email || undefined} />
          </CardContent>
        </Card>
      </div>

      <EmailComposer
        open={emailComposerOpen}
        onOpenChange={setEmailComposerOpen}
        defaultTo={contact.email || ''}
        contactId={contact.id}
        contactName={contact.full_name || undefined}
      />

      <DealTicketDialog
        open={dealTicketOpen}
        onOpenChange={setDealTicketOpen}
        contactId={contact.id}
        contactName={contact.full_name || 'Contact'}
        companyId={companyId}
        onSuccess={() => {
          toast.success('Deal ticket created')
          loadContact()
        }}
      />
    </div>
  )
}

function InfoField({
  icon,
  label,
  value,
  isEditing,
  onEdit,
  editValue,
  type = 'text',
  placeholder
}: {
  icon: React.ReactNode
  label: string
  value: string | null | undefined
  isEditing: boolean
  onEdit: (val: string) => void
  editValue: string | null | undefined
  type?: string
  placeholder?: string
}) {
  return (
    <div className="flex items-start gap-4 p-3 bg-muted/50 rounded-lg">
      <div className="p-2 bg-primary/10 rounded-lg">
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-muted-foreground mb-1">{label}</p>
        {isEditing ? (
          <Input
            type={type}
            value={editValue || ''}
            onChange={(e) => onEdit(e.target.value)}
            className="h-8 mt-1"
            placeholder={placeholder}
          />
        ) : (
          <p className="text-sm text-foreground">{value || 'Not provided'}</p>
        )}
      </div>
    </div>
  )
}

function SelectField({
  icon,
  label,
  value,
  isEditing,
  onEdit,
  editValue,
  options
}: {
  icon: React.ReactNode
  label: string
  value: string | null | undefined
  isEditing: boolean
  onEdit: (val: string) => void
  editValue: string | null | undefined
  options: string[]
}) {
  return (
    <div className="flex items-start gap-4 p-3 bg-muted/50 rounded-lg">
      <div className="p-2 bg-primary/10 rounded-lg">
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-muted-foreground mb-1">{label}</p>
        {isEditing ? (
          <Select value={editValue || ''} onValueChange={onEdit}>
            <SelectTrigger className="h-8 mt-1">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                option === '---' ? (
                  <div key={option} className="px-2 py-1.5 text-xs text-muted-foreground border-t">
                    Other Countries
                  </div>
                ) : (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                )
              ))}
            </SelectContent>
          </Select>
        ) : (
          <p className="text-sm text-foreground">{value || 'Not provided'}</p>
        )}
      </div>
    </div>
  )
}
