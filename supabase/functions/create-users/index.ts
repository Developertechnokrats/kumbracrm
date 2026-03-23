import { createClient } from 'npm:@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
}

interface UserToCreate {
  email: string
  password: string
  full_name: string
  role: string
  company_id: string
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    const usersToCreate: UserToCreate[] = [
      {
        email: 'david.perry@kumbracapital.com',
        password: 'DPwaesrd77@@',
        full_name: 'David Perry',
        role: 'broker',
        company_id: 'aa9cbf8a-2d0d-4218-b423-c1318c0f9101',
      },
      {
        email: 'daniel.cavanaugh@sentra.capital',
        password: 'DCwaesrd77@@',
        full_name: 'Daniel Cavanaugh',
        role: 'broker',
        company_id: '00000000-0000-0000-0000-000000000000',
      },
      {
        email: 'lavi@sentra.capital',
        password: 'LAwaesrd77@@',
        full_name: 'Lavi',
        role: 'admin',
        company_id: '00000000-0000-0000-0000-000000000000',
      },
      {
        email: 'clear@quotient-capital.com',
        password: 'CC422025!!',
        full_name: 'Clear Cut',
        role: 'admin',
        company_id: 'bb9cbf8a-3d0d-5218-c423-d1318c0f9202',
      },
    ]

    const results = []

    for (const userData of usersToCreate) {
      const { data: existingUser, error: checkError } = await supabaseAdmin.auth.admin.listUsers()
      
      const userExists = existingUser?.users?.some(u => u.email === userData.email)
      
      if (userExists) {
        results.push({ email: userData.email, status: 'already_exists' })
        continue
      }

      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        user_metadata: {
          full_name: userData.full_name,
        },
        app_metadata: {
          role: userData.role,
          company_id: userData.company_id,
        },
      })

      if (authError) {
        results.push({ email: userData.email, status: 'error', error: authError.message })
        continue
      }

      if (authUser.user) {
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .upsert({
            id: authUser.user.id,
            email: userData.email,
            full_name: userData.full_name,
            role: userData.role,
            company_id: userData.company_id,
          })

        if (profileError) {
          results.push({ email: userData.email, status: 'profile_error', error: profileError.message })
        } else {
          results.push({ email: userData.email, status: 'created', id: authUser.user.id })
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    )
  }
})