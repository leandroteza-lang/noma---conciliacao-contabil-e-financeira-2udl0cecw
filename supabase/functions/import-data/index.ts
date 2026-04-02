import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req: Request) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Cabeçalho de autorização ausente')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Variáveis de ambiente do Supabase ausentes')
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) throw new Error('Usuário não autenticado')

    const payload = await req.json()
    const records = payload.records
    const type = payload.type

    if (type !== 'BANK_ACCOUNTS') {
      return new Response(
        JSON.stringify({ error: 'Tipo de importação não suportado atualmente por esta função' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    if (!Array.isArray(records)) {
      throw new Error('O formato dos dados é inválido. Uma lista de registros era esperada.')
    }

    let inserted = 0
    let rejected = 0
    const errors: string[] = []

    // Fetch user organizations to resolve EMPRESA names to organization_id
    const { data: orgs, error: orgsError } = await supabase
      .from('organizations')
      .select('id, name')
      .eq('user_id', user.id)

    if (orgsError) {
      throw new Error('Erro ao buscar organizações do usuário: ' + orgsError.message)
    }

    const orgMap = new Map<string, string>()
    if (orgs) {
      orgs.forEach((o: any) => {
        if (o.name) orgMap.set(o.name.trim().toLowerCase(), o.id)
      })
    }

    // Process each record sequentially
    for (let i = 0; i < records.length; i++) {
      const row = records[i]
      const rowNum = i + 1

      const empresa = row['EMPRESA']
      const contaContabil = row['CONTA_CONTABIL']

      if (!empresa || String(empresa).trim() === '') {
        rejected++
        errors.push(`Linha ${rowNum}: A coluna EMPRESA está vazia.`)
        continue
      }

      if (!contaContabil || String(contaContabil).trim() === '') {
        rejected++
        errors.push(`Linha ${rowNum}: A coluna CONTA_CONTABIL está vazia.`)
        continue
      }

      const orgId = orgMap.get(String(empresa).trim().toLowerCase())
      if (!orgId) {
        rejected++
        errors.push(`Linha ${rowNum}: A empresa "${empresa}" não foi encontrada na sua conta.`)
        continue
      }

      // Check for duplicates by account_code within the same organization
      const { data: existing, error: checkError } = await supabase
        .from('bank_accounts')
        .select('id')
        .eq('organization_id', orgId)
        .eq('account_code', String(contaContabil))
        .maybeSingle()

      if (checkError) {
        rejected++
        errors.push(`Linha ${rowNum}: Falha ao verificar duplicata - ${checkError.message}`)
        continue
      }

      if (existing) {
        rejected++
        errors.push(
          `Linha ${rowNum}: A Conta Contábil "${contaContabil}" já está cadastrada para esta empresa.`,
        )
        continue
      }

      // Insert new bank account
      const { error: insertError } = await supabase.from('bank_accounts').insert({
        organization_id: orgId,
        account_code: String(contaContabil),
        account_type: String(row['CODCAIXA'] || ''),
        description: String(row['DESCRICAO'] || ''),
        bank_code: String(row['NUMBANCO'] || ''),
        agency: String(row['NUMAGENCIA'] || ''),
        account_number: String(row['NROCONTA'] || ''),
        classification: String(row['CLASSIFICACAO'] || ''),
        check_digit: String(row['DIGITOCONTA'] || ''),
        company_name: String(empresa),
      })

      if (insertError) {
        rejected++
        errors.push(`Linha ${rowNum}: Erro ao inserir no banco - ${insertError.message}`)
      } else {
        inserted++
      }
    }

    return new Response(JSON.stringify({ inserted, rejected, errors }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
