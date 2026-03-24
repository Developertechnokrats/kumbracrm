import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const COMPANY_CONFIGS = {
  sentra: {
    apiKey: Deno.env.get("SENDGRID_API_KEY_SENTRA"),
    fromEmail: "daniel.cavanaugh@sentra.capital",
    fromName: "Sentra Capital",
    companyName: "sentra"
  },
  kumbra: {
    apiKey: Deno.env.get("SENDGRID_API_KEY_KUMBRA"),
    fromEmail: "daniel.cavanaugh@kumbracapital.com",
    fromName: "Kumbra Capital",
    companyName: "kumbra"
  }
};

interface SendEmailRequest {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  bodyText?: string;
  bodyHtml?: string;
  contactId?: string;
  threadId?: string;
  fromEmail?: string;
  fromName?: string;
}

async function sendViaSendGrid(
  apiKey: string,
  from: { email: string; name: string },
  to: string[],
  subject: string,
  bodyText: string,
  bodyHtml: string,
  cc?: string[],
  bcc?: string[]
) {
  const personalizations = [{
    to: to.map(email => ({ email })),
    ...(cc && cc.length > 0 ? { cc: cc.map(email => ({ email })) } : {}),
    ...(bcc && bcc.length > 0 ? { bcc: bcc.map(email => ({ email })) } : {}),
  }];

  const payload = {
    personalizations,
    from: {
      email: from.email,
      name: from.name
    },
    subject,
    content: [
      { type: "text/plain", value: bodyText },
      { type: "text/html", value: bodyHtml }
    ],
    tracking_settings: {
      click_tracking: {
        enable: false
      },
      open_tracking: {
        enable: false
      }
    }
  };

  const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`SendGrid API error: ${response.status} - ${error}`);
  }

  const messageId = response.headers.get("X-Message-Id");
  return messageId;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("company_id, companies(name)")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError || !profile || !profile.company_id) {
      throw new Error("User profile or company not found");
    }

    const companyName = (profile.companies as any)?.name?.toLowerCase();
    let config = COMPANY_CONFIGS["sentra"];
    
    if (companyName?.includes("kumbra")) {
      config = COMPANY_CONFIGS["kumbra"];
    }

    const payload: SendEmailRequest = await req.json();
    const { to, cc, bcc, subject, bodyText, bodyHtml, contactId, threadId, fromEmail, fromName } = payload;

    if (!to || to.length === 0) {
      throw new Error("At least one recipient is required");
    }

    if (!subject) {
      throw new Error("Subject is required");
    }

    const finalBodyText = bodyText || "";
    const finalBodyHtml = bodyHtml || bodyText || "";

    const senderEmail = fromEmail || config.fromEmail;
    const senderName = fromName || config.fromName;

    const messageId = await sendViaSendGrid(
      config.apiKey,
      { email: senderEmail, name: senderName },
      to,
      subject,
      finalBodyText,
      finalBodyHtml,
      cc,
      bcc
    );

    const { data: email, error: emailError } = await supabase
      .from("emails")
      .insert({
        thread_id: threadId || null,
        company_id: profile.company_id,
        contact_id: contactId || null,
        from_email: senderEmail,
        from_name: senderName,
        to_email: to,
        cc_email: cc || [],
        bcc_email: bcc || [],
        subject,
        body: finalBodyText,
        body_html: finalBodyHtml,
        direction: "sent",
        status: "sent",
        sendgrid_message_id: messageId,
        user_id: user.id,
        sender_id: null,
        sent_at: new Date().toISOString()
      })
      .select()
      .single();

    if (emailError) {
      console.error("Failed to store email:", emailError, JSON.stringify(emailError));
      console.log("Attempted to insert with company_id:", profile.company_id, "user_id:", user.id);

      await supabase
        .from('email_sync_status')
        .upsert({
          company_id: profile.company_id,
          sync_type: 'outbound',
          last_sync_at: new Date().toISOString(),
          last_error_at: new Date().toISOString(),
          last_error_message: emailError.message,
          total_errors: 1,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'company_id,sync_type'
        });

      throw new Error(`Email was sent via SendGrid but failed to save to database: ${emailError.message}`);
    }

    await supabase.rpc('increment_email_sync_count', {
      p_company_id: profile.company_id,
      p_sync_type: 'outbound'
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Email sent successfully",
        emailId: email?.id,
        threadId: threadId,
        messageId
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error sending email:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to send email",
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
