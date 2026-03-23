'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LayoutGrid, List, Mail, Phone, DollarSign, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { KanbanView } from './kanban-improved'

type Contact = {
  id: string
  full_name: string | null
  first_name: string | null
  last_name: string | null
  email: string | null
  phone1: string | null
  status: string | null
  lead_source: string | null
  ideal_value: string | null
  ideal_currency: string | null
  next_action: string | null
  last_conversation: string | null
  created_at: string
}

const PIPELINE_STAGES = [
  { id: 'Unassigned', label: 'Unassigned', color: 'bg-gradient-to-r from-slate-400 to-gray-500' },
  { id: 'Fresh Lead', label: 'Fresh Lead', color: 'bg-gradient-to-r from-blue-400 to-blue-500' },
  { id: 'Fronted', label: 'Fronted', color: 'bg-gradient-to-r from-purple-400 to-pink-500' },
  { id: 'Apps In', label: 'Apps In', color: 'bg-gradient-to-r from-orange-400 to-red-500' },
  { id: 'KYC In', label: 'KYC In', color: 'bg-gradient-to-r from-green-400 to-emerald-500' },
  { id: 'Trade Agreed', label: 'Bond Trade', color: 'bg-gradient-to-r from-cyan-400 to-teal-500' },
  { id: 'Signed Agreement', label: 'BPA Signed', color: 'bg-gradient-to-r from-yellow-400 to-amber-500' },
  { id: 'Debtor', label: 'Debtor', color: 'bg-gradient-to-r from-orange-500 to-red-600' },
  { id: 'Hot Prospect', label: 'Hot Prospect', color: 'bg-gradient-to-r from-yellow-400 to-orange-500' },
  { id: 'Paid Client', label: 'Paid Client', color: 'bg-gradient-to-r from-emerald-400 to-green-600' },
  { id: 'HTR', label: 'HTR', color: 'bg-gradient-to-r from-indigo-400 to-purple-500' },
  { id: 'Call Backs', label: 'Call Backs', color: 'bg-gradient-to-r from-pink-400 to-rose-500' },
  { id: 'Dead Box', label: 'Dead Box', color: 'bg-gray-500' },
]

export default function ContactsPage() {
  const router = useRouter()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStage, setSelectedStage] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('kanban')

  useEffect(() => {
    loadContacts()
  }, [])

  const [userRole, setUserRole] = useState<string>('')

  async function loadContacts() {
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id, role')
      .eq('id', user.id)
      .maybeSingle()

    if (!profile) return

    setUserRole(profile.role)

    let query = supabase
      .from('contacts')
      .select('*')
      .eq('company_id', profile.company_id)

    if (profile.role === 'broker') {
      query = query.eq('assigned_to', user.id)
    }

    const { data } = await query.order('created_at', { ascending: false })

    setContacts(data || [])
    setLoading(false)
  }

  const getContactsByStage = (stage: string) => {
    return contacts.filter(c => c.status === stage)
  }

  const filteredContacts = selectedStage
    ? getContactsByStage(selectedStage)
    : contacts

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading contacts...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 p-6 lg:p-8 space-y-6">
      <div className="max-w-[1600px] mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Contacts</h1>
            <p className="text-lg text-muted-foreground mt-1">
              {contacts.length} total contacts in your pipeline
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
              <Button
                variant={viewMode === 'kanban' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('kanban')}
                className="gap-2"
              >
                <LayoutGrid className="h-4 w-4" />
                Kanban
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="gap-2"
              >
                <List className="h-4 w-4" />
                List
              </Button>
            </div>
          </div>
        </div>

        {viewMode === 'kanban' ? (
          <KanbanView contacts={contacts} onRefresh={loadContacts} userRole={userRole} />
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedStage === null ? 'default' : 'outline'}
                onClick={() => setSelectedStage(null)}
                size="sm"
              >
                All ({contacts.length})
              </Button>
              {PIPELINE_STAGES.map(stage => (
                <Button
                  key={stage.id}
                  variant={selectedStage === stage.id ? 'default' : 'outline'}
                  onClick={() => setSelectedStage(stage.id)}
                  size="sm"
                  className="gap-2"
                >
                  <div className={cn("w-2 h-2 rounded-full", stage.color)} />
                  {stage.label} ({getContactsByStage(stage.id).length})
                </Button>
              ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredContacts.map(contact => (
                <Card
                  key={contact.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => router.push(`/contacts/${contact.id}`)}
                >
                  <CardHeader className="border-b">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg group-hover:text-primary transition-colors">
                          {contact.full_name}
                        </CardTitle>
                        {contact.status && (
                          <Badge
                            className={cn(
                              "mt-2",
                              PIPELINE_STAGES.find(s => s.id === contact.status)?.color || 'bg-gray-500'
                            )}
                          >
                            {contact.status}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-3">
                    {contact.email && (
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Mail className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">{contact.email}</span>
                      </div>
                    )}
                    {contact.phone1 && (
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Phone className="h-4 w-4 flex-shrink-0" />
                        <span>{contact.phone1}</span>
                      </div>
                    )}
                    {contact.ideal_value && (
                      <div className="flex items-center gap-2 text-sm font-semibold text-green-700">
                        <DollarSign className="h-4 w-4 flex-shrink-0" />
                        <span>{contact.ideal_currency} {contact.ideal_value}</span>
                      </div>
                    )}
                    {contact.lead_source && (
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <User className="h-4 w-4 flex-shrink-0" />
                        <span>Source: {contact.lead_source}</span>
                      </div>
                    )}
                    <div className="pt-3 border-t text-xs text-slate-400">
                      Added {new Date(contact.created_at).toLocaleDateString()}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredContacts.length === 0 && (
              <Card className="border-none shadow-xl">
                <CardContent className="p-12 text-center">
                  <User className="h-16 w-16 mx-auto text-slate-300 mb-4" />
                  <p className="text-lg font-medium text-slate-600">No contacts found</p>
                  <p className="text-sm text-slate-400 mt-2">
                    {selectedStage ? 'Try selecting a different stage' : 'Start by adding your first contact'}
                  </p>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  )
}
