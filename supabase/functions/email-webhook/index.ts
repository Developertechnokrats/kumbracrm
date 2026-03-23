import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface SendGridInboundEmail {
  headers?: string;
  from?: string;
  to?: string;
  cc?: string;
  subject?: string;
  text?: string;
  html?: string;
  envelope?: string;
  SPF?: string;
  'message-id'?: string;
  [key: string]: any;
}

function extractEmailAddress(emailString: string): string {
  if (!emailString) return '';
  const match = emailString.match(/<([^>]+)>/);
  return match ? match[1] : emailString.trim();
}

function normalizeEmailAddresses(emailString: string | string[]): string[] {
  if (Array.isArray(emailString)) {
    return emailString.map(e => extractEmailAddress(e));
  }
  if (!emailString) return [];
  return emailString.split(',').map(e => extractEmailAddress(e.trim()));
}

function findOrCreateThread(data: { subject: string; fromEmail: string; toEmail: string; companyId: string; contactId: string | null }, supabase: any) {
  return async () => {
    const normalizedSubject = data.subject.replace(/^(Re:|Fwd:|Fw:)\s*/gi, '').trim();
    
    const { data: existingThread } = await supabase
      .from('email_threads')
      .select('id')
      .eq('subject', normalizedSubject)
      .eq('company_id', data.companyId)
      .maybeSingle();

    if (existingThread) {
      return existingThread.id;
    }

    const { data: newThread, error: threadError } = await supabase
      .from('email_threads')
      .insert({
        subject: normalizedSubject,
        company_id: data.companyId,
        contact_id: data.contactId,
        last_message_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (threadError) {
      console.error('Error creating thread:', threadError);
      throw new Error(`Failed to create thread: ${threadError.message}`);
    }

    return newThread.id;
  };
}

async function handleInboundEmail(data: SendGridInboundEmail, supabase: any) {
  const fromEmail = data.from ? extractEmailAddress(data.from) : '';
  const toEmail = data.to ? extractEmailAddress(data.to) : '';
  const subject = data.subject || 'No Subject';

  const dataAny = data as any;

  console.log('=== EMAIL CONTENT EXTRACTION ===');
  console.log('All available fields:', Object.keys(data));
  console.log('All field values with lengths:');
  Object.keys(data).forEach(key => {
    const value = (data as any)[key];
    if (typeof value === 'string') {
      console.log(`  ${key}: length=${value.length}, preview=${value.substring(0, 100)}`);
    } else {
      console.log(`  ${key}: type=${typeof value}`);
    }
  });

  const bodyText = data.text ||
                   dataAny.body ||
                   dataAny['text/plain'] ||
                   dataAny.plain ||
                   dataAny['body-plain'] ||
                   dataAny.text_body ||
                   '';

  const bodyHtml = data.html ||
                   dataAny['text/html'] ||
                   dataAny.html_content ||
                   dataAny['body-html'] ||
                   dataAny.html_body ||
                   '';

  const messageId = data['message-id'] || dataAny.message_id || '';

  console.log('Text body candidates:', {
    'data.text': data.text?.length || 0,
    'dataAny.body': dataAny.body?.length || 0,
    'dataAny[text/plain]': dataAny['text/plain']?.length || 0,
    'dataAny.plain': dataAny.plain?.length || 0,
    'dataAny[body-plain]': dataAny['body-plain']?.length || 0,
    'dataAny.text_body': dataAny.text_body?.length || 0
  });
  console.log('HTML body candidates:', {
    'data.html': data.html?.length || 0,
    'dataAny[text/html]': dataAny['text/html']?.length || 0,
    'dataAny.html_content': dataAny.html_content?.length || 0,
    'dataAny[body-html]': dataAny['body-html']?.length || 0,
    'dataAny.html_body': dataAny.html_body?.length || 0
  });
  console.log('Final extracted lengths:', {
    bodyText: bodyText.length,
    bodyHtml: bodyHtml.length
  });
  console.log('================================');

  console.log('Processing inbound email:', {
    fromEmail,
    toEmail,
    subject,
    bodyTextLength: bodyText.length,
    bodyHtmlLength: bodyHtml.length
  });

  let companyId: string | null = null;

  if (toEmail.includes('sentra.capital')) {
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id')
      .ilike('name', '%sentra%')
      .maybeSingle();

    if (companyError) {
      console.error('Error fetching Sentra company:', companyError);
      throw new Error(`Failed to fetch company: ${companyError.message}`);
    }
    companyId = company?.id;
  } else if (toEmail.includes('kumbracapital.com')) {
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id')
      .ilike('name', '%kumbra%')
      .maybeSingle();

    if (companyError) {
      console.error('Error fetching Kumbra company:', companyError);
      throw new Error(`Failed to fetch company: ${companyError.message}`);
    }
    companyId = company?.id;
  }

  if (!companyId) {
    console.error('No company found for email:', toEmail);
    throw new Error('No company found for this email domain');
  }

  let contactId: string | null = null;
  const { data: existingContact } = await supabase
    .from('contacts')
    .select('id')
    .eq('email', fromEmail)
    .eq('company_id', companyId)
    .maybeSingle();

  if (existingContact) {
    contactId = existingContact.id;
  } else {
    const fromName = data.from?.replace(/<.*>/, '').trim() || fromEmail;
    const nameParts = fromName.split(' ');
    const firstName = nameParts[0] || fromEmail.split('@')[0];
    const lastName = nameParts.slice(1).join(' ') || '';

    const { data: newContact, error: contactError } = await supabase
      .from('contacts')
      .insert({
        email: fromEmail,
        first_name: firstName,
        last_name: lastName,
        company_id: companyId,
        status: 'Fresh Lead',
        lead_source: 'Inbound Email'
      })
      .select('id')
      .single();

    if (contactError) {
      console.error('Error creating contact:', contactError);
      throw new Error(`Failed to create contact: ${contactError.message}`);
    }

    contactId = newContact.id;
    console.log('Created new contact:', { contactId, fromEmail });
  }

  const getOrCreateThread = findOrCreateThread({
    subject,
    fromEmail,
    toEmail,
    companyId,
    contactId
  }, supabase);

  const threadId = await getOrCreateThread();

  const toEmails = normalizeEmailAddresses(data.to || '');
  const ccEmails = data.cc ? normalizeEmailAddresses(data.cc) : [];

  const { error: emailError } = await supabase
    .from('emails')
    .insert({
      thread_id: threadId,
      contact_id: contactId,
      company_id: companyId,
      from_email: fromEmail,
      from_name: data.from?.replace(/<.*>/, '').trim() || fromEmail,
      to_email: toEmails,
      cc_email: ccEmails.length > 0 ? ccEmails : null,
      subject: subject,
      body: bodyText,
      body_html: bodyHtml,
      direction: 'received',
      status: 'received',
      sendgrid_message_id: messageId,
      user_id: null
    });

  if (emailError) {
    console.error('Error storing email:', emailError);
    throw new Error(`Failed to store email: ${emailError.message}`);
  }

  await supabase
    .from('email_threads')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', threadId);

  await supabase.rpc('increment_email_sync_count', {
    p_company_id: companyId,
    p_sync_type: 'inbound'
  });

  console.log('Successfully processed inbound email');
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const contentType = req.headers.get('content-type') || '';
    
    console.log('Received webhook request:', {
      method: req.method,
      contentType,
      url: req.url
    });

    if (contentType.includes('multipart/form-data') || contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await req.formData();
      const emailData: SendGridInboundEmail = {};

      console.log('===== SENDGRID WEBHOOK DATA =====');
      console.log('All form fields:');
      const allFields: Record<string, any> = {};
      for (const [key, value] of formData.entries()) {
        if (typeof value === 'string') {
          const preview = value.length > 200 ? value.substring(0, 200) + '...' : value;
          console.log(`  ${key}: length=${value.length}`);
          console.log(`    Preview: ${preview}`);
          emailData[key as keyof SendGridInboundEmail] = value;
          allFields[key] = value.length > 500 ? value.substring(0, 500) + '...[truncated]' : value;
        } else {
          console.log(`  ${key}: [non-string type: ${typeof value}]`);
        }
      }
      console.log('ALL FIELDS JSON:', JSON.stringify(allFields, null, 2));
      console.log('=================================');

      await handleInboundEmail(emailData, supabase);

      return new Response(
        JSON.stringify({ success: true, message: 'Email processed successfully' }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const body = await req.json();
    console.log('Received JSON body:', body);

    await handleInboundEmail(body, supabase);

    return new Response(
      JSON.stringify({ success: true, message: 'Email processed successfully' }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error processing webhook:', error);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: companies } = await supabase
      .from('companies')
      .select('id')
      .limit(1);

    if (companies && companies.length > 0) {
      await supabase
        .from('email_sync_status')
        .upsert({
          company_id: companies[0].id,
          sync_type: 'inbound',
          last_sync_at: new Date().toISOString(),
          last_error_at: new Date().toISOString(),
          last_error_message: error instanceof Error ? error.message : 'Unknown error',
          total_errors: 1,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'company_id,sync_type'
        });
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
