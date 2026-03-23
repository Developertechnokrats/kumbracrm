"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Mail, Reply, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { EmailComposer } from "./email-composer";

interface Email {
  id: string;
  from_email: string;
  from_name: string;
  to_email: string[];
  subject: string;
  body: string;
  body_html: string;
  direction: "inbound" | "outbound";
  status: string;
  created_at: string;
  opened_at?: string;
  clicked_at?: string;
}

interface EmailThread {
  id: string;
  subject: string;
  last_message_at: string;
  emails: Email[];
}

interface EmailThreadViewProps {
  contactId?: string;
  contactEmail?: string;
}

export function EmailThreadView({ contactId, contactEmail }: EmailThreadViewProps) {
  const [threads, setThreads] = useState<EmailThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedThread, setSelectedThread] = useState<EmailThread | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [replyThread, setReplyThread] = useState<EmailThread | null>(null);

  const supabase = createClient();

  useEffect(() => {
    loadThreads();
  }, [contactId]);

  const loadThreads = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from("email_threads")
        .select(`
          id,
          subject,
          last_message_at,
          emails (
            id,
            from_email,
            from_name,
            to_email,
            subject,
            body,
            body_html,
            direction,
            status,
            created_at,
            opened_at,
            clicked_at
          )
        `)
        .order("last_message_at", { ascending: false });

      if (contactId) {
        query = query.eq("contact_id", contactId);
      }

      const { data, error } = await query;

      if (error) throw error;

      setThreads(data as any || []);
    } catch (error) {
      console.error("Error loading threads:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleReply = (thread: EmailThread) => {
    setReplyThread(thread);
    setComposerOpen(true);
  };

  const handleComposerClose = () => {
    setComposerOpen(false);
    setReplyThread(null);
    loadThreads();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (threads.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No email threads found</p>
        {contactEmail && (
          <Button
            className="mt-4"
            onClick={() => setComposerOpen(true)}
          >
            <Mail className="mr-2 h-4 w-4" />
            Send Email
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {threads.map((thread) => (
        <Card key={thread.id}>
          <CardHeader className="cursor-pointer" onClick={() => setSelectedThread(selectedThread?.id === thread.id ? null : thread)}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-base">{thread.subject}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {thread.emails?.length || 0} message{thread.emails?.length !== 1 ? 's' : ''} · Last: {format(new Date(thread.last_message_at), "MMM d, yyyy 'at' h:mm a")}
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  handleReply(thread);
                }}
              >
                <Reply className="h-4 w-4 mr-2" />
                Reply
              </Button>
            </div>
          </CardHeader>

          {selectedThread?.id === thread.id && (
            <CardContent>
              <Separator className="mb-4" />
              <ScrollArea className="max-h-[500px]">
                <div className="space-y-4">
                  {thread.emails
                    ?.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                    .map((email) => (
                      <div key={email.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-medium">
                              {email.direction === "inbound" ? email.from_name || email.from_email : "You"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(email.created_at), "MMM d, yyyy 'at' h:mm a")}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Badge variant={email.direction === "outbound" ? "default" : "secondary"}>
                              {email.direction}
                            </Badge>
                            {email.direction === "outbound" && (
                              <Badge variant="outline" className="capitalize">
                                {email.status}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">
                          To: {Array.isArray(email.to_email) ? email.to_email.join(", ") : email.to_email}
                        </p>
                        <Separator className="my-2" />
                        <div className="prose prose-sm max-w-none bg-white p-4 rounded-md">
                          {email.body_html ? (
                            <div dangerouslySetInnerHTML={{ __html: email.body_html }} />
                          ) : (
                            <p className="whitespace-pre-wrap">{email.body}</p>
                          )}
                        </div>
                        {email.opened_at && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Opened: {format(new Date(email.opened_at), "MMM d, yyyy 'at' h:mm a")}
                          </p>
                        )}
                        {email.clicked_at && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Clicked: {format(new Date(email.clicked_at), "MMM d, yyyy 'at' h:mm a")}
                          </p>
                        )}
                      </div>
                    ))}
                </div>
              </ScrollArea>
            </CardContent>
          )}
        </Card>
      ))}

      <EmailComposer
        open={composerOpen}
        onOpenChange={handleComposerClose}
        defaultTo={contactEmail}
        contactId={contactId}
        threadId={replyThread?.id}
        defaultSubject={replyThread ? `Re: ${replyThread.subject}` : ""}
      />
    </div>
  );
}
