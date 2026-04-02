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

    if (type !== 'BANK_ACCOUNTS' && type !== 'COST_CENTERS' && type !== 'CHART_ACCOUNTS') {
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

    if (type === 'BANK_ACCOUNTS') {
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
    } else if (type === 'COST_CENTERS') {
      const sortedRecords = [...records].map((r, i) => ({ ...r, _originalIndex: i + 1 }))
      sortedRecords.sort((a, b) => String(a['COD'] || '').length - String(b['COD'] || '').length)

      for (let i = 0; i < sortedRecords.length; i++) {
        const row = sortedRecords[i]
        const rowNum = row._originalIndex

        const empresa = row['EMPRESA']
        const code = row['COD']
        const description = row['DESCRICAO']

        if (!empresa || String(empresa).trim() === '') {
          rejected++
          errors.push(`Linha ${rowNum}: A coluna EMPRESA está vazia.`)
          continue
        }

        if (!code || String(code).trim() === '') {
          rejected++
          errors.push(`Linha ${rowNum}: A coluna COD está vazia.`)
          continue
        }

        if (!description || String(description).trim() === '') {
          rejected++
          errors.push(`Linha ${rowNum}: A coluna DESCRICAO está vazia.`)
          continue
        }

        const orgId = orgMap.get(String(empresa).trim().toLowerCase())
        if (!orgId) {
          rejected++
          errors.push(`Linha ${rowNum}: A empresa "${empresa}" não foi encontrada na sua conta.`)
          continue
        }

        const strCode = String(code).trim()
        let parentId = null

        if (strCode.includes('.')) {
          const codeParts = strCode.split('.')
          codeParts.pop()
          const parentCode = codeParts.join('.')

          const { data: parentData, error: parentError } = await supabase
            .from('cost_centers')
            .select('id')
            .eq('organization_id', orgId)
            .eq('code', parentCode)
            .maybeSingle()

          if (parentError) {
            rejected++
            errors.push(
              `Linha ${rowNum}: Erro ao buscar centro de custo pai - ${parentError.message}`,
            )
            continue
          }

          if (parentData) {
            parentId = parentData.id
          } else {
            rejected++
            errors.push(
              `Linha ${rowNum}: Centro de custo pai "${parentCode}" não encontrado para hierarquia.`,
            )
            continue
          }
        }

        const { data: existing, error: checkError } = await supabase
          .from('cost_centers')
          .select('id')
          .eq('organization_id', orgId)
          .eq('code', strCode)
          .maybeSingle()

        if (checkError) {
          rejected++
          errors.push(`Linha ${rowNum}: Falha ao verificar duplicata - ${checkError.message}`)
          continue
        }

        if (existing) {
          rejected++
          errors.push(
            `Linha ${rowNum}: O código "${strCode}" já está cadastrado para esta empresa.`,
          )
          continue
        }

        const { error: insertError } = await supabase.from('cost_centers').insert({
          organization_id: orgId,
          code: strCode,
          description: String(description),
          parent_id: parentId,
          type_tga: String(row['TIPO_TGA'] || ''),
          fixed_variable: String(row['FIXO_OU_VARIAVEL'] || ''),
          classification: String(row['CLASSIFICACAO'] || ''),
          operational: String(row['OPERACIONAL'] || ''),
        } as any)

        if (insertError) {
          rejected++
          errors.push(`Linha ${rowNum}: Erro ao inserir no banco - ${insertError.message}`)
        } else {
          inserted++
        }
      }
    } else if (type === 'CHART_ACCOUNTS') {
      for (let i = 0; i < records.length; i++) {
        const row = records[i]
        const rowNum = i + 1

        const empresa = row['EMPRESA']
        const code = row['CODIGO_CONTA']
        const name = row['NOME_CONTA']
        const accountType = row['TIPO_CONTA']

        if (!empresa || String(empresa).trim() === '') {
          rejected++
          errors.push(`Linha ${rowNum}: A coluna EMPRESA está vazia.`)
          continue
        }

        if (!code || String(code).trim() === '') {
          rejected++
          errors.push(`Linha ${rowNum}: A coluna CODIGO_CONTA está vazia.`)
          continue
        }

        if (!name || String(name).trim() === '') {
          rejected++
          errors.push(`Linha ${rowNum}: A coluna NOME_CONTA está vazia.`)
          continue
        }

        const orgId = orgMap.get(String(empresa).trim().toLowerCase())
        if (!orgId) {
          rejected++
          errors.push(`Linha ${rowNum}: A empresa "${empresa}" não foi encontrada na sua conta.`)
          continue
        }

        const strCode = String(code).trim()

        const { data: existing, error: checkError } = await supabase
          .from('chart_of_accounts')
          .select('id')
          .eq('organization_id', orgId)
          .eq('account_code', strCode)
          .maybeSingle()

        if (checkError) {
          rejected++
          errors.push(`Linha ${rowNum}: Falha ao verificar duplicata - ${checkError.message}`)
          continue
        }

        if (existing) {
          rejected++
          errors.push(
            `Linha ${rowNum}: O código de conta "${strCode}" já está cadastrado para esta empresa.`,
          )
          continue
        }

        const { error: insertError } = await supabase.from('chart_of_accounts').insert({
          organization_id: orgId,
          account_code: strCode,
          account_name: String(name),
          account_type: String(accountType || ''),
        })

        if (insertError) {
          rejected++
          errors.push(`Linha ${rowNum}: Erro ao inserir no banco - ${insertError.message}`)
        } else {
          inserted++
        }
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
