import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import * as XLSX from 'npm:xlsx@0.18.5'

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

    const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        Authorization: authHeader,
        apikey: supabaseKey,
      },
    })

    if (!userResponse.ok) {
      const err = await userResponse.json().catch(() => ({}))
      throw new Error(`Usuário não autenticado: ${err.msg || err.message || 'Token inválido'}`)
    }

    const user = await userResponse.json()
    if (!user || !user.id) throw new Error('Usuário não autenticado: Token inválido')

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    })

    const payload = await req.json()
    let records = payload.records
    const type = payload.type
    const fileName = payload.fileName
    const allowIncomplete = payload.allowIncomplete === true
    const mode = payload.mode || 'UPDATE'
    const simulation = payload.simulation === true
    const organizationId =
      payload.organizationId && payload.organizationId !== 'USE_SPREADSHEET'
        ? payload.organizationId
        : null
    const rootMapping = payload.rootMapping || {}

    if (payload.fileBase64) {
      try {
        const binaryString = atob(payload.fileBase64)
        const bytes = new Uint8Array(binaryString.length)
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i)
        }

        let isCsv = payload.fileName && payload.fileName.toLowerCase().endsWith('.csv')
        let textContent = ''
        if (isCsv) {
          textContent = new TextDecoder('utf-8').decode(bytes)
          if (textContent.includes('\uFFFD')) {
            textContent = new TextDecoder('iso-8859-1').decode(bytes)
          }
        }

        let rawRecords: any[] = []

        if (isCsv && textContent.includes(';')) {
          const parseCSV = (text: string, delimiter: string) => {
            const rows: string[][] = []
            let currentRow: string[] = []
            let currentCell = ''
            let inQuotes = false

            for (let i = 0; i < text.length; i++) {
              const char = text[i]
              const nextChar = text[i + 1]

              if (char === '"') {
                if (inQuotes && nextChar === '"') {
                  currentCell += '"'
                  i++
                } else {
                  inQuotes = !inQuotes
                }
              } else if (char === delimiter && !inQuotes) {
                currentRow.push(currentCell)
                currentCell = ''
              } else if ((char === '\n' || (char === '\r' && nextChar === '\n')) && !inQuotes) {
                if (char === '\r') i++
                currentRow.push(currentCell)
                if (currentRow.some((c) => c.trim() !== '')) rows.push(currentRow)
                currentRow = []
                currentCell = ''
              } else {
                currentCell += char
              }
            }
            if (currentCell || currentRow.length > 0) {
              currentRow.push(currentCell)
              if (currentRow.some((c) => c.trim() !== '')) rows.push(currentRow)
            }
            return rows
          }

          const delimiter =
            textContent.split(';').length > textContent.split(',').length ? ';' : ','
          const parsedRows = parseCSV(textContent, delimiter)

          if (parsedRows.length > 0) {
            const headers = parsedRows[0].map((h) => h.trim())
            for (let i = 1; i < parsedRows.length; i++) {
              const values = parsedRows[i].map((v) => v.trim())
              const row: any = {}
              headers.forEach((h, idx) => {
                row[h] = values[idx] || ''
              })
              rawRecords.push(row)
            }
          }
        } else {
          const workbook = XLSX.read(bytes, { type: 'array' })
          const firstSheet = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[firstSheet]
          rawRecords = XLSX.utils.sheet_to_json(worksheet, { defval: '' })
        }

        records = rawRecords.map((r: any) => {
          const normalized: any = {}
          for (const key in r) {
            const cleanKey = key
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .toUpperCase()
              .trim()
            normalized[cleanKey] =
              r[key] !== null && r[key] !== undefined ? String(r[key]).trim() : ''
          }
          return normalized
        })
      } catch (err: any) {
        throw new Error('Erro ao processar o arquivo: ' + err.message)
      }
    }

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

    if (!Array.isArray(records) || records.length === 0) {
      throw new Error(
        'O formato dos dados é inválido ou a planilha está vazia. Uma lista de registros era esperada.',
      )
    }

    let inserted = 0
    let rejected = 0
    const errors: any[] = []

    const addError = (rowNum: number, msg: string, rowData: any) => {
      rejected++
      errors.push({ row: rowNum, error: msg, data: rowData })
    }

    const { data: orgs, error: orgsError } = await supabase
      .from('organizations')
      .select('id, name')
      .is('deleted_at', null)

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
    const validOrgs = new Set<string>()
    if (orgs) {
      orgs.forEach((o: any) => {
        if (o.name) orgMap.set(o.name.trim().toLowerCase(), o.id)
        validOrgs.add(o.id)
      })
    }

    if (type === 'COMPANIES') {
      for (let i = 0; i < records.length; i++) {
        const row = records[i]
        const rowNum = i + 1

        const getVal = (r: any, possibleKeys: string[]) => {
          const keys = Object.keys(r)
          for (const pk of possibleKeys) {
            const cleanPk = pk.replace(/[^A-Z0-9]/g, '')
            for (const k of keys) {
              const cleanK = k.replace(/[^A-Z0-9]/g, '')
              if (cleanK === cleanPk) return r[k]
            }
          }
          return null
        }

        const nome = getVal(row, ['NOME', 'RAZAOSOCIAL', 'EMPRESA'])
        if (!allowIncomplete && (!nome || String(nome).trim() === '')) {
          addError(rowNum, 'A coluna NOME está vazia.', row)
          continue
        }

        const cnpj = String(getVal(row, ['CNPJ']) || '').trim()
        const cpf = String(getVal(row, ['CPF']) || '').trim()

        if (cnpj) {
          const { data: existingCnpj } = await supabase
            .from('organizations')
            .select('id')
            .eq('cnpj', cnpj)
            .is('deleted_at', null)
            .maybeSingle()
          if (existingCnpj) {
            addError(rowNum, `CNPJ "${cnpj}" já cadastrado.`, row)
            continue
          }
        }

        const { error: insertError } = await supabase.from('organizations').insert({
          user_id: user.id,
          name: String(nome || `Empresa ${rowNum}`),
          cnpj: cnpj || null,
          cpf: cpf || null,
          email: String(getVal(row, ['EMAIL']) || ''),
          phone: String(getVal(row, ['TELEFONE', 'FONE']) || ''),
          address: String(getVal(row, ['ENDERECO', 'END']) || ''),
          observations: String(getVal(row, ['OBSERVACOES', 'OBS']) || ''),
          status: true,
        })

        if (insertError) {
          addError(rowNum, `Erro ao inserir - ${insertError.message}`, row)
        } else {
          inserted++
        }
      }
    } else if (type === 'DEPARTMENTS') {
      for (let i = 0; i < records.length; i++) {
        const row = records[i]
        const rowNum = i + 1

        const getVal = (r: any, possibleKeys: string[]) => {
          const keys = Object.keys(r)
          for (const pk of possibleKeys) {
            const cleanPk = pk.replace(/[^A-Z0-9]/g, '')
            for (const k of keys) {
              const cleanK = k.replace(/[^A-Z0-9]/g, '')
              if (cleanK === cleanPk) return r[k]
            }
          }
          return null
        }

        const nome = getVal(row, ['NOME', 'DEPARTAMENTO'])
        if (!allowIncomplete && (!nome || String(nome).trim() === '')) {
          addError(rowNum, 'A coluna NOME está vazia.', row)
          continue
        }

        const codigo = String(getVal(row, ['CODIGO', 'COD']) || '').trim()

        if (codigo) {
          const { data: existingCode } = await supabase
            .from('departments')
            .select('id')
            .eq('code', codigo)
            .is('deleted_at', null)
            .maybeSingle()
          if (existingCode) {
            addError(rowNum, `Código "${codigo}" já cadastrado.`, row)
            continue
          }
        }

        const { error: insertError } = await supabase.from('departments').insert({
          user_id: user.id,
          name: String(nome || `Depto ${rowNum}`),
          code: codigo || `DEP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        })

        if (insertError) {
          addError(rowNum, `Erro ao inserir - ${insertError.message}`, row)
        } else {
          inserted++
        }
      }
    } else if (type === 'EMPLOYEES') {
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
      const supabaseAdmin = supabaseServiceKey
        ? createClient(supabaseUrl, supabaseServiceKey)
        : null

      if (!supabaseAdmin) {
        throw new Error('Configuração de servidor incompleta (Service Role Key ausente).')
      }

      const resendApiKey = Deno.env.get('RESEND_API_KEY')
      const origin = req.headers.get('origin') || 'https://gestao-de-contas-f8bf6.goskip.app'
      const redirectTo = `${origin}/reset-password`

      const auditLogsToInsert: any[] = []
      const auditDetailsToInsert: any[] = []

      for (let i = 0; i < records.length; i++) {
        const row = records[i]
        const rowNum = i + 1

        const getVal = (r: any, possibleKeys: string[]) => {
          const keys = Object.keys(r)
          for (const pk of possibleKeys) {
            const cleanPk = pk.replace(/[^A-Z0-9]/g, '')
            for (const k of keys) {
              const cleanK = k.replace(/[^A-Z0-9]/g, '')
              if (cleanK === cleanPk) return r[k]
            }
          }
          return null
        }

        const nome = getVal(row, ['NOME'])
        if (!allowIncomplete && (!nome || String(nome).trim() === '')) {
          addError(rowNum, 'A coluna NOME é obrigatória.', row)
          continue
        }

        const email = String(getVal(row, ['EMAIL']) || '').trim()
        if (!email) {
          addError(rowNum, 'A coluna EMAIL é obrigatória para importação de usuários.', row)
          continue
        }

        const rawCpf = String(getVal(row, ['CPF']) || '').trim()
        let cpf = rawCpf
        const cpfDigits = rawCpf.replace(/\D/g, '')
        if (cpfDigits.length === 11) {
          cpf = cpfDigits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
        }

        let depId = null
        const depCode = String(getVal(row, ['DEPARTAMENTOCODIGO', 'DEPARTAMENTO']) || '').trim()
        if (depCode) {
          const { data: dep } = await supabase
            .from('departments')
            .select('id')
            .eq('code', depCode)
            .is('deleted_at', null)
            .maybeSingle()
          if (dep) {
            depId = dep.id
          } else if (!allowIncomplete) {
            addError(rowNum, `Departamento "${depCode}" não encontrado.`, row)
            continue
          }
        }

        const action = row['_action'] || 'insert'
        const existingId = row['_existingId']

        const perfil = String(getVal(row, ['PERFIL', 'ROLE']) || 'collaborator').toLowerCase()
        const validRoles = ['admin', 'supervisor', 'collaborator', 'client_user']
        const roleToInsert = validRoles.includes(perfil) ? perfil : 'collaborator'

        if (existingId) {
          if (action === 'restore') {
            const updatePayload: any = {
              approval_status: 'approved',
              pending_deletion: false,
              deletion_requested_at: null,
              deletion_requested_by: null,
              status: true,
              deleted_at: null,
            }

            const { error: updateError } = await supabaseAdmin
              .from('cadastro_usuarios')
              .update(updatePayload)
              .eq('id', existingId)

            if (updateError) {
              addError(rowNum, `Erro ao reativar usuário: ${updateError.message}`, row)
            } else {
              inserted++
              const auditId = crypto.randomUUID()
              auditLogsToInsert.push({
                id: auditId,
                entity_type: 'usuario',
                entity_id: existingId,
                action: 'UPDATE',
                performed_by: user.id,
                changes: { status: { old: false, new: true } },
              })
              auditDetailsToInsert.push({
                audit_log_id: auditId,
                field_name: 'status',
                old_value: 'false',
                new_value: 'true',
              })
            }
            continue
          } else if (action === 'insert' || action === 'approve') {
            const updatePayload: any = {
              name: String(nome),
              department_id: depId || null,
              role: roleToInsert,
              cpf: cpf || null,
              approval_status: 'approved',
              pending_deletion: false,
              deletion_requested_at: null,
              deletion_requested_by: null,
              status: true,
              deleted_at: null,
            }

            const telefoneVal = getVal(row, ['TELEFONE', 'CELULAR'])
            const enderecoVal = getVal(row, ['ENDERECO', 'END'])
            const obsVal = getVal(row, ['OBSERVACOES', 'OBS'])

            if (telefoneVal !== null && telefoneVal !== undefined)
              updatePayload.phone = String(telefoneVal).trim() || null
            if (enderecoVal !== null && enderecoVal !== undefined)
              updatePayload.address = String(enderecoVal).trim() || null
            if (obsVal !== null && obsVal !== undefined)
              updatePayload.observations = String(obsVal).trim() || null

            const { error: updateError } = await supabaseAdmin
              .from('cadastro_usuarios')
              .update(updatePayload)
              .eq('id', existingId)

            if (updateError) {
              addError(
                rowNum,
                `Erro ao atualizar usuário pela planilha: ${updateError.message}`,
                row,
              )
            } else {
              inserted++
              const auditId = crypto.randomUUID()
              const changes: any = {}
              Object.keys(updatePayload).forEach((k) => {
                changes[k] = { new: updatePayload[k] }
              })
              auditLogsToInsert.push({
                id: auditId,
                entity_type: 'usuario',
                entity_id: existingId,
                action: 'UPDATE',
                performed_by: user.id,
                changes,
              })
              Object.entries(changes).forEach(([field, { new: newVal }]: [string, any]) => {
                auditDetailsToInsert.push({
                  audit_log_id: auditId,
                  field_name: field,
                  new_value: newVal !== null ? String(newVal) : null,
                })
              })
            }
            continue
          }
        }

        // Validate duplicates for completely new inserts
        const { data: existingUserId } = await supabaseAdmin.rpc('get_auth_user_by_email', {
          p_email: email,
        })
        if (existingUserId) {
          addError(rowNum, `E-mail "${email}" já está em uso no sistema.`, row)
          continue
        }

        if (cpf) {
          const { data: existingUserCpf } = await supabaseAdmin
            .from('cadastro_usuarios')
            .select('id')
            .eq('cpf', cpf)
            .is('deleted_at', null)
            .maybeSingle()
          if (existingUserCpf) {
            addError(rowNum, `CPF "${cpf}" já está em uso por outro usuário ativo.`, row)
            continue
          }
        }

        const { data: inviteData, error: inviteError } =
          await supabaseAdmin.auth.admin.generateLink({
            type: 'invite',
            email: email,
            options: { redirectTo },
            data: {
              name: String(nome),
              role: roleToInsert,
              cpf: cpf || null,
              phone: String(getVal(row, ['TELEFONE', 'CELULAR']) || '') || null,
              department_id: depId || null,
              admin_id: user.id,
            },
          })

        if (inviteError) {
          addError(rowNum, `Erro ao convidar: ${inviteError.message}`, row)
          continue
        }

        if (inviteData.user) {
          let profile = null
          for (let retries = 0; retries < 3; retries++) {
            const { data } = await supabaseAdmin
              .from('cadastro_usuarios')
              .select('id')
              .eq('user_id', inviteData.user.id)
              .maybeSingle()
            if (data) {
              profile = data
              break
            }
            await new Promise((r) => setTimeout(r, 500))
          }

          if (profile) {
            await supabaseAdmin
              .from('cadastro_usuarios')
              .update({
                address: String(getVal(row, ['ENDERECO', 'END']) || '') || null,
                observations: String(getVal(row, ['OBSERVACOES', 'OBS']) || '') || null,
              })
              .eq('id', profile.id)

            const auditId = crypto.randomUUID()
            const changes = {
              name: { new: String(nome) },
              email: { new: email },
              role: { new: roleToInsert },
              cpf: { new: cpf || null },
              department_id: { new: depId || null },
            }
            auditLogsToInsert.push({
              id: auditId,
              entity_type: 'usuario',
              entity_id: profile.id,
              action: 'CREATE',
              performed_by: user.id,
              changes,
            })
            Object.entries(changes).forEach(([field, { new: newVal }]: [string, any]) => {
              auditDetailsToInsert.push({
                audit_log_id: auditId,
                field_name: field,
                new_value: newVal !== null ? String(newVal) : null,
              })
            })
          } else {
            console.error('Profile not found after retries for user:', inviteData.user.id)
          }

          const actionLink = inviteData.properties?.action_link
          if (actionLink && resendApiKey) {
            const subject = 'Convite de Acesso - Gestão de Contas'
            const htmlBody = `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                <div style="text-align: center; margin-bottom: 20px;">
                  <h1 style="color: #0f172a; margin: 0;">Gestão de Contas</h1>
                </div>
                <h2 style="color: #0f172a; text-align: center;">Bem-vindo(a)!</h2>
                <p style="color: #334155; font-size: 16px;">Olá <strong>${nome}</strong>,</p>
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
            }).catch((e) => console.error('Erro ao enviar email', e))
          }
        }
        inserted++
      }

      if (auditLogsToInsert.length > 0) {
        const { error: logsError } = await supabaseAdmin
          .from('audit_logs')
          .insert(auditLogsToInsert)
        if (logsError) console.error('Error inserting audit logs:', logsError)

        if (auditDetailsToInsert.length > 0) {
          for (let i = 0; i < auditDetailsToInsert.length; i += 1000) {
            const { error: detailsError } = await supabaseAdmin
              .from('audit_details')
              .insert(auditDetailsToInsert.slice(i, i + 1000))
            if (detailsError) console.error('Error inserting audit details:', detailsError)
          }
        }
      }
    } else if (type === 'BANK_ACCOUNTS') {
      let existingAccounts: any[] = []
      let fetchHasMore = true
      let fetchPage = 0
      while (fetchHasMore) {
        const { data: pageData, error: existingAccError } = await supabase
          .from('bank_accounts')
          .select('id, organization_id, account_number, check_digit')
          .is('deleted_at', null)
          .range(fetchPage * 1000, (fetchPage + 1) * 1000 - 1)

        if (existingAccError) {
          throw new Error('Erro ao buscar contas bancárias existentes: ' + existingAccError.message)
        }

        if (pageData && pageData.length > 0) {
          existingAccounts.push(...pageData)
          fetchPage++
          if (pageData.length < 1000) fetchHasMore = false
        } else {
          fetchHasMore = false
        }
      }

      const normalizeAcc = (str: any) =>
        String(str || '')
          .replace(/[^0-9A-Z]/gi, '')
          .toUpperCase()
          .replace(/^0+/, '') || '0'

      const existingAccSet = new Set(
        existingAccounts?.map(
          (a: any) =>
            `${a.organization_id}-${normalizeAcc(a.account_number)}-${normalizeAcc(a.check_digit)}`,
        ) || [],
      )

      if (organizationId && !validOrgs.has(organizationId)) {
        throw new Error('A empresa selecionada é inválida ou você não tem permissão.')
      }
      for (let i = 0; i < records.length; i++) {
        const row = records[i]
        const rowNum = i + 1

        const getVal = (r: any, possibleKeys: string[]) => {
          const keys = Object.keys(r)
          for (const pk of possibleKeys) {
            const cleanPk = pk.replace(/[^A-Z0-9]/g, '')
            for (const k of keys) {
              const cleanK = k.replace(/[^A-Z0-9]/g, '')
              if (cleanK === cleanPk) return r[k]
            }
          }
          return null
        }

        const empresa = getVal(row, ['EMPRESA'])
        const contaContabil = getVal(row, ['CONTACONTABIL', 'CONTA_CONTABIL'])

        let orgId = organizationId
        if (!orgId) {
          if (!allowIncomplete && (!empresa || String(empresa).trim() === '')) {
            addError(rowNum, 'A coluna Empresa está vazia e nenhuma empresa foi selecionada.', row)
            continue
          }

          orgId = empresa ? orgMap.get(String(empresa).trim().toLowerCase()) : null
          if (!orgId) {
            addError(
              rowNum,
              `A empresa "${empresa}" não foi encontrada na sua conta. (Obrigatório)`,
              row,
            )
            continue
          }
        }

        const rawAccountNumber = String(
          getVal(row, ['NROCONTA', 'NUMERODACONTA', 'CONTA', 'NUMERO']) || '',
        ).trim()
        const rawCheckDigit = String(getVal(row, ['DIGITOCONTA', 'DIGITO', 'DV']) || '').trim()

        const normalizedAcc = normalizeAcc(rawAccountNumber)
        const normalizedDigit = normalizeAcc(rawCheckDigit)
        const accountKey = `${orgId}-${normalizedAcc}-${normalizedDigit}`

        if (existingAccSet.has(accountKey)) {
          addError(
            rowNum,
            `A Conta Bancária com número "${rawAccountNumber}" e dígito "${rawCheckDigit}" já está cadastrada para esta empresa.`,
            row,
          )
          continue
        }

        const { error: insertError } = await supabase.from('bank_accounts').insert({
          organization_id: orgId,
          account_code: String(contaContabil || ''),
          account_type: String(getVal(row, ['CODCAIXA', 'TIPODECONTA', 'TIPO']) || ''),
          description: String(getVal(row, ['DESCRICAO', 'NOME']) || ''),
          bank_code: String(getVal(row, ['NUMBANCO', 'BANCO', 'CODBANCO']) || ''),
          agency: String(getVal(row, ['NUMAGENCIA', 'AGENCIA']) || ''),
          account_number: rawAccountNumber,
          classification: String(getVal(row, ['CLASSIFICACAO']) || ''),
          check_digit: rawCheckDigit,
          company_name: String(empresa || ''),
        })

        if (insertError) {
          addError(rowNum, `Erro ao inserir no banco - ${insertError.message}`, row)
        } else {
          existingAccSet.add(accountKey)
          inserted++
        }
      }
    } else if (type === 'COST_CENTERS') {
      const sortedRecords = [...records].map((r, i) => ({ ...r, _originalIndex: i + 1 }))
      sortedRecords.sort((a, b) => String(a['COD'] || '').length - String(b['COD'] || '').length)

      if (organizationId && !validOrgs.has(organizationId)) {
        throw new Error('A empresa selecionada é inválida ou você não tem permissão.')
      }
      for (let i = 0; i < sortedRecords.length; i++) {
        const row = sortedRecords[i]
        const rowNum = row._originalIndex

        const getVal = (r: any, possibleKeys: string[]) => {
          const keys = Object.keys(r)
          for (const pk of possibleKeys) {
            const cleanPk = pk.replace(/[^A-Z0-9]/g, '')
            for (const k of keys) {
              const cleanK = k.replace(/[^A-Z0-9]/g, '')
              if (cleanK === cleanPk) return r[k]
            }
          }
          return null
        }

        const empresa = getVal(row, ['EMPRESA'])
        const code = getVal(row, ['COD', 'CODIGO'])
        const description = getVal(row, ['DESCRICAO', 'NOME'])

        let orgId = organizationId
        if (!orgId) {
          if (!allowIncomplete && (!empresa || String(empresa).trim() === '')) {
            addError(rowNum, 'A coluna Empresa está vazia e nenhuma empresa foi selecionada.', row)
            continue
          }

          orgId = empresa ? orgMap.get(String(empresa).trim().toLowerCase()) : null
          if (!orgId) {
            addError(
              rowNum,
              `A empresa "${empresa}" não foi encontrada na sua conta. (Obrigatório)`,
              row,
            )
            continue
          }
        }

        if (!allowIncomplete && (!code || String(code).trim() === '')) {
          addError(rowNum, 'A coluna Código está vazia.', row)
          continue
        }

        if (!allowIncomplete && (!description || String(description).trim() === '')) {
          addError(rowNum, 'A coluna Descrição está vazia.', row)
          continue
        }

        const strCode = String(code || '').trim()
        let parentId = null

        if (strCode.includes('.') && orgId) {
          const codeParts = strCode.split('.')
          codeParts.pop()
          const parentCode = codeParts.join('.')

          const { data: parentData, error: parentError } = await supabase
            .from('cost_centers')
            .select('id')
            .eq('organization_id', orgId)
            .eq('code', parentCode)
            .is('deleted_at', null)
            .maybeSingle()

          if (parentError && !allowIncomplete) {
            addError(rowNum, `Erro ao buscar centro de custo pai - ${parentError.message}`, row)
            continue
          }

          if (parentData) {
            parentId = parentData.id
          } else if (!allowIncomplete) {
            addError(
              rowNum,
              `Centro de custo pai "${parentCode}" não encontrado para hierarquia.`,
              row,
            )
            continue
          }
        }

        const { data: existing, error: checkError } = await supabase
          .from('cost_centers')
          .select('id')
          .eq('organization_id', orgId || '')
          .eq('code', strCode)
          .is('deleted_at', null)
          .maybeSingle()

        if (checkError && orgId) {
          addError(rowNum, `Falha ao verificar duplicata - ${checkError.message}`, row)
          continue
        }

        if (existing) {
          addError(rowNum, `O código "${strCode}" já está cadastrado para esta empresa.`, row)
          continue
        }

        let tipoTgaId = null
        const strTipoTga = String(getVal(row, ['TIPOTGA']) || '').trim()
        if (strTipoTga && orgId) {
          const { data: tgaData } = await supabase
            .from('tipo_conta_tga')
            .select('id')
            .eq('organization_id', orgId)
            .ilike('nome', strTipoTga)
            .is('deleted_at', null)
            .maybeSingle()

          if (tgaData) {
            tipoTgaId = tgaData.id
          } else {
            const { data: tgaDataCode } = await supabase
              .from('tipo_conta_tga')
              .select('id')
              .eq('organization_id', orgId)
              .eq('codigo', strTipoTga)
              .is('deleted_at', null)
              .maybeSingle()
            if (tgaDataCode) {
              tipoTgaId = tgaDataCode.id
            } else if (!allowIncomplete) {
              addError(rowNum, `Tipo TGA "${strTipoTga}" não encontrado.`, row)
              continue
            }
          }
        }

        const { error: insertError } = await supabase.from('cost_centers').insert({
          organization_id: orgId,
          code: strCode,
          description: String(description || ''),
          parent_id: parentId || null,
          type_tga: String(getVal(row, ['TIPO']) || ''),
          tipo_tga_id: tipoTgaId,
          fixed_variable: String(getVal(row, ['FIXOOUVARIAVEL', 'FIXO_VARIAVEL']) || ''),
          classification: String(getVal(row, ['CLASSIFICACAO']) || ''),
          operational: String(getVal(row, ['OPERACIONAL']) || ''),
          tipo_lcto: String(getVal(row, ['TIPOLCTO', 'TIPO_LCTO']) || ''),
          contabiliza: String(getVal(row, ['CONTABILIZA']) || ''),
          observacoes: String(getVal(row, ['OBSERVACOES']) || ''),
        } as any)

        if (insertError) {
          addError(rowNum, `Erro ao inserir no banco - ${insertError.message}`, row)
        } else {
          inserted++
        }
      }
    } else if (type === 'CHART_ACCOUNTS') {
      if (organizationId && !validOrgs.has(organizationId)) {
        throw new Error('A empresa selecionada é inválida ou você não tem permissão.')
      }
      const recordsByOrg = new Map<string, any[]>()

      for (let i = 0; i < records.length; i++) {
        const row = records[i]
        const rowNum = i + 1
        const empresa = row['EMPRESA']

        let orgId = organizationId
        if (!orgId) {
          if (!allowIncomplete && (!empresa || String(empresa).trim() === '')) {
            addError(rowNum, 'A coluna Empresa está vazia e nenhuma empresa foi selecionada.', row)
            continue
          }

          orgId = empresa ? orgMap.get(String(empresa).trim().toLowerCase()) : null
          if (!orgId) {
            addError(rowNum, `A empresa "${empresa}" não foi encontrada na sua conta.`, row)
            continue
          }
        }

        if (!recordsByOrg.has(orgId)) recordsByOrg.set(orgId, [])
        recordsByOrg.get(orgId)!.push({ row, rowNum })
      }

      let totalToInsert = 0
      let totalToUpdate = 0
      let totalToDelete = 0
      let detectedMasks = new Set<string>()
      let uniqueRoots = new Set<string>()

      const sanitize = (str: string | null) =>
        String(str || '')
          .replace(/\s+/g, '')
          .toLowerCase()
          .trim()
      const detectMask = (str: string) => str.replace(/\d/g, 'X')

      const simulationDetails = []

      for (const [orgId, orgRecords] of recordsByOrg.entries()) {
        let existingContas: any[] = []
        let fetchHasMore = true
        let fetchPage = 0
        while (fetchHasMore) {
          const { data: pageData, error: fetchError } = await supabase
            .from('chart_of_accounts')
            .select('*')
            .eq('organization_id', orgId)
            .is('deleted_at', null)
            .range(fetchPage * 1000, (fetchPage + 1) * 1000 - 1)

          if (fetchError) {
            throw new Error(`Erro ao buscar plano de contas existente: ${fetchError.message}`)
          }

          if (pageData && pageData.length > 0) {
            existingContas.push(...pageData)
            fetchPage++
            if (pageData.length < 1000) fetchHasMore = false
          } else {
            fetchHasMore = false
          }
        }

        const existingByKey = new Map<string, any>()
        const allClassifications = new Set<string>()

        existingContas.forEach((c: any) => {
          const sClass = sanitize(c.classification)
          const sCode = sanitize(c.account_code)
          const key = `${sCode}|${sClass}`
          if (sCode && sClass) existingByKey.set(key, c)

          if (c.classification) {
            detectedMasks.add(detectMask(c.classification.trim()))
            allClassifications.add(c.classification.trim())
          }
        })

        const toInsert: any[] = []
        const toUpdate: any[] = []
        const processedIds = new Set<string>()
        const parsedRows = []

        for (const item of orgRecords) {
          const row = item.row
          const getVal = (r: any, possibleKeys: string[]) => {
            const keys = Object.keys(r)
            for (const pk of possibleKeys) {
              const cleanPk = pk.replace(/[^A-Z0-9]/g, '')
              for (const k of keys) {
                const cleanK = k.replace(/[^A-Z0-9]/g, '')
                if (cleanK === cleanPk) return r[k]
              }
            }
            return null
          }

          const code = getVal(row, [
            'CODIGOREDUZIDO',
            'CODIGO',
            'REDUZIDO',
            'CODIGODACONTA',
            'CODCONTA',
            'COD',
            'CODIGOCONTA',
            'CONTAREDUZIDA',
          ])
          const name = getVal(row, [
            'NOMEDACONTA',
            'NOME',
            'DESCRICAO',
            'CONTA',
            'TITULO',
            'NOMECONTA',
            'DESCRICAOCONTA',
          ])
          const accountType = getVal(row, ['TIPODECONTA', 'TIPO', 'GRUPOCONTABIL', 'TIPOCONTA'])
          const classification = getVal(row, [
            'CLASSIFICACAO',
            'CONTACONTABIL',
            'MASCARA',
            'CODIGOCLASSIFICACAO',
            'ESTRUTURA',
            'NIVEL',
            'CLASSIFICACAOCONTA',
            'MASCARACONTA',
          ])
          const nature = getVal(row, ['NATUREZA', 'NATUREZACONTA'])
          const accountBehavior = getVal(row, [
            'COMPORTAMENTO',
            'TIPOLANCAMENTO',
            'TIPOCOMPORTAMENTO',
          ])

          const isEmpty = (v: any) => v === null || v === undefined || String(v).trim() === ''

          // Silently skip rows that are completely empty in the main account fields (likely separator/page rows from ERPs)
          if (isEmpty(code) && isEmpty(name)) {
            continue
          }

          if (!allowIncomplete && isEmpty(code)) {
            addError(item.rowNum, 'A coluna Código Reduzido está vazia ou não foi encontrada.', row)
            continue
          }
          if (!allowIncomplete && isEmpty(name)) {
            addError(item.rowNum, 'A coluna Nome da Conta está vazia ou não foi encontrada.', row)
            continue
          }
          if (!allowIncomplete && isEmpty(classification)) {
            addError(
              item.rowNum,
              'A coluna Classificação está vazia ou a coluna não foi encontrada. Certifique-se de que a planilha contém uma coluna chamada "Classificação" ou "Classificacao Conta".',
              row,
            )
            continue
          }

          const strCode = String(code || '').trim()
          let strClass = String(classification || '').trim()

          // Se tiver máscara explícita (ex: mascara_parametro = 9.9.99.99.99)
          const maskStr = getVal(row, ['MASCARAPARAMETRO', 'MASCARARELATORIO', 'FORMATO'])
          if (maskStr && strClass && !strClass.includes('.')) {
            let formatted = ''
            let charIndex = 0
            const maskPattern = String(maskStr)
            for (let i = 0; i < maskPattern.length; i++) {
              if (maskPattern[i] === '.' || maskPattern[i] === '-') {
                if (charIndex < strClass.length) {
                  formatted += maskPattern[i]
                }
              } else {
                if (charIndex < strClass.length) {
                  formatted += strClass[charIndex++]
                } else {
                  break
                }
              }
            }
            // Remove trailing dots se houver
            strClass = formatted.replace(/[\.\-]+$/, '')
          }

          // Aplicar máscara inferida se estiver sem pontos e não formatou acima
          if (strClass && !strClass.includes('.')) {
            const knownMasks = Array.from(detectedMasks)
            const matchedMask = knownMasks.find(
              (m) => m.replace(/\./g, '').length === strClass.length,
            )
            if (matchedMask) {
              let formatted = ''
              let charIndex = 0
              for (let i = 0; i < matchedMask.length; i++) {
                if (matchedMask[i] === '.') formatted += '.'
                else formatted += strClass[charIndex++]
              }
              strClass = formatted
            }
          }

          if (strClass) {
            detectedMasks.add(detectMask(strClass))
            allClassifications.add(strClass)
            uniqueRoots.add(strClass.split(/[\.-]/)[0])
          }

          parsedRows.push({
            ...item,
            strCode,
            strClass,
            name,
            accountType,
            nature,
            accountBehavior,
          })
        }

        const classList = Array.from(allClassifications)

        for (const item of parsedRows) {
          const { row, strCode, strClass, name, accountType, nature, accountBehavior } = item

          const isSynthetic = strClass
            ? classList.some(
                (c) =>
                  c.length > strClass.length &&
                  (c.startsWith(strClass + '.') || c.startsWith(strClass + '-')),
              )
            : false
          const account_level = isSynthetic ? 'Sintética' : 'Analítica'

          const rootClass = strClass ? strClass.split(/[\.-]/)[0] : ''
          const mapping = rootMapping[rootClass] || {}

          const sClass = sanitize(strClass)
          const sCode = sanitize(strCode)
          const key = `${sCode}|${sClass}`
          const existing = key !== '|' ? existingByKey.get(key) : null

          const payloadData = {
            organization_id: orgId,
            account_code: strCode,
            account_name: String(name || ''),
            account_type: mapping.account_type || String(accountType || ''),
            classification: strClass,
            account_level: account_level,
            nature: mapping.nature || (nature ? String(nature) : null),
            account_behavior:
              mapping.account_behavior || (accountBehavior ? String(accountBehavior) : null),
          }

          if (existing) {
            if (existing.is_temp) {
              addError(
                item.rowNum,
                `Conta duplicada na própria planilha: A combinação de Código Reduzido "${strCode}" e Classificação "${strClass}" aparece mais de uma vez.`,
                row,
              )
            } else {
              if (mode !== 'INSERT_ONLY') {
                const updateRef = { ...payloadData, id: existing.id }
                toUpdate.push(updateRef)
                processedIds.add(existing.id)

                if (key !== '|') existingByKey.set(key, { is_temp: true, ref: updateRef })
              } else {
                processedIds.add(existing.id)
              }
            }
          } else {
            const newRef = { ...payloadData }
            toInsert.push(newRef)

            if (key !== '|') existingByKey.set(key, { is_temp: true, ref: newRef })
          }
        }

        let toDeleteIds: string[] = []
        if (mode === 'REPLACE') {
          toDeleteIds = existingContas
            .filter((c: any) => !processedIds.has(c.id))
            .map((c: any) => c.id)
        }

        totalToInsert += toInsert.length
        totalToUpdate += toUpdate.length
        totalToDelete += toDeleteIds.length

        simulationDetails.push({
          orgId,
          toInsert: toInsert.length,
          toUpdate: toUpdate.length,
          toDelete: toDeleteIds.length,
        })

        if (!simulation) {
          if (existingContas.length > 0) {
            await supabase.from('chart_of_accounts_backup').insert({
              organization_id: orgId,
              user_id: user.id,
              data: existingContas,
            })
          }

          if (toDeleteIds.length > 0) {
            for (let i = 0; i < toDeleteIds.length; i += 500) {
              await supabase
                .from('chart_of_accounts')
                .update({ deleted_at: new Date().toISOString(), deleted_by: user.id })
                .in('id', toDeleteIds.slice(i, i + 500))
            }
          }

          for (let i = 0; i < toInsert.length; i += 500) {
            const { error: insErr } = await supabase
              .from('chart_of_accounts')
              .insert(toInsert.slice(i, i + 500))
            if (insErr) throw new Error(`Erro na inserção em lote: ${insErr.message}`)
          }

          for (let i = 0; i < toUpdate.length; i += 500) {
            const chunk = toUpdate.slice(i, i + 500)
            const { error: updErr } = await supabase.from('chart_of_accounts').upsert(chunk)
            if (updErr) throw new Error(`Erro na atualização em lote: ${updErr.message}`)
          }

          inserted += toInsert.length + toUpdate.length
        }
      }

      if (simulation) {
        const sortedRoots = Array.from(uniqueRoots).sort((a, b) => {
          const numA = parseInt(a)
          const numB = parseInt(b)
          if (!isNaN(numA) && !isNaN(numB)) return numA - numB
          return a.localeCompare(b)
        })

        return new Response(
          JSON.stringify({
            simulation: true,
            detectedMasks: Array.from(detectedMasks),
            uniqueRoots: sortedRoots,
            totalToInsert,
            totalToUpdate,
            totalToDelete,
            details: simulationDetails,
            errors,
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          },
        )
      }
    } else if (type === 'MAPPINGS') {
      if (organizationId && !validOrgs.has(organizationId)) {
        throw new Error('A empresa selecionada é inválida ou você não tem permissão.')
      }
      for (let i = 0; i < records.length; i++) {
        const row = records[i]
        const rowNum = i + 1

        const getVal = (r: any, possibleKeys: string[]) => {
          const keys = Object.keys(r)
          for (const pk of possibleKeys) {
            const cleanPk = pk.replace(/[^A-Z0-9]/g, '')
            for (const k of keys) {
              const cleanK = k.replace(/[^A-Z0-9]/g, '')
              if (cleanK === cleanPk) return r[k]
            }
          }
          return null
        }

        const empresa = getVal(row, ['EMPRESA'])
        const centroCusto = getVal(row, ['CENTROCUSTO'])
        const contaContabil = getVal(row, ['CONTACONTABIL'])
        const tipoMapeamento = getVal(row, ['TIPOMAPEAMENTO', 'TIPO'])

        let orgId = organizationId
        if (!orgId) {
          if (!allowIncomplete && (!empresa || String(empresa).trim() === '')) {
            addError(rowNum, 'A coluna Empresa está vazia e nenhuma empresa foi selecionada.', row)
            continue
          }

          orgId = empresa ? orgMap.get(String(empresa).trim().toLowerCase()) : null
          if (!orgId) {
            addError(
              rowNum,
              `A empresa "${empresa}" não foi encontrada na sua conta. (Obrigatório)`,
              row,
            )
            continue
          }
        }

        if (!allowIncomplete && (!centroCusto || String(centroCusto).trim() === '')) {
          addError(rowNum, 'A coluna Centro de Custo está vazia.', row)
          continue
        }

        if (!allowIncomplete && (!contaContabil || String(contaContabil).trim() === '')) {
          addError(rowNum, 'A coluna Conta Contábil está vazia.', row)
          continue
        }

        const strCentroCusto = String(centroCusto || '').trim()
        const strContaContabil = String(contaContabil || '').trim()

        const { data: ccData, error: ccError } = await supabase
          .from('cost_centers')
          .select('id')
          .eq('organization_id', orgId || '')
          .eq('code', strCentroCusto)
          .is('deleted_at', null)
          .maybeSingle()

        if (!allowIncomplete && (ccError || !ccData)) {
          addError(rowNum, `Centro de Custo "${strCentroCusto}" não encontrado.`, row)
          continue
        }

        const { data: caData, error: caError } = await supabase
          .from('chart_of_accounts')
          .select('id')
          .eq('organization_id', orgId || '')
          .eq('account_code', strContaContabil)
          .is('deleted_at', null)
          .maybeSingle()

        if (!allowIncomplete && (caError || !caData)) {
          addError(rowNum, `Conta Contábil "${strContaContabil}" não encontrada.`, row)
          continue
        }

        if (ccData && caData) {
          const { data: existing, error: checkError } = await supabase
            .from('account_mapping')
            .select('id')
            .eq('organization_id', orgId || '')
            .eq('cost_center_id', ccData.id)
            .eq('chart_account_id', caData.id)
            .maybeSingle()

          if (checkError) {
            addError(rowNum, `Falha ao verificar duplicata - ${checkError.message}`, row)
            continue
          }

          if (existing) {
            addError(
              rowNum,
              `O mapeamento entre "${strCentroCusto}" e "${strContaContabil}" já existe.`,
              row,
            )
            continue
          }
        }

        const { error: insertError } = await supabase.from('account_mapping').insert({
          organization_id: orgId,
          cost_center_id: ccData?.id || null,
          chart_account_id: caData?.id || null,
          mapping_type: String(tipoMapeamento || 'DE/PARA'),
        })

        if (insertError) {
          addError(rowNum, `Erro ao inserir no banco - ${insertError.message}`, row)
        } else {
          inserted++
        }
      }
    } else if (type === 'FINANCIAL_ENTRIES') {
      if (organizationId && !validOrgs.has(organizationId)) {
        throw new Error('A empresa selecionada é inválida ou você não tem permissão.')
      }
      for (let i = 0; i < records.length; i++) {
        const row = records[i]
        const rowNum = i + 1

        const getVal = (r: any, possibleKeys: string[]) => {
          const keys = Object.keys(r)
          for (const pk of possibleKeys) {
            const cleanPk = pk.replace(/[^A-Z0-9]/g, '')
            for (const k of keys) {
              const cleanK = k.replace(/[^A-Z0-9]/g, '')
              if (cleanK === cleanPk) return r[k]
            }
          }
          return null
        }

        const empresa = getVal(row, ['EMPRESA'])
        const data = getVal(row, ['DATA'])
        const descricao = getVal(row, ['DESCRICAO', 'HISTORICO'])
        const valorRaw = getVal(row, ['VALOR'])
        const centroCusto = getVal(row, ['CENTROCUSTO'])
        const contaDebito = getVal(row, ['CONTADEBITO', 'DEBITO'])
        const contaCredito = getVal(row, ['CONTACREDITO', 'CREDITO'])

        let orgId = organizationId
        if (!orgId) {
          if (!allowIncomplete && (!empresa || String(empresa).trim() === '')) {
            addError(rowNum, 'A coluna Empresa está vazia e nenhuma empresa foi selecionada.', row)
            continue
          }
        }

        if (!allowIncomplete && (!data || String(data).trim() === '')) {
          addError(rowNum, 'A coluna Data está vazia.', row)
          continue
        }

        let parsedDate = new Date()
        let formattedDate = parsedDate.toISOString().split('T')[0]
        if (data) {
          const parsed = new Date(data)
          if (isNaN(parsed.getTime())) {
            if (!allowIncomplete) {
              addError(rowNum, 'A coluna DATA possui formato inválido.', row)
              continue
            }
          } else {
            parsedDate = parsed
            formattedDate = parsedDate.toISOString().split('T')[0]
          }
        }

        const valorStr = String(valorRaw || '0').replace(',', '.')
        const valor = parseFloat(valorStr)
        if (!allowIncomplete && isNaN(valor)) {
          addError(rowNum, 'A coluna VALOR possui formato numérico inválido.', row)
          continue
        }

        if (!orgId && empresa) {
          orgId = orgMap.get(String(empresa).trim().toLowerCase()) || null
        }

        if (!orgId) {
          addError(
            rowNum,
            `A empresa "${empresa}" não foi encontrada na sua conta. (Obrigatório)`,
            row,
          )
          continue
        }

        const strCentroCusto = String(centroCusto || '').trim()
        const { data: ccData, error: ccError } = await supabase
          .from('cost_centers')
          .select('id')
          .eq('organization_id', orgId || '')
          .eq('code', strCentroCusto)
          .maybeSingle()

        if (!allowIncomplete && (ccError || !ccData)) {
          addError(rowNum, `Centro de Custo "${strCentroCusto}" não encontrado.`, row)
          continue
        }

        const strContaDebito = String(contaDebito || '').trim()
        const { data: debitData, error: debitError } = await supabase
          .from('chart_of_accounts')
          .select('id')
          .eq('organization_id', orgId || '')
          .eq('account_code', strContaDebito)
          .is('deleted_at', null)
          .maybeSingle()

        if (!allowIncomplete && (debitError || !debitData)) {
          addError(rowNum, `Conta Débito "${strContaDebito}" não encontrada.`, row)
          continue
        }

        const strContaCredito = String(contaCredito || '').trim()
        const { data: creditData, error: creditError } = await supabase
          .from('chart_of_accounts')
          .select('id')
          .eq('organization_id', orgId || '')
          .eq('account_code', strContaCredito)
          .is('deleted_at', null)
          .maybeSingle()

        if (!allowIncomplete && (creditError || !creditData)) {
          addError(rowNum, `Conta Crédito "${strContaCredito}" não encontrada.`, row)
          continue
        }

        if (ccData && !isNaN(valor)) {
          const { data: existing, error: checkError } = await supabase
            .from('financial_movements')
            .select('id')
            .eq('organization_id', orgId || '')
            .eq('movement_date', formattedDate)
            .eq('amount', valor)
            .eq('cost_center_id', ccData.id)
            .maybeSingle()

          if (checkError && orgId) {
            addError(rowNum, `Falha ao verificar duplicata - ${checkError.message}`, row)
            continue
          }

          if (existing) {
            addError(rowNum, `Lançamento já existe com mesma data, valor e centro de custo.`, row)
            continue
          }
        }

        const { data: fm, error: insertError } = await supabase
          .from('financial_movements')
          .insert({
            organization_id: orgId,
            movement_date: formattedDate,
            amount: isNaN(valor) ? 0 : valor,
            description: String(descricao || ''),
            cost_center_id: ccData?.id || null,
            status: 'Concluído',
          })
          .select()
          .single()

        if (insertError) {
          addError(rowNum, `Erro ao inserir movimento financeiro - ${insertError.message}`, row)
          continue
        }

        const { error: aeError } = await supabase.from('accounting_entries').insert({
          organization_id: orgId,
          entry_date: formattedDate,
          amount: isNaN(valor) ? 0 : valor,
          description: String(descricao || ''),
          debit_account_id: debitData?.id || null,
          credit_account_id: creditData?.id || null,
          status: 'Concluído',
        })

        if (aeError) {
          if (fm) await supabase.from('financial_movements').delete().eq('id', fm.id)
          addError(rowNum, `Erro ao inserir lançamento contábil - ${aeError.message}`, row)
        } else {
          inserted++
        }
      }
    }

    await supabase.from('import_history').insert({
      user_id: user.id,
      import_type: type,
      file_name: fileName || 'Importação via CSV',
      total_records: records.length,
      success_count: inserted,
      error_count: rejected,
      status: 'Completed',
    })

    return new Response(JSON.stringify({ inserted, rejected, errors }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
