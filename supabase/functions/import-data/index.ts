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

    const SUPPORTED_TYPES = [
      'BANK_ACCOUNTS',
      'COST_CENTERS',
      'CHART_ACCOUNTS',
      'MAPPINGS',
      'FINANCIAL_ENTRIES',
      'COMPANIES',
      'DEPARTMENTS',
      'EMPLOYEES',
    ]

    if (!SUPPORTED_TYPES.includes(type)) {
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

    if (
      orgsError &&
      (type === 'BANK_ACCOUNTS' ||
        type === 'COST_CENTERS' ||
        type === 'CHART_ACCOUNTS' ||
        type === 'MAPPINGS' ||
        type === 'FINANCIAL_ENTRIES')
    ) {
      throw new Error('Erro ao buscar organizações do usuário: ' + orgsError.message)
    }

    const orgMap = new Map<string, string>()
    if (orgs) {
      orgs.forEach((o: any) => {
        if (o.name) orgMap.set(o.name.trim().toLowerCase(), o.id)
      })
    }

    if (type === 'COMPANIES') {
      for (let i = 0; i < records.length; i++) {
        const row = records[i]
        const rowNum = i + 1

        const nome = row['NOME']
        if (!nome || String(nome).trim() === '') {
          rejected++
          errors.push(`Linha ${rowNum}: A coluna NOME está vazia.`)
          continue
        }

        const cnpj = String(row['CNPJ'] || '').trim()
        const cpf = String(row['CPF'] || '').trim()

        if (cnpj) {
          const { data: existingCnpj } = await supabase
            .from('organizations')
            .select('id')
            .eq('cnpj', cnpj)
            .eq('user_id', user.id)
            .maybeSingle()
          if (existingCnpj) {
            rejected++
            errors.push(`Linha ${rowNum}: CNPJ "${cnpj}" já cadastrado.`)
            continue
          }
        }

        const { error: insertError } = await supabase.from('organizations').insert({
          user_id: user.id,
          name: String(nome),
          cnpj: cnpj || null,
          cpf: cpf || null,
          email: String(row['EMAIL'] || ''),
          phone: String(row['TELEFONE'] || ''),
          address: String(row['ENDERECO'] || ''),
          observations: String(row['OBSERVACOES'] || ''),
          status: true,
        })

        if (insertError) {
          rejected++
          errors.push(`Linha ${rowNum}: Erro ao inserir - ${insertError.message}`)
        } else {
          inserted++
        }
      }
    } else if (type === 'DEPARTMENTS') {
      for (let i = 0; i < records.length; i++) {
        const row = records[i]
        const rowNum = i + 1

        const nome = row['NOME']
        if (!nome || String(nome).trim() === '') {
          rejected++
          errors.push(`Linha ${rowNum}: A coluna NOME está vazia.`)
          continue
        }

        const codigo = String(row['CODIGO'] || '').trim()

        if (codigo) {
          const { data: existingCode } = await supabase
            .from('departments')
            .select('id')
            .eq('code', codigo)
            .eq('user_id', user.id)
            .maybeSingle()
          if (existingCode) {
            rejected++
            errors.push(`Linha ${rowNum}: Código "${codigo}" já cadastrado.`)
            continue
          }
        }

        const { error: insertError } = await supabase.from('departments').insert({
          user_id: user.id,
          name: String(nome),
          code: codigo || `DEP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        })

        if (insertError) {
          rejected++
          errors.push(`Linha ${rowNum}: Erro ao inserir - ${insertError.message}`)
        } else {
          inserted++
        }
      }
    } else if (type === 'EMPLOYEES') {
      for (let i = 0; i < records.length; i++) {
        const row = records[i]
        const rowNum = i + 1

        const nome = row['NOME']
        if (!nome || String(nome).trim() === '') {
          rejected++
          errors.push(`Linha ${rowNum}: A coluna NOME está vazia.`)
          continue
        }

        let depId = null
        const depCode = String(row['DEPARTAMENTO_CODIGO'] || '').trim()
        if (depCode) {
          const { data: dep } = await supabase
            .from('departments')
            .select('id')
            .eq('code', depCode)
            .eq('user_id', user.id)
            .maybeSingle()
          if (dep) {
            depId = dep.id
          } else {
            rejected++
            errors.push(`Linha ${rowNum}: Departamento com código "${depCode}" não encontrado.`)
            continue
          }
        }

        const email = String(row['EMAIL'] || '').trim()
        if (email) {
          const { data: existingUser } = await supabase
            .from('employees')
            .select('id')
            .eq('email', email)
            .eq('user_id', user.id)
            .maybeSingle()
          if (existingUser) {
            rejected++
            errors.push(`Linha ${rowNum}: E-mail "${email}" já está em uso por outro funcionário.`)
            continue
          }
        }

        const perfil = String(row['PERFIL'] || 'collaborator').toLowerCase()
        const validRoles = ['admin', 'supervisor', 'collaborator']
        const roleToInsert = validRoles.includes(perfil) ? perfil : 'collaborator'

        const { error: insertError } = await supabase.from('employees').insert({
          user_id: user.id,
          name: String(nome),
          cpf: String(row['CPF'] || '') || null,
          email: email || null,
          phone: String(row['TELEFONE'] || '') || null,
          address: String(row['ENDERECO'] || '') || null,
          observations: String(row['OBSERVACOES'] || '') || null,
          role: roleToInsert,
          permissions: ['all'],
          department_id: depId,
          status: true,
        })

        if (insertError) {
          rejected++
          errors.push(`Linha ${rowNum}: Erro ao inserir - ${insertError.message}`)
        } else {
          inserted++
        }
      }
    } else if (type === 'BANK_ACCOUNTS') {
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
    } else if (type === 'MAPPINGS') {
      for (let i = 0; i < records.length; i++) {
        const row = records[i]
        const rowNum = i + 1

        const empresa = row['EMPRESA']
        const centroCusto = row['CENTRO_CUSTO']
        const contaContabil = row['CONTA_CONTABIL']
        const tipoMapeamento = row['TIPO_MAPEAMENTO']

        if (!empresa || String(empresa).trim() === '') {
          rejected++
          errors.push(`Linha ${rowNum}: A coluna EMPRESA está vazia.`)
          continue
        }

        if (!centroCusto || String(centroCusto).trim() === '') {
          rejected++
          errors.push(`Linha ${rowNum}: A coluna CENTRO_CUSTO está vazia.`)
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

        const strCentroCusto = String(centroCusto).trim()
        const strContaContabil = String(contaContabil).trim()

        const { data: ccData, error: ccError } = await supabase
          .from('cost_centers')
          .select('id')
          .eq('organization_id', orgId)
          .eq('code', strCentroCusto)
          .maybeSingle()

        if (ccError || !ccData) {
          rejected++
          errors.push(`Linha ${rowNum}: Centro de Custo "${strCentroCusto}" não encontrado.`)
          continue
        }

        const { data: caData, error: caError } = await supabase
          .from('chart_of_accounts')
          .select('id')
          .eq('organization_id', orgId)
          .eq('account_code', strContaContabil)
          .maybeSingle()

        if (caError || !caData) {
          rejected++
          errors.push(`Linha ${rowNum}: Conta Contábil "${strContaContabil}" não encontrada.`)
          continue
        }

        const { data: existing, error: checkError } = await supabase
          .from('account_mapping')
          .select('id')
          .eq('organization_id', orgId)
          .eq('cost_center_id', ccData.id)
          .eq('chart_account_id', caData.id)
          .maybeSingle()

        if (checkError) {
          rejected++
          errors.push(`Linha ${rowNum}: Falha ao verificar duplicata - ${checkError.message}`)
          continue
        }

        if (existing) {
          rejected++
          errors.push(
            `Linha ${rowNum}: O mapeamento entre "${strCentroCusto}" e "${strContaContabil}" já existe.`,
          )
          continue
        }

        const { error: insertError } = await supabase.from('account_mapping').insert({
          organization_id: orgId,
          cost_center_id: ccData.id,
          chart_account_id: caData.id,
          mapping_type: String(tipoMapeamento || 'DE/PARA'),
        })

        if (insertError) {
          rejected++
          errors.push(`Linha ${rowNum}: Erro ao inserir no banco - ${insertError.message}`)
        } else {
          inserted++
        }
      }
    } else if (type === 'FINANCIAL_ENTRIES') {
      for (let i = 0; i < records.length; i++) {
        const row = records[i]
        const rowNum = i + 1

        const empresa = row['EMPRESA']
        const data = row['DATA']
        const descricao = row['DESCRICAO']
        const valorRaw = row['VALOR']
        const centroCusto = row['CENTRO_CUSTO']
        const contaDebito = row['CONTA_DEBITO']
        const contaCredito = row['CONTA_CREDITO']

        if (!empresa || String(empresa).trim() === '') {
          rejected++
          errors.push(`Linha ${rowNum}: A coluna EMPRESA está vazia.`)
          continue
        }

        if (!data || String(data).trim() === '') {
          rejected++
          errors.push(`Linha ${rowNum}: A coluna DATA está vazia.`)
          continue
        }

        const parsedDate = new Date(data)
        if (isNaN(parsedDate.getTime())) {
          rejected++
          errors.push(`Linha ${rowNum}: A coluna DATA possui formato inválido.`)
          continue
        }

        const valorStr = String(valorRaw).replace(',', '.')
        const valor = parseFloat(valorStr)
        if (isNaN(valor)) {
          rejected++
          errors.push(`Linha ${rowNum}: A coluna VALOR possui formato numérico inválido.`)
          continue
        }

        const orgId = orgMap.get(String(empresa).trim().toLowerCase())
        if (!orgId) {
          rejected++
          errors.push(`Linha ${rowNum}: A empresa "${empresa}" não foi encontrada.`)
          continue
        }

        const strCentroCusto = String(centroCusto).trim()
        const { data: ccData, error: ccError } = await supabase
          .from('cost_centers')
          .select('id')
          .eq('organization_id', orgId)
          .eq('code', strCentroCusto)
          .maybeSingle()

        if (ccError || !ccData) {
          rejected++
          errors.push(`Linha ${rowNum}: Centro de Custo "${strCentroCusto}" não encontrado.`)
          continue
        }

        const strContaDebito = String(contaDebito).trim()
        const { data: debitData, error: debitError } = await supabase
          .from('chart_of_accounts')
          .select('id')
          .eq('organization_id', orgId)
          .eq('account_code', strContaDebito)
          .maybeSingle()

        if (debitError || !debitData) {
          rejected++
          errors.push(`Linha ${rowNum}: Conta Débito "${strContaDebito}" não encontrada.`)
          continue
        }

        const strContaCredito = String(contaCredito).trim()
        const { data: creditData, error: creditError } = await supabase
          .from('chart_of_accounts')
          .select('id')
          .eq('organization_id', orgId)
          .eq('account_code', strContaCredito)
          .maybeSingle()

        if (creditError || !creditData) {
          rejected++
          errors.push(`Linha ${rowNum}: Conta Crédito "${strContaCredito}" não encontrada.`)
          continue
        }

        const formattedDate = parsedDate.toISOString().split('T')[0]

        // Validação de duplicatas por data/valor/conta(centro de custo)
        const { data: existing, error: checkError } = await supabase
          .from('financial_movements')
          .select('id')
          .eq('organization_id', orgId)
          .eq('movement_date', formattedDate)
          .eq('amount', valor)
          .eq('cost_center_id', ccData.id)
          .maybeSingle()

        if (checkError) {
          rejected++
          errors.push(`Linha ${rowNum}: Falha ao verificar duplicata - ${checkError.message}`)
          continue
        }

        if (existing) {
          rejected++
          errors.push(
            `Linha ${rowNum}: Lançamento já existe com mesma data, valor e centro de custo.`,
          )
          continue
        }

        // Inserir em financial_movements
        const { data: fm, error: insertError } = await supabase
          .from('financial_movements')
          .insert({
            organization_id: orgId,
            movement_date: formattedDate,
            amount: valor,
            description: String(descricao || ''),
            cost_center_id: ccData.id,
            status: 'Concluído',
          })
          .select()
          .single()

        if (insertError) {
          rejected++
          errors.push(
            `Linha ${rowNum}: Erro ao inserir movimento financeiro - ${insertError.message}`,
          )
          continue
        }

        // Inserir em accounting_entries para manter integridade
        const { error: aeError } = await supabase.from('accounting_entries').insert({
          organization_id: orgId,
          entry_date: formattedDate,
          amount: valor,
          description: String(descricao || ''),
          debit_account_id: debitData.id,
          credit_account_id: creditData.id,
          status: 'Concluído',
        })

        if (aeError) {
          await supabase.from('financial_movements').delete().eq('id', fm.id)
          rejected++
          errors.push(`Linha ${rowNum}: Erro ao inserir lançamento contábil - ${aeError.message}`)
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
