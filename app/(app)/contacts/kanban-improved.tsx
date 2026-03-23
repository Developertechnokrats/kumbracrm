'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Phone, Mail, DollarSign, Clock, ChevronDown, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  useDroppable,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

type Contact = {
  id: string
  full_name: string | null
  email: string | null
  phone1: string | null
  status: string | null
  lead_source: string | null
  ideal_value: string | null
  ideal_currency: string | null
  created_at: string
}

type KanbanColumn = {
  id: string
  title: string
  statuses: string[]
  colorClass: string
}

const KANBAN_COLUMNS: KanbanColumn[] = [
  {
    id: 'unassigned',
    title: 'Unassigned',
    statuses: ['Unassigned'],
    colorClass: 'bg-gradient-to-r from-slate-400 to-gray-500'
  },
  {
    id: 'fresh',
    title: 'Fresh Lead',
    statuses: ['Fresh Lead'],
    colorClass: 'bg-gradient-to-r from-blue-400 to-blue-500'
  },
  {
    id: 'fronted',
    title: 'Fronted',
    statuses: ['Fronted'],
    colorClass: 'bg-gradient-to-r from-purple-400 to-pink-500'
  },
  {
    id: 'apps',
    title: 'Apps In',
    statuses: ['Apps In'],
    colorClass: 'bg-gradient-to-r from-orange-400 to-red-500'
  },
  {
    id: 'kyc',
    title: 'KYC In',
    statuses: ['KYC In'],
    colorClass: 'bg-gradient-to-r from-green-400 to-emerald-500'
  },
  {
    id: 'trade',
    title: 'Bond Trade',
    statuses: ['Trade Agreed'],
    colorClass: 'bg-gradient-to-r from-cyan-400 to-teal-500'
  },
  {
    id: 'bpa',
    title: 'BPA Signed',
    statuses: ['Signed Agreement'],
    colorClass: 'bg-gradient-to-r from-yellow-400 to-amber-500'
  },
  {
    id: 'debtor',
    title: 'Debtor',
    statuses: ['Debtor'],
    colorClass: 'bg-gradient-to-r from-orange-500 to-red-600'
  },
  {
    id: 'hot',
    title: 'Hot Prospect',
    statuses: ['Hot Prospect'],
    colorClass: 'bg-gradient-to-r from-yellow-400 to-orange-500'
  },
  {
    id: 'paid',
    title: 'Paid Client',
    statuses: ['Paid Client'],
    colorClass: 'bg-gradient-to-r from-emerald-400 to-green-600'
  },
  {
    id: 'htr',
    title: 'HTR',
    statuses: ['HTR'],
    colorClass: 'bg-gradient-to-r from-indigo-400 to-purple-500'
  },
  {
    id: 'callbacks',
    title: 'Call Backs',
    statuses: ['Call Backs'],
    colorClass: 'bg-gradient-to-r from-pink-400 to-rose-500'
  },
  {
    id: 'dead',
    title: 'Dead Box',
    statuses: ['Dead Box'],
    colorClass: 'bg-gray-500'
  }
]

interface KanbanViewProps {
  contacts: Contact[]
  onRefresh: () => void
  userRole?: string
}

export function KanbanView({ contacts, onRefresh, userRole }: KanbanViewProps) {
  const router = useRouter()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [collapsedColumns, setCollapsedColumns] = useState<Set<string>>(new Set(['dead']))
  const [overId, setOverId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const visibleColumns = userRole === 'broker'
    ? KANBAN_COLUMNS.filter(col => col.id !== 'unassigned')
    : KANBAN_COLUMNS

  const groupedContacts = visibleColumns.reduce((acc, column) => {
    acc[column.id] = contacts.filter(c => column.statuses.includes(c.status || ''))
    return acc
  }, {} as Record<string, Contact[]>)

  function getLeadTypeBadge(leadSource: string | null) {
    const colors: Record<string, string> = {
      'AI booked calls': 'bg-green-100 text-green-700 border-green-300 dark:bg-green-950 dark:text-green-300',
      'AI Qualified': 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-950 dark:text-blue-300',
      'AI Handraised': 'bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-950 dark:text-purple-300',
      'Newsletter Leads': 'bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-950 dark:text-orange-300'
    }

    const color = colors[leadSource || ''] || 'bg-gray-100 text-gray-700 border-gray-300'
    const label = leadSource || ''

    if (!label) return null
    return <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${color}`}>{label}</Badge>
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string)
  }

  function handleDragOver(event: DragOverEvent) {
    const { over } = event
    setOverId(over ? over.id as string : null)
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event

    setActiveId(null)
    setOverId(null)

    if (!over) return

    const contact = contacts.find(c => c.id === active.id)
    if (!contact) return

    const overColumnId = over.id as string
    const targetColumn = KANBAN_COLUMNS.find(col => col.id === overColumnId)

    if (!targetColumn) return

    const newStatus = targetColumn.statuses[0]

    if (contact.status !== newStatus) {
      const supabase = createClient()
      const { error } = await supabase
        .from('contacts')
        .update({ status: newStatus })
        .eq('id', contact.id)

      if (error) {
        toast.error('Failed to update contact status')
      } else {
        toast.success(`Moved ${contact.full_name} to ${newStatus}`)
        onRefresh()
      }
    }
  }

  function toggleColumn(columnId: string) {
    setCollapsedColumns(prev => {
      const newSet = new Set(prev)
      if (newSet.has(columnId)) {
        newSet.delete(columnId)
      } else {
        newSet.add(columnId)
      }
      return newSet
    })
  }

  const activeContact = contacts.find(c => c.id === activeId)

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {visibleColumns.map(column => {
          const columnContacts = groupedContacts[column.id] || []
          const isCollapsed = collapsedColumns.has(column.id)
          const isOver = overId === column.id

          return (
            <KanbanColumn
              key={column.id}
              column={column}
              contacts={columnContacts}
              isCollapsed={isCollapsed}
              isOver={isOver}
              onToggle={() => toggleColumn(column.id)}
              onContactClick={(id) => router.push(`/contacts/${id}`)}
              getLeadTypeBadge={getLeadTypeBadge}
            />
          )
        })}
      </div>

      <DragOverlay>
        {activeContact && (
          <div className="rotate-2 opacity-90">
            <ContactCard
              contact={activeContact}
              onClick={() => {}}
              isDragging
              getLeadTypeBadge={getLeadTypeBadge}
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}

function KanbanColumn({
  column,
  contacts,
  isCollapsed,
  isOver,
  onToggle,
  onContactClick,
  getLeadTypeBadge,
}: {
  column: KanbanColumn
  contacts: Contact[]
  isCollapsed: boolean
  isOver: boolean
  onToggle: () => void
  onContactClick: (id: string) => void
  getLeadTypeBadge: (source: string | null) => JSX.Element | null
}) {
  const { setNodeRef } = useDroppable({
    id: column.id,
  })

  return (
    <div
      className={cn(
        "flex-shrink-0 transition-all duration-300",
        isCollapsed ? "w-16" : "w-80"
      )}
    >
      <Card className={cn("h-full", isOver && "ring-2 ring-primary")}>
        <CardHeader
          className="cursor-pointer select-none hover:bg-accent transition-colors"
          onClick={onToggle}
        >
          <div className="flex items-center justify-between">
            {isCollapsed ? (
              <div className="flex flex-col items-center gap-2 w-full">
                <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", column.colorClass)}>
                  <span className="text-white text-xs font-bold">{contacts.length}</span>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <div className={cn("w-3 h-3 rounded-full", column.colorClass)} />
                  <CardTitle className="text-sm font-semibold">{column.title}</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-sm px-2 py-0.5">
                    {contacts.length}
                  </Badge>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </div>
              </>
            )}
          </div>
        </CardHeader>

        {!isCollapsed && (
          <CardContent ref={setNodeRef} className="p-3 space-y-3 h-[calc(100vh-240px)] overflow-y-auto">
            <SortableContext
              items={contacts.map(c => c.id)}
              strategy={verticalListSortingStrategy}
            >
              {contacts.map(contact => (
                <ContactCard
                  key={contact.id}
                  contact={contact}
                  onClick={() => onContactClick(contact.id)}
                  getLeadTypeBadge={getLeadTypeBadge}
                />
              ))}
            </SortableContext>

            {contacts.length === 0 && (
              <div className="text-center py-12 text-muted-foreground text-sm">
                No contacts
              </div>
            )}

            <div className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center text-xs text-muted-foreground transition-all",
              isOver ? "border-primary bg-primary/5" : "border-border"
            )}>
              {isOver ? "Drop here!" : "Drop to move"}
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  )
}

interface ContactCardProps {
  contact: Contact
  onClick: () => void
  isDragging?: boolean
  getLeadTypeBadge?: (source: string | null) => JSX.Element | null
}

function ContactCard({ contact, onClick, isDragging = false, getLeadTypeBadge }: ContactCardProps) {
  function formatPhoneNumber(phone: string | null): string {
    if (!phone) return ''

    let cleaned = phone.replace(/\D/g, '')

    if (!phone.startsWith('+')) {
      if (cleaned.startsWith('49')) {
        return '+' + cleaned
      } else if (cleaned.startsWith('44')) {
        return '+' + cleaned
      } else if (cleaned.startsWith('41')) {
        return '+' + cleaned
      } else if (cleaned.startsWith('353')) {
        return '+' + cleaned
      } else if (cleaned.startsWith('43')) {
        return '+' + cleaned
      } else if (cleaned.startsWith('46')) {
        return '+' + cleaned
      }
    }

    return phone.startsWith('+') ? phone : '+' + phone
  }
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: contact.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.4 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={cn(
        "rounded-lg p-4 cursor-grab active:cursor-grabbing transition-all border",
        "hover:shadow-md hover:border-primary",
        isDragging && "shadow-xl ring-2 ring-primary cursor-grabbing"
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <h4 className="font-semibold text-sm leading-tight flex-1 pr-2">
          {contact.full_name}
        </h4>
        <div className="flex flex-col gap-1 items-end">
          <Badge variant="outline" className="text-xs flex-shrink-0">
            {contact.status}
          </Badge>
          {getLeadTypeBadge && getLeadTypeBadge(contact.lead_source)}
        </div>
      </div>

      <div className="space-y-2">
        {contact.email && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Mail className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{contact.email}</span>
          </div>
        )}

        {contact.phone1 && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Phone className="h-3 w-3 flex-shrink-0" />
            <span>{formatPhoneNumber(contact.phone1)}</span>
          </div>
        )}

        {contact.ideal_value && (
          <div className="flex items-center gap-2 text-xs font-semibold text-green-600 dark:text-green-500">
            <DollarSign className="h-3 w-3 flex-shrink-0" />
            <span>{contact.ideal_currency} {contact.ideal_value}</span>
          </div>
        )}

        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
          <Clock className="h-3 w-3" />
          <span>{new Date(contact.created_at).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  )
}
