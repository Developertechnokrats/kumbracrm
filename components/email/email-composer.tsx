"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Loader as Loader2, Send, Eye } from "lucide-react";
import { FRONT_EMAIL_HTML, applyTemplateVariables } from "@/lib/email-templates";

interface EmailComposerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTo?: string;
  contactId?: string;
  contactName?: string;
  threadId?: string;
  defaultSubject?: string;
}

type EmailTemplate = {
  id: string;
  name: string;
  subject: string;
  body: string;
};

type EmailSignature = {
  id: string;
  name: string;
  html_content: string;
};

type EmailSender = {
  id: string;
  name: string;
  email: string;
};

export function EmailComposer({
  open,
  onOpenChange,
  defaultTo = "",
  contactId,
  contactName,
  threadId,
  defaultSubject = "",
}: EmailComposerProps) {
  const [to, setTo] = useState(defaultTo);
  const [cc, setCc] = useState("");
  const [subject, setSubject] = useState(defaultSubject);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [showCc, setShowCc] = useState(false);
  const [loading, setLoading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [signatures, setSignatures] = useState<EmailSignature[]>([]);
  const [senders, setSenders] = useState<EmailSender[]>([]);

  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [selectedSignature, setSelectedSignature] = useState("");
  const [selectedSender, setSelectedSender] = useState("");

  const [companyId, setCompanyId] = useState<string | null>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    if (open) {
      setTo(defaultTo);
      loadData();
    }
  }, [open, defaultTo]);

  async function loadData() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id, email, role')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile) return;

    setCompanyId(profile.company_id);
    setCurrentUserEmail(profile.email);

    const isAdmin = profile.role === 'admin' || profile.role === 'super_admin';

    const [templatesData, signaturesData, sendersData] = await Promise.all([
      supabase
        .from('email_templates')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('name'),
      supabase
        .from('email_signatures')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('is_default', { ascending: false }),
      supabase
        .from('email_senders')
        .select('*')
        .eq('company_id', profile.company_id)
        .eq('is_active', true)
    ]);

    if (templatesData.data) setTemplates(templatesData.data);
    if (signaturesData.data) {
      setSignatures(signaturesData.data);
      const defaultSig = signaturesData.data.find(s => s.is_default);
      if (defaultSig) setSelectedSignature(defaultSig.id);
    }
    if (sendersData.data) {
      const filteredSenders = isAdmin
        ? sendersData.data
        : sendersData.data.filter(s => s.email === profile.email);

      setSenders(filteredSenders);
      const userSender = filteredSenders.find(s => s.email === profile.email);
      if (userSender) {
        setSelectedSender(userSender.id);
      } else if (filteredSenders.length > 0) {
        setSelectedSender(filteredSenders[0].id);
      }
    }

    setLoading(false);
  }

  function applyTemplate(templateId: string) {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    let templateBody = template.body;
    let templateSubject = template.subject;

    const sender = senders.find(s => s.id === selectedSender);

    if (template.name === 'Front Email - Kumbra Capital') {
      const signature = signatures.find(s => s.id === selectedSignature);
      templateBody = applyTemplateVariables(FRONT_EMAIL_HTML, {
        contactName: contactName || '[Client Name]',
        brokerName: sender?.name || '[Broker Name]',
        brokerEmail: sender?.email || '',
        signature: signature?.html_content || ''
      });
    } else {
      if (contactName) {
        templateBody = templateBody.replace(/{{CONTACT_NAME}}/g, contactName);
        templateSubject = templateSubject.replace(/{{CONTACT_NAME}}/g, contactName);
      }

      if (sender) {
        templateBody = templateBody.replace(/{{BROKER_NAME}}/g, sender.name);
        templateSubject = templateSubject.replace(/{{BROKER_NAME}}/g, sender.name);
      }
    }

    setSubject(templateSubject);
    setBody(templateBody);
    setSelectedTemplate(templateId);
  }

  function getEmailPreview() {
    const signature = signatures.find(s => s.id === selectedSignature);
    const sender = senders.find(s => s.id === selectedSender);

    let emailBody = body;
    const isHtml = body.trim().startsWith('<!DOCTYPE') || body.trim().startsWith('<html');

    if (!isHtml && contactName && !body.trim().startsWith('Dear')) {
      emailBody = `Dear ${contactName},\n\n` + body;
    }

    return {
      from: sender ? `${sender.name} <${sender.email}>` : 'Unknown',
      to,
      subject,
      body: emailBody,
      signature: signature?.html_content || '',
      isHtml
    };
  }

  const handleSend = async () => {
    if (!selectedSender) {
      toast.error("Please select a sender");
      return;
    }
    if (!to || !subject || !body) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSending(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !companyId) {
        throw new Error("Not authenticated");
      }

      const sender = senders.find(s => s.id === selectedSender);
      if (!sender) {
        throw new Error("Sender not found");
      }

      const signature = signatures.find(s => s.id === selectedSignature);
      const toArray = to.split(",").map(e => e.trim()).filter(Boolean);
      const ccArray = cc ? cc.split(",").map(e => e.trim()).filter(Boolean) : [];

      let emailBody = body;
      if (contactName && !body.trim().startsWith('Dear')) {
        emailBody = `Dear ${contactName},\n\n` + body;
      }

      const { data: newEmail, error: insertError } = await supabase
        .from('emails')
        .insert({
          company_id: companyId,
          sender_id: selectedSender,
          from_name: sender.name,
          from_email: sender.email,
          to_email: toArray,
          cc_email: ccArray.length > 0 ? ccArray : null,
          subject,
          body: emailBody,
          signature_id: selectedSignature || null,
          template_id: selectedTemplate || null,
          direction: 'sent',
          status: 'draft',
          user_id: user.id,
          contact_id: contactId || null
        })
        .select()
        .maybeSingle();

      if (insertError || !newEmail) {
        throw new Error("Failed to create email record");
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("No active session");
      }

      const signatureHtml = signature?.html_content || '';

      let bodyHtml = '';
      const isHtmlEmail = emailBody.trim().startsWith('<!DOCTYPE') || emailBody.trim().startsWith('<html');

      if (isHtmlEmail) {
        bodyHtml = emailBody;
      } else {
        bodyHtml = emailBody.replace(/\n/g, '<br>') + '<br><br>' + signatureHtml;
      }

      const apiUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-email`;

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: toArray,
          cc: ccArray.length > 0 ? ccArray : undefined,
          subject,
          bodyText: emailBody,
          bodyHtml: bodyHtml,
          contactId: contactId || undefined
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to send email");
      }

      toast.success("Email sent successfully!");

      setTo("");
      setCc("");
      setSubject("");
      setBody("");
      setShowCc(false);
      setSelectedTemplate("");

      onOpenChange(false);
    } catch (error: any) {
      console.error("Error sending email:", error);
      toast.error(error.message || "Failed to send email");
    } finally {
      setSending(false);
    }
  };

  const preview = getEmailPreview();

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Compose Email</DialogTitle>
            {contactName && (
              <DialogDescription>Sending to {contactName}</DialogDescription>
            )}
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="sender-select">From *</Label>
                  <Select value={selectedSender} onValueChange={setSelectedSender}>
                    <SelectTrigger id="sender-select">
                      <SelectValue placeholder="Select sender" />
                    </SelectTrigger>
                    <SelectContent>
                      {senders.map((sender) => (
                        <SelectItem key={sender.id} value={sender.id}>
                          {sender.name} ({sender.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="signature-select">Signature</Label>
                  <Select value={selectedSignature} onValueChange={setSelectedSignature}>
                    <SelectTrigger id="signature-select">
                      <SelectValue placeholder="Select signature" />
                    </SelectTrigger>
                    <SelectContent>
                      {signatures.map((signature) => (
                        <SelectItem key={signature.id} value={signature.id}>
                          {signature.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {templates.length > 0 && (
                <div>
                  <Label htmlFor="template-select">Use Template (Optional)</Label>
                  <Select value={selectedTemplate} onValueChange={applyTemplate}>
                    <SelectTrigger id="template-select">
                      <SelectValue placeholder="Choose a template" />
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
              )}

              <div>
                <Label htmlFor="to">To *</Label>
                <Input
                  id="to"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  placeholder="recipient@example.com"
                  disabled={sending}
                />
              </div>

              {!showCc && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCc(true)}
                >
                  Add Cc
                </Button>
              )}

              {showCc && (
                <div>
                  <Label htmlFor="cc">Cc</Label>
                  <Input
                    id="cc"
                    value={cc}
                    onChange={(e) => setCc(e.target.value)}
                    placeholder="cc@example.com"
                    disabled={sending}
                  />
                </div>
              )}

              <div>
                <Label htmlFor="subject">Subject *</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Email subject"
                  disabled={sending}
                />
              </div>

              <div>
                <Label htmlFor="body">Message *</Label>
                {contactName && (
                  <p className="text-xs text-muted-foreground mb-1">
                    Email will start with: "Dear {contactName},"
                  </p>
                )}
                <Textarea
                  id="body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Type your message here..."
                  className="min-h-[250px]"
                  disabled={sending}
                />
              </div>

              {selectedSignature && signatures.find(s => s.id === selectedSignature) && (
                <Alert>
                  <AlertDescription>
                    <p className="text-sm font-medium mb-2">Signature Preview:</p>
                    <div
                      className="text-sm border-l-2 border-primary pl-3"
                      dangerouslySetInnerHTML={{
                        __html: signatures.find(s => s.id === selectedSignature)?.html_content || ''
                      }}
                    />
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={sending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPreviewOpen(true)}
              disabled={sending || !selectedSender || !to || !subject || !body}
            >
              <Eye className="mr-2 h-4 w-4" />
              Preview
            </Button>
            <Button
              onClick={handleSend}
              disabled={sending || !selectedSender || !to || !subject || !body}
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
            >
              {sending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Email
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Email Preview</DialogTitle>
            <DialogDescription>Review your email before sending</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2 text-sm">
              <div className="flex gap-2">
                <span className="font-semibold min-w-[60px]">From:</span>
                <span className="text-muted-foreground">{preview.from}</span>
              </div>
              <div className="flex gap-2">
                <span className="font-semibold min-w-[60px]">To:</span>
                <span className="text-muted-foreground">{preview.to}</span>
              </div>
              {cc && (
                <div className="flex gap-2">
                  <span className="font-semibold min-w-[60px]">Cc:</span>
                  <span className="text-muted-foreground">{cc}</span>
                </div>
              )}
              <div className="flex gap-2">
                <span className="font-semibold min-w-[60px]">Subject:</span>
                <span className="text-muted-foreground">{preview.subject}</span>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="prose max-w-none">
                {preview.isHtml ? (
                  <div
                    className="text-sm"
                    dangerouslySetInnerHTML={{ __html: preview.body }}
                  />
                ) : (
                  <>
                    <div className="whitespace-pre-wrap text-sm bg-muted/30 p-4 rounded-lg">
                      {preview.body}
                    </div>
                    {preview.signature && (
                      <div className="mt-4 pt-4 border-t">
                        <div
                          className="text-sm"
                          dangerouslySetInnerHTML={{ __html: preview.signature }}
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setPreviewOpen(false)}
            >
              Back to Edit
            </Button>
            <Button
              onClick={() => {
                setPreviewOpen(false);
                handleSend();
              }}
              disabled={sending}
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
            >
              {sending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Confirm & Send
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
