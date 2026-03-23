'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Mail, Send, Inbox, MailPlus, FileText, Trash2, Loader2,
  Clock, ArrowLeft, PenSquare, FilePlus, Save, Eye
} from 'lucide-react'
import { toast } from 'sonner'
import { FRONT_EMAIL_HTML, applyTemplateVariables } from '@/lib/email-templates'

type EmailSignature = {
  id: string
  name: string
  html_content: string
  is_default: boolean
}

type EmailTemplate = {
  id: string
  name: string
  subject: string
  body: string
  html_body: string | null
  category: string | null
}

type Email = {
  id: string
  from_name: string
  from_email: string
  to_email: string[]
  cc_email: string[] | null
  subject: string
  body: string
  body_html: string | null
  direction: 'sent' | 'received'
  status: 'draft' | 'sent' | 'failed' | 'received'
  sent_at: string | null
  received_at: string | null
  created_at: string
  thread_id: string | null
}

type EmailSender = {
  id: string
  name: string
  email: string
  is_active: boolean
}

export default function EmailPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string>('')

  const [signatures, setSignatures] = useState<EmailSignature[]>([])
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [emails, setEmails] = useState<Email[]>([])
  const [senders, setSenders] = useState<EmailSender[]>([])

  const [composing, setComposing] = useState(false)
  const [replying, setReplying] = useState(false)
  const [replyToEmail, setReplyToEmail] = useState<Email | null>(null)
  const [editingDraft, setEditingDraft] = useState<Email | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [selectedSignature, setSelectedSignature] = useState<string>('')
  const [selectedSender, setSelectedSender] = useState<string>('')
  const [clientName, setClientName] = useState('')
  const [emailTo, setEmailTo] = useState('')
  const [emailCc, setEmailCc] = useState('')
  const [emailSubject, setEmailSubject] = useState('')
  const [emailBody, setEmailBody] = useState('')
  const [sending, setSending] = useState(false)
  const [savingDraft, setSavingDraft] = useState(false)

  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null)
  const [activeTab, setActiveTab] = useState('inbox')
  const [selectedInbox, setSelectedInbox] = useState<string>('all')

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (companyId) {
      loadEmails(companyId)
    }
  }, [selectedInbox, companyId])

  async function loadData() {
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/sign-in')
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id, email, role')
      .eq('id', user.id)
      .maybeSingle()

    if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
      router.push('/dashboard')
      return
    }

    setCompanyId(profile.company_id)
    setUserEmail(profile.email || user.email || '')

    await Promise.all([
      loadSignatures(profile.company_id),
      loadTemplates(profile.company_id),
      loadSenders(profile.company_id),
      loadEmails(profile.company_id)
    ])

    setLoading(false)
  }

  async function loadSignatures(companyId: string) {
    const supabase = createClient()
    const { data } = await supabase
      .from('email_signatures')
      .select('*')
      .eq('company_id', companyId)
      .order('is_default', { ascending: false })

    if (data) {
      setSignatures(data)
      const defaultSig = data.find(s => s.is_default)
      if (defaultSig) setSelectedSignature(defaultSig.id)
    }
  }

  async function loadTemplates(companyId: string) {
    const supabase = createClient()
    const { data } = await supabase
      .from('email_templates')
      .select('*')
      .eq('company_id', companyId)
      .order('name', { ascending: true })

    if (data) setTemplates(data)
  }

  async function loadSenders(companyId: string) {
    const supabase = createClient()
    const { data } = await supabase
      .from('email_senders')
      .select('*')
      .eq('company_id', companyId)
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (data) {
      setSenders(data)
      if (data.length > 0 && !selectedSender) {
        setSelectedSender(data[0].id)
      }
    }
  }

  async function loadEmails(companyId: string) {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('emails')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(200)

    if (error) {
      console.error('Error loading emails:', error)
      toast.error(`Failed to load emails: ${error.message}`)
      return
    }

    console.log('Loaded emails:', data?.length || 0, 'emails')
    if (data) {
      setEmails(data)
      console.log('Inbox emails:', data.filter(e => e.direction === 'received' && e.status === 'received').length)
      console.log('Sent emails:', data.filter(e => e.direction === 'sent' && e.status === 'sent').length)
      console.log('Draft emails:', data.filter(e => e.status === 'draft').length)
    }
  }

  async function applyTemplate(templateId: string) {
    const template = templates.find(t => t.id === templateId)
    if (!template) return

    const signature = signatures.find(s => s.id === selectedSignature)

    let finalBody = template.html_body || template.body || ''

    // If body starts with USE_FILE:, load the actual template
    if (finalBody.startsWith('USE_FILE:')) {
      const filename = finalBody.replace('USE_FILE:', '')
      try {
        const response = await fetch(`/email-templates/${filename}`)
        if (response.ok) {
          finalBody = await response.text()
        }
      } catch (error) {
        console.error('Error loading template:', error)
      }
    }

    // Replace [Client Name] with actual client name if provided
    const displayName = clientName || '[Client Name]'
    finalBody = finalBody.replace(/\[Client Name\]/g, displayName)

    // If using the Front Email template, apply variables
    if (finalBody.includes('USE_FILE:frontkumbra.html') || template.name.toLowerCase().includes('front')) {
      finalBody = applyTemplateVariables(FRONT_EMAIL_HTML, {
        contactName: displayName,
        brokerName: 'Daniel Cavanaugh',
        brokerEmail: userEmail,
        signature: signature?.html_content || ''
      })
    } else if (signature) {
      // For other templates, first remove any existing signatures (both wrapped and unwrapped)
      signatures.forEach(sig => {
        // Remove unwrapped signature
        if (finalBody.includes(sig.html_content)) {
          finalBody = finalBody.replace(sig.html_content, '')
        }
        // Remove wrapped signature
        const wrappedSig = `
        <div style="max-width: 600px; margin: 0 auto; padding: 0 20px;">
          ${sig.html_content}
        </div>
      `
        if (finalBody.includes(wrappedSig)) {
          finalBody = finalBody.replace(wrappedSig, '')
        }
      })

      // Wrap signature in centered container with padding
      const wrappedSignature = `
        <div style="max-width: 600px; margin: 0 auto; padding: 0 20px;">
          ${signature.html_content}
        </div>
      `

      // Then append the selected signature before closing tags
      // Insert signature before </body> tag
      if (finalBody.includes('</body>')) {
        finalBody = finalBody.replace('</body>', wrappedSignature + '\n</body>')
      } else if (finalBody.includes('</html>')) {
        finalBody = finalBody.replace('</html>', wrappedSignature + '\n</html>')
      } else {
        finalBody += wrappedSignature
      }
    }

    setEmailSubject(template.subject)
    setEmailBody(finalBody)
    setSelectedTemplate(templateId)
  }

  function updateSender(senderId: string) {
    setSelectedSender(senderId)

    const sender = senders.find(s => s.id === senderId)
    if (!sender) return

    const matchingSignature = signatures.find(sig => {
      const sigLower = sig.name.toLowerCase()
      const senderLower = sender.name.toLowerCase()
      return sigLower.includes(senderLower) ||
             sigLower === senderLower ||
             senderLower.split(' ').every(word => sigLower.includes(word))
    })

    if (matchingSignature) {
      setSelectedSignature(matchingSignature.id)

      if (selectedTemplate) {
        setTimeout(() => {
          applyTemplate(selectedTemplate)
        }, 100)
      }
    }
  }

  function startReply(email: Email) {
    setReplyToEmail(email)
    setReplying(true)
    setComposing(true)
    setEmailTo(email.from_email)
    setEmailSubject(email.subject.startsWith('Re:') ? email.subject : `Re: ${email.subject}`)
    setEmailBody('')
    setSelectedEmail(null)

    if (selectedSender && selectedSignature) {
      const signature = signatures.find(s => s.id === selectedSignature)
      if (signature) {
        const matchingSender = senders.find(s => s.id === selectedSender)
        if (matchingSender) {
          setSelectedSender(matchingSender.id)
        }
      }
    }
  }

  async function refreshPreview() {
    if (selectedTemplate) {
      await applyTemplate(selectedTemplate)
      toast.success('Preview refreshed')
    } else {
      toast.info('Please select a template first')
    }
  }

  async function saveDraft() {
    if (!companyId) return

    setSavingDraft(true)
    const supabase = createClient()

    const toEmails = emailTo.split(',').map(e => e.trim()).filter(Boolean)
    const ccEmails = emailCc ? emailCc.split(',').map(e => e.trim()).filter(Boolean) : []

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Not authenticated')
      setSavingDraft(false)
      return
    }

    const { error } = await supabase
      .from('emails')
      .insert({
        company_id: companyId,
        from_name: 'Draft',
        from_email: userEmail,
        to_email: toEmails,
        cc_email: ccEmails.length > 0 ? ccEmails : null,
        subject: emailSubject || '(No Subject)',
        body: emailBody.replace(/<[^>]*>/g, ''),
        body_html: emailBody,
        direction: 'sent',
        status: 'draft',
        user_id: user.id
      })

    if (error) {
      toast.error('Failed to save draft')
    } else {
      toast.success('Draft saved successfully')
      if (companyId) loadEmails(companyId)
    }

    setSavingDraft(false)
  }

  async function sendEmail() {
    if (!companyId) return
    if (!emailTo.trim()) {
      toast.error('Please enter recipient email(s)')
      return
    }
    if (!emailSubject.trim()) {
      toast.error('Please enter email subject')
      return
    }
    if (!selectedSender) {
      toast.error('Please select a sender')
      return
    }

    setSending(true)
    const supabase = createClient()

    const toEmails = emailTo.split(',').map(e => e.trim()).filter(Boolean)
    const ccEmails = emailCc ? emailCc.split(',').map(e => e.trim()).filter(Boolean) : []

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      toast.error('Not authenticated')
      setSending(false)
      return
    }

    const sender = senders.find(s => s.id === selectedSender)
    if (!sender) {
      toast.error('Invalid sender selected')
      setSending(false)
      return
    }

    const signature = selectedSignature !== 'none' ? signatures.find(s => s.id === selectedSignature) : null

    let finalBodyHtml = emailBody
    let finalBodyText = emailBody.replace(/<[^>]*>/g, '')

    const isHtmlEmail = emailBody.trim().startsWith('<!DOCTYPE') || emailBody.trim().startsWith('<html')

    const bodyLowerCase = emailBody.toLowerCase()
    const hasSignatureInBody = bodyLowerCase.includes('kumbra capital ltd') ||
                                 bodyLowerCase.includes('disclaimer:') ||
                                 bodyLowerCase.includes('senior advisor') ||
                                 bodyLowerCase.includes('head of public relations')

    if (!isHtmlEmail && !hasSignatureInBody && signature && signature.html_content) {
      finalBodyHtml = emailBody.replace(/\n/g, '<br>')
      finalBodyHtml += '<br><br>' + signature.html_content
    } else if (isHtmlEmail && !hasSignatureInBody && signature && signature.html_content) {
      if (finalBodyHtml.includes('</body>')) {
        finalBodyHtml = finalBodyHtml.replace('</body>', '<br><br>' + signature.html_content + '</body>')
      } else {
        finalBodyHtml += '<br><br>' + signature.html_content
      }
    } else {
      finalBodyHtml = emailBody
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: toEmails,
          cc: ccEmails.length > 0 ? ccEmails : undefined,
          subject: emailSubject,
          bodyHtml: finalBodyHtml,
          bodyText: finalBodyText,
          fromEmail: sender.email,
          fromName: sender.name,
          threadId: replyToEmail?.thread_id || replyToEmail?.id || undefined
        })
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Email sent successfully!')

        if (editingDraft) {
          await supabase
            .from('emails')
            .delete()
            .eq('id', editingDraft.id)
        }

        setComposing(false)
        resetComposer()
        setActiveTab('sent')

        if (companyId) {
          setTimeout(() => {
            loadEmails(companyId)
          }, 500)
        }
      } else {
        toast.error(result.error || 'Failed to send email')
      }
    } catch (error) {
      console.error('Error sending email:', error)
      toast.error('Failed to send email')
    }

    setSending(false)
  }

  function resetComposer() {
    setClientName('')
    setEmailTo('')
    setEmailCc('')
    setEmailSubject('')
    setEmailBody('')
    setSelectedTemplate('')
    setReplying(false)
    setReplyToEmail(null)
    setEditingDraft(null)
  }

  function openDraft(email: Email) {
    setEditingDraft(email)
    setComposing(true)
    setEmailTo(email.to_email.join(', '))
    setEmailCc(email.cc_email ? email.cc_email.join(', ') : '')
    setEmailSubject(email.subject)
    setEmailBody(email.body_html || email.body)

    const senderEmail = email.from_email
    const matchingSender = senders.find(s => s.email === senderEmail)
    if (matchingSender) {
      setSelectedSender(matchingSender.id)
    }

    if (!selectedSignature && signatures.length > 0) {
      const defaultSignature = signatures.find(s => s.is_default)
      if (defaultSignature) {
        setSelectedSignature(defaultSignature.id)
      }
    }
  }

  async function deleteDraft(draftId: string, event: React.MouseEvent) {
    event.stopPropagation()

    if (!confirm('Are you sure you want to delete this draft?')) {
      return
    }

    const supabase = createClient()
    const { error } = await supabase
      .from('emails')
      .delete()
      .eq('id', draftId)

    if (error) {
      toast.error('Failed to delete draft')
    } else {
      toast.success('Draft deleted')
      if (companyId) loadEmails(companyId)
    }
  }

  function viewEmail(email: Email) {
    setSelectedEmail(email)
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading email system...</p>
        </div>
      </div>
    )
  }

  let inboxEmails = emails.filter(e => e.direction === 'received' && e.status === 'received')

  if (selectedInbox === 'daniel') {
    inboxEmails = inboxEmails.filter(e =>
      e.to_email.includes('daniel.cavanaugh@kumbracapital.com') ||
      e.to_email.includes('d.cavanaugh@kumbracapital.com')
    )
  } else if (selectedInbox === 'david') {
    inboxEmails = inboxEmails.filter(e => e.to_email.includes('david.perry@kumbracapital.com'))
  }

  const sentEmails = emails.filter(e => e.direction === 'sent' && e.status === 'sent')
  const draftEmails = emails.filter(e => e.status === 'draft')

  function groupEmailsByThread(emailList: Email[]) {
    const threads = new Map<string, Email[]>()
    const standaloneEmails: Email[] = []

    emailList.forEach(email => {
      const threadId = email.thread_id || email.id
      if (email.thread_id) {
        if (!threads.has(threadId)) {
          threads.set(threadId, [])
        }
        threads.get(threadId)!.push(email)
      } else {
        standaloneEmails.push(email)
      }
    })

    threads.forEach(threadEmails => {
      threadEmails.sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
    })

    return { threads, standaloneEmails }
  }

  function getThreadPreview(threadEmails: Email[]) {
    const latest = threadEmails[0]
    const count = threadEmails.length
    return { latest, count }
  }

  const { threads: inboxThreads, standaloneEmails: standaloneInbox } = groupEmailsByThread(inboxEmails)
  const { threads: sentThreads, standaloneEmails: standaloneSent } = groupEmailsByThread(sentEmails)

  if (composing) {
    return (
      <div className="flex h-screen flex-col bg-background">
        <div className="border-b">
          <div className="flex items-center gap-4 p-4">
            <Button variant="ghost" size="sm" onClick={() => setComposing(false)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-xl font-semibold">
              {editingDraft ? 'Edit Draft' : replying ? 'Reply to Email' : 'New Email'}
            </h1>
            <div className="ml-auto flex gap-2">
              <Button variant="outline" size="sm" onClick={saveDraft} disabled={savingDraft}>
                <Save className="h-4 w-4 mr-2" />
                {savingDraft ? 'Saving...' : 'Save Draft'}
              </Button>
              <Button size="sm" onClick={sendEmail} disabled={sending}>
                <Send className="h-4 w-4 mr-2" />
                {sending ? 'Sending...' : 'Send'}
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6">
          <div className="mx-auto max-w-4xl space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Send As</Label>
                <Select value={selectedSender} onValueChange={updateSender}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select sender" />
                  </SelectTrigger>
                  <SelectContent>
                    {senders.map((sender) => (
                      <SelectItem key={sender.id} value={sender.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{sender.name}</span>
                          <span className="text-xs text-muted-foreground">{sender.email}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Email Signature</Label>
                <Select value={selectedSignature} onValueChange={setSelectedSignature}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select signature" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      <span className="text-muted-foreground">No signature</span>
                    </SelectItem>
                    {signatures.map((sig) => (
                      <SelectItem key={sig.id} value={sig.id}>
                        {sig.name} {sig.is_default && <span className="text-xs text-muted-foreground">(Default)</span>}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Template</Label>
              <Select value={selectedTemplate} onValueChange={applyTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose template (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Client Name (for email personalization)</Label>
              <Input
                placeholder="e.g., John Smith"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
              />
            </div>

            {selectedTemplate && (
              <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={refreshPreview}>
                  <Mail className="h-4 w-4 mr-2" />
                  Refresh Preview
                </Button>
              </div>
            )}

            <div>
              <Label>To</Label>
              <Input
                placeholder="recipient@example.com"
                value={emailTo}
                onChange={(e) => setEmailTo(e.target.value)}
              />
            </div>

            <div>
              <Label>CC (optional)</Label>
              <Input
                placeholder="cc@example.com"
                value={emailCc}
                onChange={(e) => setEmailCc(e.target.value)}
              />
            </div>

            <div>
              <Label>Subject</Label>
              <Input
                placeholder="Email subject"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
              />
            </div>

            <div>
              <Label>Body</Label>
              <Textarea
                placeholder="Email body..."
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                rows={12}
                className="font-mono text-sm"
              />
            </div>

            <Card className="border-2 border-primary/20">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Email Preview (How it will look when sent)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {emailBody || selectedSignature ? (
                  <div className="space-y-4">
                    <div className="text-sm border-b pb-2 space-y-1">
                      <div><strong>From:</strong> {senders.find(s => s.id === selectedSender)?.name || 'Not selected'} &lt;{senders.find(s => s.id === selectedSender)?.email || 'Not selected'}&gt;</div>
                      <div><strong>To:</strong> {emailTo || 'Not entered'}</div>
                      {emailCc && <div><strong>CC:</strong> {emailCc}</div>}
                      <div><strong>Subject:</strong> {emailSubject || 'No subject'}</div>
                    </div>
                    <div
                      className="prose prose-sm max-w-none bg-muted/30 p-4 rounded-lg"
                      dangerouslySetInnerHTML={{
                        __html: (() => {
                          const isHtml = emailBody.trim().startsWith('<!DOCTYPE') || emailBody.trim().startsWith('<html')
                          let preview = emailBody

                          if (!isHtml && emailBody) {
                            preview = emailBody.replace(/\n/g, '<br>')
                          }

                          const previewLowerCase = preview.toLowerCase()
                          const hasSignatureInPreview = previewLowerCase.includes('kumbra capital ltd') ||
                                                         previewLowerCase.includes('disclaimer:') ||
                                                         previewLowerCase.includes('senior advisor') ||
                                                         previewLowerCase.includes('head of public relations')

                          const signature = signatures.find(s => s.id === selectedSignature)
                          if (signature && signature.html_content && !hasSignatureInPreview) {
                            if (isHtml && preview.includes('</body>')) {
                              preview = preview.replace('</body>', '<br><br>' + signature.html_content + '</body>')
                            } else {
                              preview += (emailBody ? '<br><br>' : '') + signature.html_content
                            }
                          }

                          return preview || '<em class="text-muted-foreground">Start typing to see preview...</em>'
                        })()
                      }}
                    />
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Start typing your message to see a preview
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (selectedEmail) {
    const threadId = selectedEmail.thread_id || selectedEmail.id
    const threadEmails = emails
      .filter(e => e.thread_id === threadId || e.id === threadId)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

    return (
      <div className="flex h-screen flex-col bg-background">
        <div className="border-b">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => setSelectedEmail(null)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-xl font-semibold">{selectedEmail.subject}</h1>
                {threadEmails.length > 1 && (
                  <Badge variant="secondary" className="mt-1">
                    {threadEmails.length} messages
                  </Badge>
                )}
              </div>
            </div>
            {selectedEmail.direction === 'received' && (
              <Button onClick={() => startReply(selectedEmail)} className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700">
                <Send className="h-4 w-4 mr-2" />
                Reply
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="flex-1 p-6">
          <div className="mx-auto max-w-4xl space-y-4">
            {threadEmails.map((email, index) => (
              <div key={email.id}>
                {index > 0 && <Separator className="my-4" />}
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{email.from_name}</p>
                        <span className="text-xs text-muted-foreground">&lt;{email.from_email}&gt;</span>
                        {email.direction === 'sent' && (
                          <Badge variant="outline" className="text-xs">Sent</Badge>
                        )}
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">To:</span>
                          <span>{email.to_email.join(', ')}</span>
                        </div>
                        {email.cc_email && email.cc_email.length > 0 && (
                          <div className="flex items-center gap-2">
                            <span className="font-medium">CC:</span>
                            <span>{email.cc_email.join(', ')}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3" />
                          <span>
                            {new Date(email.sent_at || email.received_at || email.created_at).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Card>
                    <CardContent className="p-6">
                      <div
                        className="prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{
                          __html: email.body_html || email.body.replace(/\n/g, '<br>')
                        }}
                      />
                    </CardContent>
                  </Card>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      <div className="border-b">
        <div className="flex items-center justify-between p-4">
          <div>
            <h1 className="text-2xl font-bold">Email Management</h1>
            <p className="text-sm text-muted-foreground">{userEmail}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => companyId && loadEmails(companyId)}>
              <Mail className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={() => setComposing(true)}>
              <PenSquare className="h-4 w-4 mr-2" />
              Compose
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="border-b px-4 py-3 flex gap-2">
          <Button
            variant={selectedInbox === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedInbox('all')}
          >
            All Emails
          </Button>
          <Button
            variant={selectedInbox === 'daniel' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedInbox('daniel')}
          >
            Daniel Cavanaugh
          </Button>
          <Button
            variant={selectedInbox === 'david' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedInbox('david')}
          >
            David Perry
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <div className="border-b px-4">
            <TabsList>
              <TabsTrigger value="inbox" className="gap-2">
                <Inbox className="h-4 w-4" />
                Inbox
                {inboxEmails.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {inboxEmails.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="sent" className="gap-2">
                <Send className="h-4 w-4" />
                Sent
                {sentEmails.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {sentEmails.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="drafts" className="gap-2">
                <FileText className="h-4 w-4" />
                Drafts
                {draftEmails.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {draftEmails.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-hidden">
            <TabsContent value="inbox" className="m-0 h-full">
              {inboxEmails.length === 0 ? (
                <Card className="m-4">
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <Inbox className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No emails in inbox</p>
                  </CardContent>
                </Card>
              ) : (
                <ScrollArea className="h-full w-full">
                  <div className="space-y-2 p-4">
                    {Array.from(inboxThreads.entries()).map(([threadId, threadEmails]) => {
                      const { latest, count } = getThreadPreview(threadEmails)
                      return (
                        <Card
                          key={threadId}
                          className="cursor-pointer transition-colors hover:bg-accent"
                          onClick={() => viewEmail(latest)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-medium truncate">{latest.from_name}</p>
                                  {count > 1 && (
                                    <Badge variant="secondary" className="text-xs">
                                      {count} messages
                                    </Badge>
                                  )}
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(latest.received_at || latest.created_at).toLocaleDateString()}
                                  </span>
                                </div>
                                <p className="font-semibold text-sm mb-1 truncate">{latest.subject}</p>
                                <div
                                  className="text-xs text-muted-foreground line-clamp-2"
                                  dangerouslySetInnerHTML={{
                                    __html: latest.body_html?.substring(0, 150) || latest.body.substring(0, 150)
                                  }}
                                />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                    {standaloneInbox.map((email) => (
                      <Card
                        key={email.id}
                        className="cursor-pointer transition-colors hover:bg-accent"
                        onClick={() => viewEmail(email)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-medium truncate">{email.from_name}</p>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(email.received_at || email.created_at).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="font-semibold text-sm mb-1 truncate">{email.subject}</p>
                              <div
                                className="text-xs text-muted-foreground line-clamp-2"
                                dangerouslySetInnerHTML={{
                                  __html: email.body_html?.substring(0, 150) || email.body.substring(0, 150)
                                }}
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>

            <TabsContent value="sent" className="m-0 h-full">
              {sentEmails.length === 0 ? (
                <Card className="m-4">
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <Send className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No sent emails</p>
                  </CardContent>
                </Card>
              ) : (
                <ScrollArea className="h-full w-full">
                  <div className="space-y-2 p-4">
                    {sentEmails.map((email) => (
                      <Card
                        key={email.id}
                        className="cursor-pointer transition-colors hover:bg-accent"
                        onClick={() => viewEmail(email)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <Badge variant={email.status === 'sent' ? 'default' : email.status === 'failed' ? 'destructive' : 'secondary'} className="text-xs">
                                  {email.status === 'sent' ? 'Sent' : email.status === 'failed' ? 'Failed' : email.status}
                                </Badge>
                                <p className="font-medium truncate">To: {email.to_email.join(', ')}</p>
                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                  {new Date(email.sent_at || email.created_at).toLocaleString()}
                                </span>
                              </div>
                              <p className="font-semibold text-sm mb-1 truncate">{email.subject}</p>
                              <div
                                className="text-xs text-muted-foreground line-clamp-2"
                                dangerouslySetInnerHTML={{
                                  __html: email.body_html?.substring(0, 150) || email.body.substring(0, 150)
                                }}
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>

            <TabsContent value="drafts" className="m-0 h-full">
              {draftEmails.length === 0 ? (
                <Card className="m-4">
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No drafts</p>
                  </CardContent>
                </Card>
              ) : (
                <ScrollArea className="h-full w-full">
                  <div className="space-y-2 p-4">
                    {draftEmails.map((email) => (
                      <Card
                        key={email.id}
                        className="cursor-pointer transition-colors hover:bg-accent"
                        onClick={() => openDraft(email)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline">Draft</Badge>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(email.created_at).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="font-semibold text-sm mb-1 truncate">{email.subject}</p>
                              <p className="text-xs text-muted-foreground truncate">
                                To: {email.to_email.join(', ')}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => deleteDraft(email.id, e)}
                              className="h-8 w-8 p-0 shrink-0"
                            >
                              <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  )
}
