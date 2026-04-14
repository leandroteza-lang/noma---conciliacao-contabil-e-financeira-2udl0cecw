import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: { Authorization: req.headers.get('Authorization')! },
      },
    })

    const reqBody = await req.json().catch(() => ({}))
    const organizationId = reqBody.organizationId

    if (!organizationId) {
      return new Response(JSON.stringify({ error: 'organizationId is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    const { data, error } = await supabase
      .from('cost_centers')
      .select('*')
      .eq('organization_id', organizationId)
      .is('deleted_at', null)
      .order('code')

    if (error) throw error

    // Generate CSV
    const headers = ['ID', 'Código', 'Descrição', 'Tipo']
    const csvRows = [headers.join(',')]

    for (const row of data || []) {
      csvRows.push(
        [
          row.id,
          `"${row.code || ''}"`,
          `"${(row.description || '').replace(/"/g, '""')}"`,
          `"${row.type || ''}"`,
        ].join(',')
      )
    }

    const csvContent = csvRows.join('\n')

    return new Response(csvContent, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="cost_centers.csv"',
      },
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
