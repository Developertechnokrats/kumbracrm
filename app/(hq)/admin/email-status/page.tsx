"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, AlertCircle, Mail, MailOpen, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface EmailSyncStatus {
  id: string;
  company_id: string;
  sync_type: 'inbound' | 'outbound';
  last_sync_at: string;
  last_success_at: string | null;
  last_error_at: string | null;
  last_error_message: string | null;
  total_received: number;
  total_sent: number;
  total_errors: number;
  created_at: string;
  updated_at: string;
}

export default function EmailStatusPage() {
  const [inboundStatus, setInboundStatus] = useState<EmailSyncStatus | null>(null);
  const [outboundStatus, setOutboundStatus] = useState<EmailSyncStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadEmailStatus();
    const interval = setInterval(loadEmailStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  async function loadEmailStatus() {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .single();

      if (!profile?.company_id) return;

      const { data: statuses } = await supabase
        .from("email_sync_status")
        .select("*")
        .eq("company_id", profile.company_id);

      if (statuses) {
        setInboundStatus(statuses.find(s => s.sync_type === 'inbound') || null);
        setOutboundStatus(statuses.find(s => s.sync_type === 'outbound') || null);
      }
    } catch (error) {
      console.error("Error loading email status:", error);
    } finally {
      setLoading(false);
    }
  }

  function getStatusBadge(status: EmailSyncStatus | null) {
    if (!status) {
      return <Badge variant="outline" className="gap-1"><AlertCircle className="h-3 w-3" /> No Data</Badge>;
    }

    if (status.last_error_at) {
      const errorTime = new Date(status.last_error_at).getTime();
      const successTime = status.last_success_at ? new Date(status.last_success_at).getTime() : 0;

      if (errorTime > successTime) {
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> Error</Badge>;
      }
    }

    if (status.last_success_at) {
      return <Badge variant="default" className="gap-1 bg-green-600"><CheckCircle2 className="h-3 w-3" /> Healthy</Badge>;
    }

    return <Badge variant="outline" className="gap-1"><AlertCircle className="h-3 w-3" /> Unknown</Badge>;
  }

  function formatTime(dateString: string | null) {
    if (!dateString) return "Never";
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return "Invalid date";
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading email status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Email System Status</h1>
        <p className="text-muted-foreground mt-1">
          Real-time monitoring of your email sending and receiving systems
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MailOpen className="h-5 w-5 text-blue-600" />
                <CardTitle>Incoming Emails</CardTitle>
              </div>
              {getStatusBadge(inboundStatus)}
            </div>
            <CardDescription>
              Emails received from external senders via SendGrid webhook
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {inboundStatus ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Received</p>
                    <p className="text-2xl font-bold">{inboundStatus.total_received}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Errors</p>
                    <p className="text-2xl font-bold text-red-600">{inboundStatus.total_errors}</p>
                  </div>
                </div>

                <div className="space-y-2 pt-4 border-t">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Last Check:</span>
                    <span className="font-medium">{formatTime(inboundStatus.last_sync_at)}</span>
                  </div>

                  {inboundStatus.last_success_at && (
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-muted-foreground">Last Success:</span>
                      <span className="font-medium">{formatTime(inboundStatus.last_success_at)}</span>
                    </div>
                  )}

                  {inboundStatus.last_error_at && (
                    <>
                      <div className="flex items-center gap-2 text-sm">
                        <XCircle className="h-4 w-4 text-red-600" />
                        <span className="text-muted-foreground">Last Error:</span>
                        <span className="font-medium">{formatTime(inboundStatus.last_error_at)}</span>
                      </div>
                      {inboundStatus.last_error_message && (
                        <div className="mt-2 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-md">
                          <p className="text-sm text-red-800 dark:text-red-300 font-mono">
                            {inboundStatus.last_error_message}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <MailOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No incoming email data yet</p>
                <p className="text-sm mt-1">Data will appear once emails are received</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-purple-600" />
                <CardTitle>Outgoing Emails</CardTitle>
              </div>
              {getStatusBadge(outboundStatus)}
            </div>
            <CardDescription>
              Emails sent to contacts via SendGrid API
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {outboundStatus ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Sent</p>
                    <p className="text-2xl font-bold">{outboundStatus.total_sent}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Errors</p>
                    <p className="text-2xl font-bold text-red-600">{outboundStatus.total_errors}</p>
                  </div>
                </div>

                <div className="space-y-2 pt-4 border-t">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Last Check:</span>
                    <span className="font-medium">{formatTime(outboundStatus.last_sync_at)}</span>
                  </div>

                  {outboundStatus.last_success_at && (
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-muted-foreground">Last Success:</span>
                      <span className="font-medium">{formatTime(outboundStatus.last_success_at)}</span>
                    </div>
                  )}

                  {outboundStatus.last_error_at && (
                    <>
                      <div className="flex items-center gap-2 text-sm">
                        <XCircle className="h-4 w-4 text-red-600" />
                        <span className="text-muted-foreground">Last Error:</span>
                        <span className="font-medium">{formatTime(outboundStatus.last_error_at)}</span>
                      </div>
                      {outboundStatus.last_error_message && (
                        <div className="mt-2 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-md">
                          <p className="text-sm text-red-800 dark:text-red-300 font-mono">
                            {outboundStatus.last_error_message}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Mail className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No outgoing email data yet</p>
                <p className="text-sm mt-1">Data will appear once emails are sent</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System Health Summary</CardTitle>
          <CardDescription>Overall email system performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground">Total Received</p>
              <p className="text-3xl font-bold text-blue-600">{inboundStatus?.total_received || 0}</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground">Total Sent</p>
              <p className="text-3xl font-bold text-purple-600">{outboundStatus?.total_sent || 0}</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground">Success Rate</p>
              <p className="text-3xl font-bold text-green-600">
                {(() => {
                  const total = (inboundStatus?.total_received || 0) + (outboundStatus?.total_sent || 0);
                  const errors = (inboundStatus?.total_errors || 0) + (outboundStatus?.total_errors || 0);
                  if (total === 0) return "N/A";
                  return `${Math.round(((total - errors) / total) * 100)}%`;
                })()}
              </p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground">Total Errors</p>
              <p className="text-3xl font-bold text-red-600">
                {(inboundStatus?.total_errors || 0) + (outboundStatus?.total_errors || 0)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-xs text-muted-foreground text-center">
        Auto-refreshes every 30 seconds • Last updated: {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
}
