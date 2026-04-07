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

    const {
      action,
      email,
      name,
      role,
      cpf,
      phone,
      department_id,
      admin_id,
      user_id,
      address,
      observations,
      permissions,
      companies,
      avatar_url,
    } = await req.json()

    if (action === 'resend_email') {
      if (!user_id || !email) throw new Error('user_id and email are required')

      const origin = req.headers.get('origin') || 'https://gestao-de-contas-f8bf6.goskip.app'
      const redirectTo = `${origin}/reset-password`

      await supabaseAdmin.auth.admin.updateUserById(user_id, {
        email_confirm: true,
      })

      const { data, error } = await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email: email,
        options: { redirectTo },
      })

      if (error) {
        return new Response(JSON.stringify({ success: false, error: error.message }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const actionLink = data.properties.action_link

      const resendApiKey = Deno.env.get('RESEND_API_KEY')
      const subject = 'Acesso Liberado - Gestão de Contas'
      const htmlBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #0f172a; margin: 0;">Gestão de Contas</h1>
          </div>
          <h2 style="color: #0f172a; text-align: center;">Seu acesso foi liberado!</h2>
          <p style="color: #334155; font-size: 16px;">Olá <strong>${name || email}</strong>,</p>
          <p style="color: #334155; font-size: 16px;">Sua conta está aprovada e você já pode acessar o sistema.</p>
          <p style="color: #334155; font-size: 16px;">Caso precise definir ou redefinir sua senha, clique no botão abaixo:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${actionLink}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;">Acessar o Sistema</a>
          </div>
          <p style="color: #64748b; font-size: 14px; text-align: center;">Se o botão não funcionar, copie e cole este link no seu navegador:<br><br><a href="${actionLink}" style="color: #2563eb; word-break: break-all;">${actionLink}</a></p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="color: #94a3b8; font-size: 12px; text-align: center;">Este é um e-mail automático, por favor não responda.</p>
        </div>
      `

      if (resendApiKey) {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: 'Gestão de Contas <onboarding@resend.dev>',
            to: [email],
            subject: subject,
            html: htmlBody,
          }),
        })
      } else {
        console.log('[EMAIL SIMULATION] To:', email)
        console.log('[EMAIL SIMULATION] Link:', actionLink)
      }

      return new Response(JSON.stringify({ success: true, actionLink }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    } else if (action === 'invite') {
      const origin = req.headers.get('origin') || 'https://gestao-de-contas-f8bf6.goskip.app'
      const redirectTo = `${origin}/reset-password`

      // Pre-flight check for CPF duplication to avoid opaque database errors
      if (cpf && String(cpf).trim() !== '') {
        const { data: existingCpf } = await supabaseAdmin
          .from('cadastro_usuarios')
          .select('id')
          .eq('cpf', String(cpf).trim())
          .is('deleted_at', null)
          .maybeSingle()

        if (existingCpf) {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'O CPF informado já está cadastrado para outro usuário ativo.',
            }),
            {
              status: 200,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            },
          )
        }
      }

      let actionLink = ''
      let actionUser = null

      const { data, error } = await supabaseAdmin.auth.admin.generateLink({
        type: 'invite',
        email: email,
        options: { redirectTo },
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
            const retry = await supabaseAdmin.auth.admin.generateLink({
              type: 'invite',
              email: email,
              options: { redirectTo },
              data: { name, role, cpf, phone, department_id, admin_id },
            })
            if (retry.error) {
              return new Response(JSON.stringify({ success: false, error: retry.error.message }), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              })
            }
            actionLink = retry.data.properties.action_link
            actionUser = retry.data.user
          }
        }
      } else if (error) {
        let errorMessage = error.message
        if (errorMessage === 'Database error saving new user') {
          errorMessage =
            'Erro no banco de dados ao salvar o usuário. Verifique se os dados inseridos estão corretos ou se há instabilidade.'
        }
        return new Response(JSON.stringify({ success: false, error: errorMessage }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      } else {
        actionLink = data.properties.action_link
        actionUser = data.user
      }

      if (actionLink && actionUser) {
        // UPDATE CUSTOM FIELDS
        const { data: profile } = await supabaseAdmin
          .from('cadastro_usuarios')
          .select('id')
          .eq('user_id', actionUser.id)
          .maybeSingle()
        if (profile) {
          await supabaseAdmin
            .from('cadastro_usuarios')
            .update({
              address: address || null,
              observations: observations || null,
              permissions: permissions && permissions.length > 0 ? permissions : ['all'],
              avatar_url: avatar_url || null,
            })
            .eq('id', profile.id)

          if (companies && Array.isArray(companies) && companies.length > 0) {
            const companyInserts = companies.map((orgId: string) => ({
              usuario_id: profile.id,
              organization_id: orgId,
            }))
            await supabaseAdmin.from('cadastro_usuarios_companies').insert(companyInserts)
          }

          const auditId = crypto.randomUUID()
          const changes = {
            name: { new: name },
            email: { new: email },
            role: { new: role },
            cpf: { new: cpf || null },
            phone: { new: phone || null },
            department_id: { new: department_id || null },
          }
          await supabaseAdmin.from('audit_logs').insert({
            id: auditId,
            entity_type: 'usuario',
            entity_id: profile.id,
            action: 'CREATE',
            performed_by: admin_id,
            changes: changes,
          })
          const details = Object.entries(changes).map(
            ([field, { new: newVal }]: [string, any]) => ({
              audit_log_id: auditId,
              field_name: field,
              new_value: newVal !== undefined && newVal !== null ? String(newVal) : null,
            }),
          )
          await supabaseAdmin.from('audit_details').insert(details)
        }

        const resendApiKey = Deno.env.get('RESEND_API_KEY')
        const subject = 'Convite de Acesso - Gestão de Contas'
        const htmlBody = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h1 style="color: #0f172a; margin: 0;">Gestão de Contas</h1>
            </div>
            <h2 style="color: #0f172a; text-align: center;">Bem-vindo(a)!</h2>
            <p style="color: #334155; font-size: 16px;">Olá <strong>${name || email}</strong>,</p>
            <p style="color: #334155; font-size: 16px;">Você foi convidado(a) para acessar o sistema.</p>
            <p style="color: #334155; font-size: 16px;">Para aceitar o convite e configurar sua senha, clique no botão abaixo:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${actionLink}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;">Aceitar Convite</a>
            </div>
            <p style="color: #64748b; font-size: 14px; text-align: center;">Se o botão não funcionar, copie e cole este link no seu navegador:<br><br><a href="${actionLink}" style="color: #2563eb; word-break: break-all;">${actionLink}</a></p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
            <p style="color: #94a3b8; font-size: 12px; text-align: center;">Este é um e-mail automático, por favor não responda.</p>
          </div>
        `

        if (resendApiKey) {
          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${resendApiKey}`,
            },
            body: JSON.stringify({
              from: 'Gestão de Contas <onboarding@resend.dev>',
              to: [email],
              subject: subject,
              html: htmlBody,
            }),
          })
        } else {
          console.log('[EMAIL SIMULATION] To:', email)
          console.log('[EMAIL SIMULATION] Link:', actionLink)
        }
      }

      return new Response(JSON.stringify({ success: true, user: actionUser, actionLink }), {
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
