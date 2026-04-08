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

    const { data: configs, error: configError } = await supabase.from('audit_config').select('*')

    if (configError) throw configError

    let totalDeleted = 0

    for (const config of configs) {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - config.retention_days)

      const { count, error: deleteError } = await supabase
        .from('audit_logs')
        .delete({ count: 'exact' })
        .eq('entity_type', config.entity_type)
        .lt('created_at', cutoffDate.toISOString())

      if (deleteError) throw deleteError

      totalDeleted += count || 0
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Limpeza concluída. Total de ${totalDeleted} logs deletados.`,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
