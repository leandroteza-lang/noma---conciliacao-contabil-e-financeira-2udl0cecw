import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, x-supabase-client-platform, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Cabeçalho de autorização ausente')

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Variáveis de ambiente do Supabase ausentes')
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const token = authHeader.replace(/^Bearer\s+/i, '').trim()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token)
    if (userError || !user)
      throw new Error(`Usuário não autenticado: ${userError?.message || 'Token inválido'}`)

    const payload = await req.json()
    const {
      baseDate,
      installments = 1,
      amount,
      description,
      costCenterId,
      counterpartAccountId,
      type = 'expense',
    } = payload

    if (!baseDate || !amount || !description || !costCenterId || !counterpartAccountId) {
      throw new Error('Parâmetros obrigatórios ausentes')
    }

    if (amount <= 0) {
      throw new Error('O valor deve ser maior que zero')
    }

    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!org) throw new Error('Organização não encontrada')
    const orgId = org.id

    // Check account mapping for the selected cost center
    const { data: mapping, error: mappingError } = await supabase
      .from('account_mapping')
      .select('chart_account_id')
      .eq('organization_id', orgId)
      .eq('cost_center_id', costCenterId)
      .maybeSingle()

    if (mappingError) {
      throw new Error('Erro ao buscar mapeamento DE/PARA')
    }

    if (!mapping || !mapping.chart_account_id) {
      throw new Error('Centro de custo não possui mapeamento DE/PARA para uma conta contábil.')
    }

    const mappedAccountId = mapping.chart_account_id

    let generated = 0
    const errors: string[] = []

    for (let i = 0; i < installments; i++) {
      try {
        const dateObj = new Date(baseDate)
        dateObj.setUTCMonth(dateObj.getUTCMonth() + i)
        const entryDate = dateObj.toISOString().split('T')[0]
        const entryDesc =
          installments > 1 ? `${description} (${i + 1}/${installments})` : description

        // Validate balance zero: Debits equal Credits using the single amount
        const debitAccountId = type === 'expense' ? mappedAccountId : counterpartAccountId
        const creditAccountId = type === 'expense' ? counterpartAccountId : mappedAccountId

        if (debitAccountId === creditAccountId) {
          throw new Error('Conta de débito e crédito não podem ser iguais no mapeamento.')
        }

        const { data: fm, error: fmError } = await supabase
          .from('financial_movements')
          .insert({
            organization_id: orgId,
            movement_date: entryDate,
            amount: amount,
            description: entryDesc,
            cost_center_id: costCenterId,
            status: 'Concluído',
          })
          .select()
          .single()

        if (fmError) throw new Error(`Erro ao criar movimento: ${fmError.message}`)

        const { error: aeError } = await supabase.from('accounting_entries').insert({
          organization_id: orgId,
          entry_date: entryDate,
          amount: amount,
          description: entryDesc,
          debit_account_id: debitAccountId,
          credit_account_id: creditAccountId,
          status: 'Concluído',
        })

        if (aeError) {
          await supabase.from('financial_movements').delete().eq('id', fm.id)
          throw new Error(`Erro ao criar lançamento contábil: ${aeError.message}`)
        }

        generated++
      } catch (err: any) {
        errors.push(`Parcela ${i + 1}: ${err.message}`)
      }
    }

    return new Response(JSON.stringify({ generated, errors }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
