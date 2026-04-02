import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, x-supabase-client-platform, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceKey) throw new Error('Missing environment variables')

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    const { action, email, name, role, cpf, phone, department_id, admin_id, user_id } =
      await req.json()

    if (action === 'invite') {
      const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        data: { name, role, cpf, phone, department_id, admin_id },
      })

      if (
        error &&
        (error.message.includes('already been registered') ||
          error.message.includes('already exists'))
      ) {
        const { data: foundUserId } = await supabaseAdmin.rpc('get_auth_user_by_email', {
          p_email: email,
        })

        if (foundUserId) {
          const { data: existingProfile } = await supabaseAdmin
            .from('cadastro_usuarios')
            .select('id, deleted_at, pending_deletion, approval_status')
            .eq('user_id', foundUserId)
            .maybeSingle()

          if (existingProfile) {
            return new Response(
              JSON.stringify({
                success: false,
                error: 'USER_EXISTS_IN_DB',
                isDeleted: !!existingProfile.deleted_at,
                isPendingDeletion: existingProfile.pending_deletion,
                isPendingApproval: existingProfile.approval_status === 'pending',
              }),
              { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
            )
          } else {
            // Orphaned auth user. Delete and reinvite.
            await supabaseAdmin.auth.admin.deleteUser(foundUserId)
            const retry = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
              data: { name, role, cpf, phone, department_id, admin_id },
            })
            if (retry.error) {
              return new Response(JSON.stringify({ success: false, error: retry.error.message }), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              })
            }
            return new Response(JSON.stringify({ success: true, user: retry.data.user }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
          }
        }
      }

      if (error) {
        return new Response(JSON.stringify({ success: false, error: error.message }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      return new Response(JSON.stringify({ success: true, user: data.user }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    } else if (action === 'delete') {
      if (!user_id) throw new Error('user_id is required')
      const { data, error } = await supabaseAdmin.auth.admin.deleteUser(user_id)
      if (error) {
        return new Response(JSON.stringify({ success: false, error: error.message }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      return new Response(JSON.stringify({ success: true, user: data.user }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ success: false, error: 'Invalid action' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
