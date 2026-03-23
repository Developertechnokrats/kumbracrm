'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Phone, Mail, DollarSign, User, Clock } from 'lucide-react'
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
  ideal_value: string | null
  ideal_currency: string | null
  created_at: string
}

type KanbanColumn = {
  id: string
  title: string
  statuses: string[]
  color: string
  collapsed?: boolean
}

const KANBAN_COLUMNS: KanbanColumn[] = [
  {
    id: 'new',
    title: 'New Leads',
    statuses: ['Fresh Lead'],
    color: 'bg-blue-500'
  },
  {
    id: 'qualifying',
    title: 'Qualifying',
    statuses: ['Call Backs', 'KYC In', 'Apps In'],
    color: 'bg-yellow-500'
  },
  {
    id: 'onboarding',
    title: 'Onboarding',
    statuses: ['Agreement Signed', 'TT Received', 'Fronted'],
    color: 'bg-orange-500'
  },
  {
    id: 'active',
    title: 'Active Clients',
    statuses: ['Banked', 'Paid Client'],
    color: 'bg-green-600'
  },
  {
    id: 'attention',
    title: 'Needs Attention',
    statuses: ['Kickers'],
    color: 'bg-red-500'
  },
  {
    id: 'dead',
    title: 'Dead Box',
    statuses: ['Dead Box'],
    color: 'bg-gray-400'
  }
]

interface KanbanViewProps {
  contacts: Contact[]
  onRefresh: () => void
}

export function KanbanView({ contacts, onRefresh }: KanbanViewProps) {
  const router = useRouter()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [collapsedColumns, setCollapsedColumns] = useState<Set<string>>(new Set(['dead']))

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

  const groupedContacts = KANBAN_COLUMNS.reduce((acc, column) => {
    acc[column.id] = contacts.filter(c => column.statuses.includes(c.status || ''))
    return acc
  }, {} as Record<string, Contact[]>)

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string)
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event

    if (!over) {
      setActiveId(null)
      return
    }

    const contact = contacts.find(c => c.id === active.id)
    if (!contact) {
      setActiveId(null)
      return
    }

    const overColumnId = over.id as string
    const targetColumn = KANBAN_COLUMNS.find(col => col.id === overColumnId)

    if (!targetColumn) {
      setActiveId(null)
      return
    }

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

    setActiveId(null)
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
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {KANBAN_COLUMNS.map(column => {
          const columnContacts = groupedContacts[column.id] || []
          const isCollapsed = collapsedColumns.has(column.id)

          return (
            <div
              key={column.id}
              className={cn(
                "flex-shrink-0 transition-all",
                isCollapsed ? "w-16" : "w-80"
              )}
            >
              <Card className="border-none shadow-xl h-full">
                <CardHeader
                  className={cn(
                    "border-b cursor-pointer",
                    "bg-gradient-to-r from-slate-50 to-blue-50"
                  )}
                  onClick={() => toggleColumn(column.id)}
                >
                  <div className="flex items-center justify-between">
                    {isCollapsed ? (
                      <div className="flex flex-col items-center gap-2 w-full">
                        <div className={cn("w-3 h-3 rounded-full", column.color)} />
                        <p className="text-sm font-bold writing-mode-vertical text-center transform rotate-180">
                          {column.title}
                        </p>
                        <Badge variant="secondary" className="rounded-full">
                          {columnContacts.length}
                        </Badge>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <div className={cn("w-3 h-3 rounded-full", column.color)} />
                          <CardTitle className="text-lg">{column.title}</CardTitle>
                        </div>
                        <Badge variant="secondary" className="text-lg px-3 py-1">
                          {columnContacts.length}
                        </Badge>
                      </>
                    )}
                  </div>
                </CardHeader>

                {!isCollapsed && (
                  <CardContent className="p-4 space-y-3 h-[calc(100vh-250px)] overflow-y-auto">
                    <SortableContext
                      items={columnContacts.map(c => c.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {columnContacts.map(contact => (
                        <ContactCard
                          key={contact.id}
                          contact={contact}
                          color={column.color}
                          onClick={() => router.push(`/contacts/${contact.id}`)}
                        />
                      ))}
                    </SortableContext>

                    {columnContacts.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground text-sm">
                        No contacts
                      </div>
                    )}

                    <div
                      className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center text-sm text-muted-foreground"
                      onDragOver={(e) => e.preventDefault()}
                    >
                      Drop here to move
                    </div>
                  </CardContent>
                )}
              </Card>
            </div>
          )
        })}
      </div>

      <DragOverlay>
        {activeContact && (
          <div className="rotate-3 opacity-90">
            <ContactCard
              contact={activeContact}
              color="bg-blue-500"
              onClick={() => {}}
              isDragging
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}

interface ContactCardProps {
  contact: Contact
  color: string
  onClick: () => void
  isDragging?: boolean
}

function ContactCard({ contact, color, onClick, isDragging = false }: ContactCardProps) {
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
    opacity: isSortableDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={cn(
        "bg-white border-2 rounded-xl p-4 cursor-pointer transition-all hover:shadow-lg",
        "border-slate-200 hover:border-blue-400",
        isDragging && "shadow-2xl"
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <h4 className="font-bold text-slate-900 text-base leading-tight">
          {contact.full_name}
        </h4>
        <div className={cn("w-2 h-2 rounded-full flex-shrink-0 mt-1", color)} />
      </div>

      <div className="space-y-2">
        {contact.email && (
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <Mail className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{contact.email}</span>
          </div>
        )}

        {contact.phone1 && (
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <Phone className="h-3 w-3 flex-shrink-0" />
            <span>{contact.phone1}</span>
          </div>
        )}

        {contact.ideal_value && (
          <div className="flex items-center gap-2 text-xs font-semibold text-green-700">
            <DollarSign className="h-3 w-3 flex-shrink-0" />
            <span>{contact.ideal_currency} {contact.ideal_value}</span>
          </div>
        )}

        <div className="flex items-center gap-2 text-xs text-slate-400 pt-2 border-t">
          <Clock className="h-3 w-3" />
          <span>{new Date(contact.created_at).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  )
}
