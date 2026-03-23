import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const KUMBRA_COMPANY_ID = 'aa9cbf8a-2d0d-4218-b423-c1318c0f9101';

interface ImportLeadRequest {
  submittedAt?: string | null;
  campaign?: string | null;
  firstName: string;
  lastName: string;
  phone?: string | null;
  email: string;
  country?: string | null;
  occupation?: string | null;
  ageGroup?: string | null;
  investmentBudget?: string | null;
  investmentReadiness?: string | null;
  investmentTerm?: string | null;
  riskTolerance?: string | null;
  hasInvestedBefore?: string | null;
  previousInvestments?: string | null;
  sourceRowIdentifier?: string | null;
}

function normalizePhone(phone: string | null | undefined): string {
  if (!phone) return '';

  let cleaned = phone.trim().replace(/\s+/g, '').replace(/[\(\)\-\.]/g, '');

  // If it already starts with +, return as is
  if (cleaned.startsWith('+')) {
    return cleaned;
  }

  // If it starts with 00, replace with +
  if (cleaned.startsWith('00')) {
    return '+' + cleaned.substring(2);
  }

  // If it's a number without country code and appears to be German (starts with 1 or 0)
  // Default to +49 (Germany)
  if (/^[01]/.test(cleaned)) {
    // Remove leading 0 if present
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }
    return '+49' + cleaned;
  }

  // If it doesn't start with + at this point, assume it has country code already
  if (!cleaned.startsWith('+')) {
    return '+' + cleaned;
  }

  return cleaned;
}

function parseSubmittedAt(dateStr: string | null | undefined): Date | null {
  if (!dateStr) return null;
  try {
    const parsed = new Date(dateStr);
    if (isNaN(parsed.getTime())) return null;
    return parsed;
  } catch {
    return null;
  }
}

function buildImportNote(data: ImportLeadRequest): string {
  const lines = ['Imported from IPO Google Sheet:'];

  if (data.submittedAt) lines.push(`Submitted At: ${data.submittedAt}`);
  if (data.campaign) lines.push(`Campaign: ${data.campaign}`);
  if (data.investmentBudget) lines.push(`Investment Budget: ${data.investmentBudget}`);
  if (data.investmentReadiness) lines.push(`Investment Readiness: ${data.investmentReadiness}`);
  if (data.investmentTerm) lines.push(`Investment Term Preference: ${data.investmentTerm}`);
  if (data.riskTolerance) lines.push(`Risk Tolerance: ${data.riskTolerance}`);
  if (data.hasInvestedBefore) lines.push(`Have you ever invested before?: ${data.hasInvestedBefore}`);
  if (data.previousInvestments) lines.push(`Previous Investments: ${data.previousInvestments}`);
  if (data.sourceRowIdentifier) lines.push(`Source Row: ${data.sourceRowIdentifier}`);

  return lines.join('\n');
}

export async function GET(request: NextRequest) {
  try {
    const secret = request.headers.get('x-google-sheet-secret');
    const expectedSecret = process.env.GOOGLE_SHEET_IMPORT_SECRET;

    // Detailed debugging
    const secretLength = secret ? secret.length : 0;
    const expectedLength = expectedSecret ? expectedSecret.length : 0;
    const secretPreview = secret ? `${secret.substring(0, 10)}...` : 'MISSING';
    const expectedPreview = expectedSecret ? `${expectedSecret.substring(0, 10)}...` : 'NOT SET';

    console.log('[DEBUG] GET test connection request');
    console.log('[DEBUG] Received secret length:', secretLength, 'Preview:', secretPreview);
    console.log('[DEBUG] Expected secret length:', expectedLength, 'Preview:', expectedPreview);
    console.log('[DEBUG] Match:', secret === expectedSecret);

    if (!expectedSecret) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Server misconfiguration: GOOGLE_SHEET_IMPORT_SECRET not set',
          debug: {
            issue: 'Environment variable missing on server',
            hint: 'Add GOOGLE_SHEET_IMPORT_SECRET to Netlify environment variables'
          }
        },
        { status: 500 }
      );
    }

    if (!secret) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'No secret provided',
          debug: {
            issue: 'x-google-sheet-secret header is missing',
            hint: 'Check your Google Apps Script'
          }
        },
        { status: 401 }
      );
    }

    if (secret !== expectedSecret) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Unauthorized',
          debug: {
            issue: 'Secret mismatch',
            receivedLength: secretLength,
            expectedLength: expectedLength,
            receivedPreview: secretPreview,
            expectedPreview: expectedPreview,
            hint: 'Check for typos or extra spaces in script or Netlify'
          }
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      status: 'success',
      message: 'Connection successful',
      companyId: KUMBRA_COMPANY_ID
    });
  } catch (error) {
    return NextResponse.json(
      { status: 'error', message: 'Server error', error: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const expectedSecret = process.env.GOOGLE_SHEET_IMPORT_SECRET;
    const body: ImportLeadRequest = await request.json();

    // Try both header and body for secret (Google Apps Script may strip custom headers)
    let secret = request.headers.get('x-google-sheet-secret');
    if (!secret && 'apiSecret' in body) {
      secret = (body as any).apiSecret;
      console.log('[DEBUG] Secret found in body instead of header');
    }

    // Detailed debugging
    const secretLength = secret ? secret.length : 0;
    const expectedLength = expectedSecret ? expectedSecret.length : 0;
    const secretPreview = secret ? `${secret.substring(0, 10)}...` : 'MISSING';
    const expectedPreview = expectedSecret ? `${expectedSecret.substring(0, 10)}...` : 'NOT SET';

    console.log('[DEBUG] POST request');
    console.log('[DEBUG] Received secret length:', secretLength, 'Preview:', secretPreview);
    console.log('[DEBUG] Expected secret length:', expectedLength, 'Preview:', expectedPreview);

    if (!expectedSecret) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Server misconfiguration: GOOGLE_SHEET_IMPORT_SECRET not set',
          debug: {
            issue: 'Environment variable missing on server',
            hint: 'Add GOOGLE_SHEET_IMPORT_SECRET to Netlify environment variables'
          }
        },
        { status: 500 }
      );
    }

    if (!secret) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'No secret provided',
          debug: {
            issue: 'Secret not found in header or body',
            hint: 'Send apiSecret in request body'
          }
        },
        { status: 401 }
      );
    }

    if (secret !== expectedSecret) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Unauthorized',
          debug: {
            issue: 'Secret mismatch',
            receivedLength: secretLength,
            expectedLength: expectedLength,
            receivedPreview: secretPreview,
            expectedPreview: expectedPreview,
            hint: 'Check for typos or extra spaces in script or Netlify'
          }
        },
        { status: 401 }
      );
    }

    // Handle test connection requests
    if ('test' in body && body.test === true) {
      return NextResponse.json({
        status: 'success',
        message: 'Connection test successful!',
        companyId: KUMBRA_COMPANY_ID,
        authenticated: true
      });
    }

    if (!body.email || !body.firstName) {
      return NextResponse.json(
        { status: 'error', message: 'Missing required fields: email, firstName' },
        { status: 400 }
      );
    }

    // Normalize all string fields to handle null/undefined/non-string values
    const firstName = String(body.firstName || '').trim();
    const lastName = String(body.lastName || '[Not Provided]').trim();
    const email = String(body.email || '').toLowerCase().trim();

    if (!email || !firstName) {
      return NextResponse.json(
        { status: 'error', message: 'Missing required fields: email, firstName' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[ERROR] Missing Supabase credentials');
      console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'SET' : 'MISSING');
      console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'SET' : 'MISSING');
      return NextResponse.json(
        {
          status: 'error',
          message: 'Server configuration error: Supabase credentials missing',
          debug: {
            issue: 'Environment variables not configured on Netlify',
            hint: 'Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to Netlify environment variables'
          }
        },
        { status: 500 }
      );
    }

    console.log('[DEBUG] Creating Supabase client');
    console.log('[DEBUG] URL length:', supabaseUrl.length);
    console.log('[DEBUG] Key length:', supabaseServiceKey.length);
    console.log('[DEBUG] Key starts with:', supabaseServiceKey.substring(0, 20));

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const normalizedPhone = normalizePhone(body.phone);
    const emailLower = email;

    let duplicateQuery = supabase
      .from('contacts')
      .select('id')
      .eq('company_id', KUMBRA_COMPANY_ID);

    if (normalizedPhone) {
      duplicateQuery = duplicateQuery.or(`email.ilike.${emailLower},phone1.eq.${normalizedPhone}`);
    } else {
      duplicateQuery = duplicateQuery.ilike('email', emailLower);
    }

    const { data: existingContacts } = await duplicateQuery.limit(1).maybeSingle();

    if (existingContacts) {
      const duplicateNote = `Duplicate Google Sheet import detected on ${new Date().toISOString()}\n${buildImportNote(body)}`;

      await supabase
        .from('notes')
        .insert({
          company_id: KUMBRA_COMPANY_ID,
          contact_id: existingContacts.id,
          broker_id: existingContacts.id,
          content: duplicateNote
        });

      return NextResponse.json({
        status: 'duplicate',
        leadId: existingContacts.id
      });
    }

    const submittedDate = parseSubmittedAt(body.submittedAt);
    const fullName = `${firstName} ${lastName}`.trim();

    let ageValue: number | null = null;
    if (body.ageGroup) {
      const ageMatch = String(body.ageGroup).match(/(\d+)/);
      if (ageMatch) {
        ageValue = parseInt(ageMatch[1], 10);
      }
    }

    const { data: newContact, error: insertError } = await supabase
      .from('contacts')
      .insert({
        company_id: KUMBRA_COMPANY_ID,
        first_name: firstName,
        last_name: lastName,
        full_name: fullName,
        email: emailLower,
        phone1: body.phone || null,
        location: body.country || null,
        job_title: body.occupation || null,
        age: ageValue,
        trading_range: body.investmentBudget || null,
        readiness: body.investmentReadiness || null,
        lead_source: body.campaign || 'IPO Google Sheet',
        status: 'Unassigned',
        assigned_to: null,
        imported_to_crm: true,
        created_at: submittedDate?.toISOString() || new Date().toISOString()
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('Error creating contact:', insertError);
      return NextResponse.json(
        { status: 'error', message: `Failed to create lead: ${insertError.message}` },
        { status: 500 }
      );
    }

    const noteContent = buildImportNote(body);
    await supabase
      .from('notes')
      .insert({
        company_id: KUMBRA_COMPANY_ID,
        contact_id: newContact.id,
        broker_id: newContact.id,
        content: noteContent
      });

    return NextResponse.json({
      status: 'created',
      leadId: newContact.id
    });

  } catch (error) {
    console.error('Import lead error:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
