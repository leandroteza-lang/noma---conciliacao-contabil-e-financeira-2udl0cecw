import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import * as XLSX from 'npm:xlsx@0.18.5'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, x-supabase-client-platform, apikey, content-type',
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
      auth: { persistSession: false }
    })

    const payload = await req.json()
    let records = payload.records
    const type = payload.type
    const fileName = payload.fileName
    const allowIncomplete = payload.allowIncomplete === true

    if (payload.fileBase64) {
      try {
        const binaryString = atob(payload.fileBase64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const workbook = XLSX.read(bytes, { type: 'array' });
        const firstSheet = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheet];
        const rawRecords: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
        
        records = rawRecords.map((r: any) => {
          const normalized: any = {};
          for (const key in r) {
            const cleanKey = key.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();
            normalized[cleanKey] = r[key];
          }
          return normalized;
        });
      } catch (err: any) {
        throw new Error('Erro ao processar o arquivo Excel: ' + err.message);
      }
    }

    const SUPPORTED_TYPES = ['BANK_ACCOUNTS', 'COST_CENTERS', 'CHART_ACCOUNTS', 'MAPPINGS', 'FINANCIAL_ENTRIES', 'COMPANIES', 'DEPARTMENTS', 'EMPLOYEES']
    
    if (!SUPPORTED_TYPES.includes(type)) {
      return new Response(JSON.stringify({ error: 'Tipo de importação não suportado atualmente por esta função' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (!Array.isArray(records) || records.length === 0) {
      throw new Error('O formato dos dados é inválido ou a planilha está vazia. Uma lista de registros era esperada.')
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

    if (orgsError && (type === 'BANK_ACCOUNTS' || type === 'COST_CENTERS' || type === 'CHART_ACCOUNTS' || type === 'MAPPINGS' || type === 'FINANCIAL_ENTRIES')) {
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
        if (!allowIncomplete && (!nome || String(nome).trim() === '')) {
          addError(rowNum, 'A coluna NOME está vazia.', row)
          continue
        }

        const cnpj = String(row['CNPJ'] || '').trim()
        const cpf = String(row['CPF'] || '').trim()

        if (cnpj) {
          const { data: existingCnpj } = await supabase.from('organizations').select('id').eq('cnpj', cnpj).is('deleted_at', null).maybeSingle()
          if (existingCnpj) {
            addError(rowNum, `CNPJ "${cnpj}" já cadastrado.`, row)
            continue
          }
        }

        const { error: insertError } = await supabase
          .from('organizations')
          .insert({
            user_id: user.id,
            name: String(nome || `Empresa ${rowNum}`),
            cnpj: cnpj || null,
            cpf: cpf || null,
            email: String(row['EMAIL'] || ''),
            phone: String(row['TELEFONE'] || ''),
            address: String(row['ENDERECO'] || ''),
            observations: String(row['OBSERVACOES'] || ''),
            status: true
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

        const nome = row['NOME']
        if (!allowIncomplete && (!nome || String(nome).trim() === '')) {
          addError(rowNum, 'A coluna NOME está vazia.', row)
          continue
        }

        const codigo = String(row['CODIGO'] || '').trim()
        
        if (codigo) {
          const { data: existingCode } = await supabase.from('departments').select('id').eq('code', codigo).is('deleted_at', null).maybeSingle()
          if (existingCode) {
            addError(rowNum, `Código "${codigo}" já cadastrado.`, row)
            continue
          }
        }

        const { error: insertError } = await supabase
          .from('departments')
          .insert({
            user_id: user.id,
            name: String(nome || `Depto ${rowNum}`),
            code: codigo || `DEP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
          })

        if (insertError) {
          addError(rowNum, `Erro ao inserir - ${insertError.message}`, row)
        } else {
          inserted++
        }
      }
    } else if (type === 'EMPLOYEES') {
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
      const supabaseAdmin = supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null

      if (!supabaseAdmin) {
        throw new Error('Configuração de servidor incompleta (Service Role Key ausente).')
      }

      const resendApiKey = Deno.env.get('RESEND_API_KEY')
      const origin = req.headers.get('origin') || 'https://gestao-de-contas-f8bf6.goskip.app'
      const redirectTo = `${origin}/reset-password`

      const auditLogsToInsert: any[] = [];
      const auditDetailsToInsert: any[] = [];

      for (let i = 0; i < records.length; i++) {
        const row = records[i]
        const rowNum = i + 1

        const nome = row['NOME']
        if (!allowIncomplete && (!nome || String(nome).trim() === '')) {
          addError(rowNum, 'A coluna NOME é obrigatória.', row)
          continue
        }

        const email = String(row['EMAIL'] || '').trim()
        if (!email) {
          addError(rowNum, 'A coluna EMAIL é obrigatória para importação de usuários.', row)
          continue
        }

        const rawCpf = String(row['CPF'] || '').trim()
        let cpf = rawCpf
        const cpfDigits = rawCpf.replace(/\D/g, '')
        if (cpfDigits.length === 11) {
          cpf = cpfDigits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
        }

        let depId = null
        const depCode = String(row['DEPARTAMENTO_CODIGO'] || '').trim()
        if (depCode) {
          const { data: dep } = await supabase.from('departments').select('id').eq('code', depCode).is('deleted_at', null).maybeSingle()
          if (dep) {
            depId = dep.id
          } else if (!allowIncomplete) {
            addError(rowNum, `Departamento "${depCode}" não encontrado.`, row)
            continue
          }
        }

        const action = row['_action'] || 'insert'
        const existingId = row['_existingId']

        const perfil = String(row['PERFIL'] || 'collaborator').toLowerCase()
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
                    deleted_at: null
                }
                
                const { error: updateError } = await supabaseAdmin.from('cadastro_usuarios').update(updatePayload).eq('id', existingId);

                if (updateError) {
                    addError(rowNum, `Erro ao reativar usuário: ${updateError.message}`, row);
                } else {
                    inserted++;
                    const auditId = crypto.randomUUID();
                    auditLogsToInsert.push({
                        id: auditId,
                        entity_type: 'usuario',
                        entity_id: existingId,
                        action: 'UPDATE',
                        performed_by: user.id,
                        changes: { status: { old: false, new: true } }
                    });
                    auditDetailsToInsert.push({
                        audit_log_id: auditId,
                        field_name: 'status',
                        old_value: 'false',
                        new_value: 'true'
                    });
                }
                continue;
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
                    deleted_at: null
                }
                
                if (row['TELEFONE'] !== undefined) updatePayload.phone = String(row['TELEFONE']).trim() || null;
                if (row['ENDERECO'] !== undefined) updatePayload.address = String(row['ENDERECO']).trim() || null;
                if (row['OBSERVACOES'] !== undefined) updatePayload.observations = String(row['OBSERVACOES']).trim() || null;

                const { error: updateError } = await supabaseAdmin.from('cadastro_usuarios').update(updatePayload).eq('id', existingId);

                if (updateError) {
                    addError(rowNum, `Erro ao atualizar usuário pela planilha: ${updateError.message}`, row);
                } else {
                    inserted++;
                    const auditId = crypto.randomUUID();
                    const changes: any = {};
                    Object.keys(updatePayload).forEach(k => {
                        changes[k] = { new: updatePayload[k] }
                    });
                    auditLogsToInsert.push({
                        id: auditId,
                        entity_type: 'usuario',
                        entity_id: existingId,
                        action: 'UPDATE',
                        performed_by: user.id,
                        changes
                    });
                    Object.entries(changes).forEach(([field, { new: newVal }]: [string, any]) => {
                        auditDetailsToInsert.push({
                            audit_log_id: auditId,
                            field_name: field,
                            new_value: newVal !== null ? String(newVal) : null
                        });
                    });
                }
                continue;
            }
        }

        // Validate duplicates for completely new inserts
        const { data: existingUserId } = await supabaseAdmin.rpc('get_auth_user_by_email', { p_email: email })
        if (existingUserId) {
          addError(rowNum, `E-mail "${email}" já está em uso no sistema.`, row)
          continue
        }

        if (cpf) {
          const { data: existingUserCpf } = await supabaseAdmin.from('cadastro_usuarios').select('id').eq('cpf', cpf).is('deleted_at', null).maybeSingle()
          if (existingUserCpf) {
            addError(rowNum, `CPF "${cpf}" já está em uso por outro usuário ativo.`, row)
            continue
          }
        }

        const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.generateLink({
          type: 'invite',
          email: email,
          options: { redirectTo },
          data: {
            name: String(nome),
            role: roleToInsert,
            cpf: cpf || null,
            phone: String(row['TELEFONE'] || '') || null,
            department_id: depId || null,
            admin_id: user.id
          }
        })

        if (inviteError) {
          addError(rowNum, `Erro ao convidar: ${inviteError.message}`, row)
          continue
        }

        if (inviteData.user) {
          let profile = null;
          for (let retries = 0; retries < 3; retries++) {
            const { data } = await supabaseAdmin.from('cadastro_usuarios').select('id').eq('user_id', inviteData.user.id).maybeSingle()
            if (data) {
              profile = data;
              break;
            }
            await new Promise(r => setTimeout(r, 500));
          }

          if (profile) {
             await supabaseAdmin.from('cadastro_usuarios').update({
               address: String(row['ENDERECO'] || '') || null,
               observations: String(row['OBSERVACOES'] || '') || null,
             }).eq('id', profile.id)

             const auditId = crypto.randomUUID();
             const changes = {
                 name: { new: String(nome) },
                 email: { new: email },
                 role: { new: roleToInsert },
                 cpf: { new: cpf || null },
                 department_id: { new: depId || null },
             };
             auditLogsToInsert.push({
                 id: auditId,
                 entity_type: 'usuario',
                 entity_id: profile.id,
                 action: 'CREATE',
                 performed_by: user.id,
                 changes
             });
             Object.entries(changes).forEach(([field, { new: newVal }]: [string, any]) => {
                 auditDetailsToInsert.push({
                     audit_log_id: auditId,
                     field_name: field,
                     new_value: newVal !== null ? String(newVal) : null
                 });
             });
          } else {
             console.error("Profile not found after retries for user:", inviteData.user.id);
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
                'Authorization': `Bearer ${resendApiKey}`
              },
              body: JSON.stringify({
                from: 'Gestão de Contas <onboarding@resend.dev>',
                to: [email],
                subject: subject,
                html: htmlBody
              })
            }).catch(e => console.error('Erro ao enviar email', e))
          }
        }
        inserted++
      }
      
      if (auditLogsToInsert.length > 0) {
        const { error: logsError } = await supabaseAdmin.from('audit_logs').insert(auditLogsToInsert);
        if (logsError) console.error("Error inserting audit logs:", logsError);
        
        if (auditDetailsToInsert.length > 0) {
           for (let i = 0; i < auditDetailsToInsert.length; i += 1000) {
               const { error: detailsError } = await supabaseAdmin.from('audit_details').insert(auditDetailsToInsert.slice(i, i + 1000));
               if (detailsError) console.error("Error inserting audit details:", detailsError);
           }
        }
      }
    } else if (type === 'BANK_ACCOUNTS') {
      for (let i = 0; i < records.length; i++) {
        const row = records[i]
        const rowNum = i + 1

        const empresa = row['EMPRESA']
        const contaContabil = row['CONTA_CONTABIL'] || row['CONTA CONTABIL']

        if (!allowIncomplete && (!empresa || String(empresa).trim() === '')) {
          addError(rowNum, 'A coluna Empresa está vazia.', row)
          continue
        }

        if (!allowIncomplete && (!contaContabil || String(contaContabil).trim() === '')) {
          addError(rowNum, 'A coluna Conta Contábil está vazia.', row)
          continue
        }

        const orgId = empresa ? orgMap.get(String(empresa).trim().toLowerCase()) : null
        if (!orgId) {
          addError(rowNum, `A empresa "${empresa}" não foi encontrada na sua conta. (Obrigatório)`, row)
          continue
        }

        const accountNumber = String(row['NROCONTA'] || row['NUMERO DA CONTA'] || '')
        const checkDigit = String(row['DIGITOCONTA'] || row['DIGITO'] || '')

        const { data: existing, error: checkError } = await supabase
          .from('bank_accounts')
          .select('id')
          .eq('organization_id', orgId || '')
          .eq('account_number', accountNumber)
          .eq('check_digit', checkDigit)
          .is('deleted_at', null)
          .limit(1)
          .maybeSingle()

        if (checkError && orgId) {
          addError(rowNum, `Falha ao verificar duplicata - ${checkError.message}`, row)
          continue
        }

        if (existing) {
          addError(rowNum, `A Conta Bancária com número "${accountNumber}" e dígito "${checkDigit}" já está cadastrada para esta empresa.`, row)
          continue
        }

        const { error: insertError } = await supabase
          .from('bank_accounts')
          .insert({
            organization_id: orgId,
            account_code: String(contaContabil || ''),
            account_type: String(row['CODCAIXA'] || row['TIPO DE CONTA'] || ''),
            description: String(row['DESCRICAO'] || ''),
            bank_code: String(row['NUMBANCO'] || row['BANCO'] || ''),
            agency: String(row['NUMAGENCIA'] || row['AGENCIA'] || ''),
            account_number: accountNumber,
            classification: String(row['CLASSIFICACAO'] || ''),
            check_digit: checkDigit,
            company_name: String(empresa || '')
          })

        if (insertError) {
          addError(rowNum, `Erro ao inserir no banco - ${insertError.message}`, row)
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
        const code = row['COD'] || row['CODIGO']
        const description = row['DESCRICAO']

        if (!allowIncomplete && (!empresa || String(empresa).trim() === '')) {
          addError(rowNum, 'A coluna Empresa está vazia.', row)
          continue
        }

        if (!allowIncomplete && (!code || String(code).trim() === '')) {
          addError(rowNum, 'A coluna Código está vazia.', row)
          continue
        }

        if (!allowIncomplete && (!description || String(description).trim() === '')) {
          addError(rowNum, 'A coluna Descrição está vazia.', row)
          continue
        }

        const orgId = empresa ? orgMap.get(String(empresa).trim().toLowerCase()) : null
        if (!orgId) {
          addError(rowNum, `A empresa "${empresa}" não foi encontrada na sua conta. (Obrigatório)`, row)
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
            addError(rowNum, `Centro de custo pai "${parentCode}" não encontrado para hierarquia.`, row)
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
        const strTipoTga = String(row['TIPO_TGA'] || '').trim()
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

        const { error: insertError } = await supabase
          .from('cost_centers')
          .insert({
            organization_id: orgId,
            code: strCode,
            description: String(description || ''),
            parent_id: parentId || null,
            type_tga: String(row['TIPO'] || row['TIPO TGA'] || ''),
            tipo_tga_id: tipoTgaId,
            fixed_variable: String(row['FIXO_OU_VARIAVEL'] || row['FIXO OU VARIAVEL'] || ''),
            classification: String(row['CLASSIFICACAO'] || ''),
            operational: String(row['OPERACIONAL'] || ''),
            tipo_lcto: String(row['TIPO_LCTO'] || row['TIPO LCTO'] || ''),
            contabiliza: String(row['CONTABILIZA'] || ''),
            observacoes: String(row['OBSERVACOES'] || '')
          } as any)

        if (insertError) {
          addError(rowNum, `Erro ao inserir no banco - ${insertError.message}`, row)
        } else {
          inserted++
        }
      }
    } else if (type === 'CHART_ACCOUNTS') {
      for (let i = 0; i < records.length; i++) {
        const row = records[i]
        const rowNum = i + 1

        const empresa = row['EMPRESA']
        const code = row['CODIGO_CONTA'] || row['CODIGO DA CONTA']
        const name = row['NOME_CONTA'] || row['NOME DA CONTA']
        const accountType = row['TIPO_CONTA'] || row['TIPO DE CONTA']

        if (!allowIncomplete && (!empresa || String(empresa).trim() === '')) {
          addError(rowNum, 'A coluna Empresa está vazia.', row)
          continue
        }

        if (!allowIncomplete && (!code || String(code).trim() === '')) {
          addError(rowNum, 'A coluna Código da Conta está vazia.', row)
          continue
        }

        if (!allowIncomplete && (!name || String(name).trim() === '')) {
          addError(rowNum, 'A coluna Nome da Conta está vazia.', row)
          continue
        }

        const orgId = empresa ? orgMap.get(String(empresa).trim().toLowerCase()) : null
        if (!orgId) {
          addError(rowNum, `A empresa "${empresa}" não foi encontrada na sua conta. (Obrigatório)`, row)
          continue
        }

        const strCode = String(code || '').trim()

        const { data: existing, error: checkError } = await supabase
          .from('chart_of_accounts')
          .select('id')
          .eq('organization_id', orgId || '')
          .eq('account_code', strCode)
          .is('deleted_at', null)
          .maybeSingle()

        if (checkError && orgId) {
          addError(rowNum, `Falha ao verificar duplicata - ${checkError.message}`, row)
          continue
        }

        if (existing) {
          addError(rowNum, `O código de conta "${strCode}" já está cadastrado para esta empresa.`, row)
          continue
        }

        const { error: insertError } = await supabase
          .from('chart_of_accounts')
          .insert({
            organization_id: orgId,
            account_code: strCode,
            account_name: String(name || ''),
            account_type: String(accountType || '')
          })

        if (insertError) {
          addError(rowNum, `Erro ao inserir no banco - ${insertError.message}`, row)
        } else {
          inserted++
        }
      }
    } else if (type === 'MAPPINGS') {
      for (let i = 0; i < records.length; i++) {
        const row = records[i]
        const rowNum = i + 1

        const empresa = row['EMPRESA']
        const centroCusto = row['CENTRO_CUSTO'] || row['CENTRO DE CUSTO']
        const contaContabil = row['CONTA_CONTABIL'] || row['CONTA CONTABIL']
        const tipoMapeamento = row['TIPO_MAPEAMENTO'] || row['TIPO DE MAPEAMENTO']

        if (!allowIncomplete && (!empresa || String(empresa).trim() === '')) {
          addError(rowNum, 'A coluna Empresa está vazia.', row)
          continue
        }

        if (!allowIncomplete && (!centroCusto || String(centroCusto).trim() === '')) {
          addError(rowNum, 'A coluna Centro de Custo está vazia.', row)
          continue
        }

        if (!allowIncomplete && (!contaContabil || String(contaContabil).trim() === '')) {
          addError(rowNum, 'A coluna Conta Contábil está vazia.', row)
          continue
        }

        const orgId = empresa ? orgMap.get(String(empresa).trim().toLowerCase()) : null
        if (!orgId) {
          addError(rowNum, `A empresa "${empresa}" não foi encontrada na sua conta. (Obrigatório)`, row)
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
            addError(rowNum, `O mapeamento entre "${strCentroCusto}" e "${strContaContabil}" já existe.`, row)
            continue
          }
        }

        const { error: insertError } = await supabase
          .from('account_mapping')
          .insert({
            organization_id: orgId,
            cost_center_id: ccData?.id || null,
            chart_account_id: caData?.id || null,
            mapping_type: String(tipoMapeamento || 'DE/PARA')
          })

        if (insertError) {
          addError(rowNum, `Erro ao inserir no banco - ${insertError.message}`, row)
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
        const centroCusto = row['CENTRO_CUSTO'] || row['CENTRO DE CUSTO']
        const contaDebito = row['CONTA_DEBITO'] || row['CONTA DEBITO']
        const contaCredito = row['CONTA_CREDITO'] || row['CONTA CREDITO']

        if (!allowIncomplete && (!empresa || String(empresa).trim() === '')) {
          addError(rowNum, 'A coluna Empresa está vazia.', row)
          continue
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

        const orgId = empresa ? orgMap.get(String(empresa).trim().toLowerCase()) : null
        if (!orgId) {
          addError(rowNum, `A empresa "${empresa}" não foi encontrada na sua conta. (Obrigatório)`, row)
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
            status: 'Concluído'
          })
          .select()
          .single()

        if (insertError) {
          addError(rowNum, `Erro ao inserir movimento financeiro - ${insertError.message}`, row)
          continue
        }

        const { error: aeError } = await supabase
          .from('accounting_entries')
          .insert({
            organization_id: orgId,
            entry_date: formattedDate,
            amount: isNaN(valor) ? 0 : valor,
            description: String(descricao || ''),
            debit_account_id: debitData?.id || null,
            credit_account_id: creditData?.id || null,
            status: 'Concluído'
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
      status: 'Completed'
    })

    return new Response(JSON.stringify({ inserted, rejected, errors }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
