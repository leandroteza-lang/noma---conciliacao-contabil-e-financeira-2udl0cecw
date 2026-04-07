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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const payload = await req.json()
    const logs = Array.isArray(payload) ? payload : [payload]
    const results = []

    for (const logData of logs) {
      const {
        entityType,
        entityId,
        action,
        performedBy,
        changes,
        ipAddress,
        userAgent,
        sessionId,
        country,
        city,
        deviceType,
      } = logData

      let finalEntityType = String(entityType).toLowerCase()
      if (finalEntityType === 'usuarios') finalEntityType = 'usuario'

      const { data: auditLog, error: logError } = await supabase
        .from('audit_logs')
        .insert({
          entity_type: finalEntityType,
          entity_id: entityId,
          action,
          performed_by: performedBy,
          changes,
          ip_address: ipAddress,
          user_agent: userAgent,
          session_id: sessionId,
          country: country,
          city: city,
          device_type: deviceType,
        })
        .select()
        .single()

      if (logError) throw logError

      if (changes && Object.keys(changes).length > 0) {
        const details = Object.entries(changes).map(
          ([field, { old, new: newVal }]: [string, any]) => ({
            audit_log_id: auditLog.id,
            field_name: field,
            old_value: old !== undefined && old !== null ? String(old) : null,
            new_value: newVal !== undefined && newVal !== null ? String(newVal) : null,
          }),
        )

        const { error: detailsError } = await supabase.from('audit_details').insert(details)
        if (detailsError) throw detailsError
      }

      results.push(auditLog.id)
    }

    return new Response(JSON.stringify({ success: true, ids: results }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
