import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import OpenAI from 'npm:openai@4'
import pdfParse from 'npm:pdf-parse@1.1.1'
import { Buffer } from 'node:buffer'

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
    const openaiKey = Deno.env.get('OPENAI_API_KEY')

    if (!supabaseUrl || !supabaseKey || !openaiKey) {
      throw new Error(
        'Variáveis de ambiente ausentes. Certifique-se de adicionar OPENAI_API_KEY aos Secrets do Supabase.',
      )
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

    const { data: userProfile } = await supabase
      .from('cadastro_usuarios')
      .select('role, permissions, status')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .maybeSingle()

    if (!userProfile || !userProfile.status) {
      throw new Error('Usuário inativo ou não encontrado no sistema')
    }

    const hasPerm = (perms: string[]) => {
      if (userProfile.role === 'admin') return true
      const userPerms = Array.isArray(userProfile.permissions) ? userProfile.permissions : []
      if (userPerms.includes('all')) return true
      return perms.some((p) => userPerms.includes(p))
    }

    const { messages, file } = await req.json()

    if (!messages || !Array.isArray(messages)) {
      throw new Error('Formato de mensagens inválido')
    }

    if (file) {
      let fileText = ''
      if (file.type === 'pdf') {
        try {
          const pdfData = await pdfParse(Buffer.from(file.content, 'base64'))
          fileText = pdfData.text
        } catch (e: any) {
          console.error('Error parsing PDF', e)
          fileText = 'Erro ao extrair texto do PDF: ' + e.message
        }
      } else {
        fileText = file.content
      }

      const lastMessage = messages[messages.length - 1]
      if (lastMessage && lastMessage.role === 'user') {
        lastMessage.content += `\n\n--- INÍCIO DO CONTEÚDO DO ARQUIVO ANEXADO (${file.name}) ---\n${fileText}\n--- FIM DO CONTEÚDO DO ARQUIVO ---`
      }
    }

    const openai = new OpenAI({ apiKey: openaiKey })

    const tools = [
      {
        type: 'function',
        function: {
          name: 'get_bank_accounts',
          description:
            'Obtém a lista de contas bancárias da empresa e seus códigos contábeis associados',
          parameters: { type: 'object', properties: {} },
        },
      },
      {
        type: 'function',
        function: {
          name: 'get_cost_centers',
          description: 'Obtém a lista de centros de custo cadastrados e suas classificações',
          parameters: { type: 'object', properties: {} },
        },
      },
      {
        type: 'function',
        function: {
          name: 'get_financial_movements',
          description:
            'Obtém as movimentações financeiras criadas no sistema para conciliação (tabela financial_movements)',
          parameters: {
            type: 'object',
            properties: {
              limit: {
                type: 'number',
                description: 'Número de registros para retornar. Sempre use 100000 se quiser calcular totais.',
              },
            },
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'get_organizations',
          description: 'Obtém as empresas/organizações vinculadas ao usuário atual',
          parameters: { type: 'object', properties: {} },
        },
      },
      {
        type: 'function',
        function: {
          name: 'get_users',
          description: 'Obtém a lista de usuários/funcionários cadastrados no sistema',
          parameters: { type: 'object', properties: {} },
        },
      },
      {
        type: 'function',
        function: {
          name: 'get_departments',
          description: 'Obtém a lista de departamentos da empresa',
          parameters: { type: 'object', properties: {} },
        },
      },
      {
        type: 'function',
        function: {
          name: 'get_chart_accounts',
          description: 'Obtém o plano de contas contábil (contas contábeis)',
          parameters: { type: 'object', properties: {} },
        },
      },
      {
        type: 'function',
        function: {
          name: 'get_accounting_entries',
          description: 'Obtém os lançamentos contábeis recentes (tabela accounting_entries)',
          parameters: {
            type: 'object',
            properties: {
              limit: {
                type: 'number',
                description: 'Número de registros para retornar. Sempre use 100000 para totais.',
              },
            },
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'get_account_mappings',
          description: 'Obtém o mapeamento (De/Para) entre centros de custo e contas contábeis',
          parameters: { type: 'object', properties: {} },
        },
      },
      {
        type: 'function',
        function: {
          name: 'get_tga_account_types',
          description: 'Obtém os tipos de conta TGA configurados',
          parameters: { type: 'object', properties: {} },
        },
      },
      {
        type: 'function',
        function: {
          name: 'get_erp_financial_movements',
          description:
            'Obtém os lançamentos do Movimento Financeiro TGA / ERP (tabela erp_financial_movements). Esta função busca por fornecedor/cliente, período (datas), faixa de valores ou centro de custo e JÁ RETORNA O VALOR TOTAL SOMADO.',
          parameters: {
            type: 'object',
            properties: {
              start_date: {
                type: 'string',
                description: 'Data de emissão inicial no formato YYYY-MM-DD',
              },
              end_date: {
                type: 'string',
                description: 'Data de emissão final no formato YYYY-MM-DD',
              },
              supplier_name: {
                type: 'string',
                description: 'Nome do cliente ou fornecedor (busca parcial)',
              },
              min_amount: {
                type: 'number',
                description: 'Valor mínimo do lançamento',
              },
              max_amount: {
                type: 'number',
                description: 'Valor máximo do lançamento',
              },
              cost_center: {
                type: 'string',
                description: 'Código ou descrição do centro de custo',
              },
              search_term: {
                type: 'string',
                description: 'Varredura Full-Text. Termo genérico para busca em todos os campos de texto (histórico, descrição, fornecedor, documento). Use este campo para buscar qualquer texto mencionado na pergunta (ex: "vendas a vista").',
              },
              limit: {
                type: 'number',
                description: 'Número máximo de registros para retornar. Sempre envie 100000 para garantir que a soma inclua tudo.',
              },
            },
          },
        },
      },
    ]

    const { data: orgsData } = await supabase
      .from('organizations')
      .select('id, name')
      .is('deleted_at', null)
    const orgIds = orgsData?.map((o) => o.id) || []

    const runTool = async (name: string, args: any) => {
      try {
        if (name === 'get_organizations') {
          if (!hasPerm(['view_companies', 'view_organizations']))
            return 'Acesso negado: Você não tem permissão para visualizar empresas.'
          if (orgIds.length === 0) return JSON.stringify([])
          const { data } = await supabase
            .from('organizations')
            .select('name, cnpj, cpf, email, phone, status')
            .in('id', orgIds)
            .is('deleted_at', null)
          return JSON.stringify(data || [])
        }
        if (name === 'get_bank_accounts') {
          if (!hasPerm(['view_bank_accounts', 'view_accounts']))
            return 'Acesso negado: Você não tem permissão para visualizar contas bancárias.'
          if (orgIds.length === 0) return JSON.stringify([])
          const { data } = await supabase
            .from('bank_accounts')
            .select(
              'company_name, account_code, description, bank_code, agency, account_number, classification',
            )
            .in('organization_id', orgIds)
            .is('deleted_at', null)
          return JSON.stringify(data || [])
        }
        if (name === 'get_cost_centers') {
          if (!hasPerm(['view_cost_centers']))
            return 'Acesso negado: Você não tem permissão para visualizar centros de custo.'
          if (orgIds.length === 0) return JSON.stringify([])
          const { data } = await supabase
            .from('cost_centers')
            .select('code, description, classification, type_tga, fixed_variable, operational')
            .in('organization_id', orgIds)
            .is('deleted_at', null)
          return JSON.stringify(data || [])
        }
        if (name === 'get_financial_movements') {
          if (!hasPerm(['view_entries', 'view_financial_movements']))
            return 'Acesso negado: Você não tem permissão para visualizar movimentações financeiras.'
          if (orgIds.length === 0) return JSON.stringify({ erro: 'Nenhuma empresa.' })
          const limit = Math.min(args.limit || 100000, 100000)
          const { data, error } = await supabase
            .from('financial_movements')
            .select(
              'movement_date, description, amount, status, cost_centers(code, description), bank_accounts(description)',
            )
            .in('organization_id', orgIds)
            .order('movement_date', { ascending: false })
            .limit(limit)
          if (error) return JSON.stringify({ erro: error.message })

          let totalValor = 0
          let totalValorAbsoluto = 0
          const formattedData = data?.map((d: any) => {
            const val = Number(d.amount || 0)
            totalValor += val
            totalValorAbsoluto += Math.abs(val)
            let md = d.movement_date
            if (md) {
              const cleanDate = md.split('T')[0]
              const p = cleanDate.split('-')
              if (p.length === 3) md = `${p[2]}/${p[1]}/${p[0]}`
            }
            return { ...d, movement_date: md }
          }) || []

          const totalRegistros = formattedData.length
          let finalData = formattedData
          let truncated = false
          if (finalData.length > 150) {
            finalData = finalData.slice(0, 150)
            truncated = true
          }

          return JSON.stringify({
            registros_encontrados: totalRegistros,
            total_valor: totalValor,
            nota: truncated ? 'A lista foi truncada para 150 itens, mas os totais acima consideram todos os registros.' : '',
            registros: finalData
          })
        }
        if (name === 'get_users') {
          if (!hasPerm(['view_users', 'view_employees']))
            return 'Acesso negado: Você não tem permissão para visualizar usuários.'
          const { data } = await supabase
            .from('cadastro_usuarios')
            .select('name, email, role, status, phone, cpf, departments(name)')
            .is('deleted_at', null)
          return JSON.stringify(data || [])
        }
        if (name === 'get_departments') {
          if (!hasPerm(['view_departments']))
            return 'Acesso negado: Você não tem permissão para visualizar departamentos.'
          const { data } = await supabase
            .from('departments')
            .select('code, name, created_at')
            .is('deleted_at', null)
          return JSON.stringify(data || [])
        }
        if (name === 'get_chart_accounts') {
          if (!hasPerm(['view_chart_accounts', 'view_chart_of_accounts']))
            return 'Acesso negado: Você não tem permissão para visualizar o plano de contas.'
          if (orgIds.length === 0) return JSON.stringify([])
          const { data } = await supabase
            .from('chart_of_accounts')
            .select('account_code, account_name, account_type')
            .in('organization_id', orgIds)
            .is('deleted_at', null)
          return JSON.stringify(data || [])
        }
        if (name === 'get_accounting_entries') {
          if (!hasPerm(['view_entries', 'view_accounting_entries']))
            return 'Acesso negado: Você não tem permissão para visualizar lançamentos contábeis.'
          if (orgIds.length === 0) return JSON.stringify({ erro: 'Nenhuma empresa.' })
          const limit = Math.min(args.limit || 100000, 100000)
          const { data, error } = await supabase
            .from('accounting_entries')
            .select(
              'entry_date, description, amount, status, debit_account:chart_of_accounts!accounting_entries_debit_account_id_fkey(account_name), credit_account:chart_of_accounts!accounting_entries_credit_account_id_fkey(account_name)',
            )
            .in('organization_id', orgIds)
            .order('entry_date', { ascending: false })
            .limit(limit)
          if (error) return JSON.stringify({ erro: error.message })

          let totalValor = 0
          let totalValorAbsoluto = 0
          const formattedData = data?.map((d: any) => {
            const val = Number(d.amount || 0)
            totalValor += val
            totalValorAbsoluto += Math.abs(val)
            let ed = d.entry_date
            if (ed) {
              const cleanDate = ed.split('T')[0]
              const p = cleanDate.split('-')
              if (p.length === 3) ed = `${p[2]}/${p[1]}/${p[0]}`
            }
            return { ...d, entry_date: ed }
          }) || []

          const totalRegistros = formattedData.length
          let finalData = formattedData
          let truncated = false
          if (finalData.length > 150) {
            finalData = finalData.slice(0, 150)
            truncated = true
          }

          return JSON.stringify({
            registros_encontrados: totalRegistros,
            total_valor: totalValor,
            nota: truncated ? 'A lista foi truncada para 150 itens, mas os totais acima consideram todos os registros.' : '',
            registros: finalData
          })
        }
        if (name === 'get_account_mappings') {
          if (!hasPerm(['view_mappings', 'view_account_mappings']))
            return 'Acesso negado: Você não tem permissão para visualizar mapeamentos.'
          if (orgIds.length === 0) return JSON.stringify([])
          const { data } = await supabase
            .from('account_mapping')
            .select(
              'mapping_type, cost_centers(code, description), chart_of_accounts(account_code, account_name)',
            )
            .in('organization_id', orgIds)
          return JSON.stringify(data || [])
        }
        if (name === 'get_tga_account_types') {
          if (!hasPerm(['view_tga_accounts', 'view_tga']))
            return 'Acesso negado: Você não tem permissão para visualizar tipos de conta TGA.'
          if (orgIds.length === 0) return JSON.stringify([])
          const { data } = await supabase
            .from('tipo_conta_tga')
            .select('codigo, nome, abreviacao')
            .in('organization_id', orgIds)
            .is('deleted_at', null)
          return JSON.stringify(data || [])
        }
        if (name === 'get_erp_financial_movements') {
          if (!hasPerm(['view_entries', 'view_financial_movements']))
            return 'Acesso negado: Você não tem permissão para visualizar movimentações do TGA.'
          if (orgIds.length === 0) return JSON.stringify({ erro: 'Nenhuma empresa associada.' })
          
          const limit = Math.min(args.limit || 100000, 100000)
          let query = supabase
            .from('erp_financial_movements')
            .select('data_emissao, dt_compens, c_custo, descricao_c_custo, valor, valor_liquido, nome_cli_fornec, historico, n_documento, status')
            .in('organization_id', orgIds)
            .is('deleted_at', null)

          if (args.start_date) query = query.gte('data_emissao', args.start_date)
          if (args.end_date) query = query.lte('data_emissao', args.end_date)
          if (args.min_amount) query = query.gte('valor', args.min_amount)
          if (args.max_amount) query = query.lte('valor', args.max_amount)
          
          if (args.supplier_name) {
            const cleanW = args.supplier_name.trim().replace(/\s+/g, '%').replace(/[aeiouáàãâäéèêëíìîïóòõôöúùûücç]/gi, '_')
            query = query.or(`nome_cli_fornec.ilike.%${cleanW}%,historico.ilike.%${cleanW}%`)
          }
          
          if (args.cost_center) {
            const cleanW = args.cost_center.trim().replace(/\s+/g, '%').replace(/[aeiouáàãâäéèêëíìîïóòõôöúùûücç]/gi, '_')
            query = query.or(`c_custo.ilike.%${cleanW}%,descricao_c_custo.ilike.%${cleanW}%,historico.ilike.%${cleanW}%`)
          }
          
          if (args.search_term) {
            const cleanW = args.search_term.trim().replace(/\s+/g, '%').replace(/[aeiouáàãâäéèêëíìîïóòõôöúùûücç]/gi, '_')
            query = query.or(`c_custo.ilike.%${cleanW}%,descricao_c_custo.ilike.%${cleanW}%,nome_cli_fornec.ilike.%${cleanW}%,historico.ilike.%${cleanW}%,n_documento.ilike.%${cleanW}%`)
          }

          const { data, error } = await query.order('data_emissao', { ascending: false }).limit(limit)
          if (error) return JSON.stringify({ erro: error.message })

          let totalValor = 0
          let totalValorLiquido = 0
          let totalValorAbsoluto = 0
          let totalValorLiquidoAbsoluto = 0
          let totalEntradasLiquido = 0
          let totalSaidasLiquido = 0

          const formattedData = data?.map((d: any) => {
            const val = Number(d.valor || 0)
            const valLiq = Number(d.valor_liquido || 0)
            totalValor += val
            totalValorLiquido += valLiq
            totalValorAbsoluto += Math.abs(val)
            totalValorLiquidoAbsoluto += Math.abs(valLiq)
            
            if (valLiq > 0) totalEntradasLiquido += valLiq
            else totalSaidasLiquido += Math.abs(valLiq)

            let dataEmissaoStr = d.data_emissao
            if (dataEmissaoStr) {
              const cleanDate = dataEmissaoStr.split('T')[0]
              const parts = cleanDate.split('-')
              if (parts.length === 3) dataEmissaoStr = `${parts[2]}/${parts[1]}/${parts[0]}`
            }
            let dtCompensStr = d.dt_compens
            if (dtCompensStr) {
              const cleanDate = dtCompensStr.split('T')[0]
              const parts = cleanDate.split('-')
              if (parts.length === 3) dtCompensStr = `${parts[2]}/${parts[1]}/${parts[0]}`
            }
            return {
              ...d,
              data_emissao: dataEmissaoStr,
              dt_compens: dtCompensStr
            }
          }) || []

          const totalRegistros = formattedData.length
          let finalData = formattedData
          let truncated = false
          if (finalData.length > 150) {
            finalData = finalData.slice(0, 150)
            truncated = true
          }

          return JSON.stringify({
            registros_encontrados: totalRegistros,
            total_valor: totalValor,
            total_valor_liquido: totalValorLiquido,
            total_entradas_liquido: totalEntradasLiquido,
            total_saidas_liquido: totalSaidasLiquido,
            total_valor_absoluto: totalValorAbsoluto,
            total_valor_liquido_absoluto: totalValorLiquidoAbsoluto,
            nota: truncated ? 'A lista de registros foi truncada para 150 itens devido ao limite de exibição, mas os totais acima consideram todos os registros encontrados na busca.' : 'Todos os registros listados.',
            registros: finalData
          })
        }
        return 'Função não encontrada'
      } catch (e: any) {
        return `Erro ao executar função: ${e.message}`
      }
    }

    const systemPrompt = {
      role: 'system',
      content: `Você é um assistente virtual especializado em inteligência contábil e financeira, desenvolvido para a Molas Noma.
Sua missão é ajudar os usuários na extração de dados gerenciais, conciliação, análise de divergências entre o ERP e a gestão financeira, além de fornecer informações sobre toda a estrutura organizacional.
Comunique-se em português de forma profissional, direta e com um tom industrial e corporativo.
Sempre utilize as funções (tools) disponíveis para buscar informações reais no banco de dados. Não invente dados.

MUITO IMPORTANTE - REGRAS DE BUSCA E SOMAS:
- Ao usar funções que retornam registros (como get_erp_financial_movements), elas agora retornam um JSON com os campos 'registros_encontrados', 'total_valor_liquido', 'total_entradas_liquido', 'total_saidas_liquido', etc. Use EXATAMENTE esses totais fornecidos pelo banco! NUNCA some manualmente.
- O campo 'total_valor_liquido' é o Saldo Final Real (Diferença entre entradas e saídas). É a "fonte da verdade" que o usuário vê na interface.
- O campo 'total_entradas_liquido' representa as Receitas/Entradas (+).
- O campo 'total_saidas_liquido' representa as Despesas/Saídas (-).
- Utilize SEMPRE o 'total_valor_liquido' como a resposta principal para valores monetários, detalhando as entradas e saídas se for relevante para o contexto.
- Se houver mais de 150 registros, a matriz 'registros' virá truncada, mas os totais representam 100% dos dados reais. Neste caso, avise o usuário que a tabela exibirá apenas os primeiros itens por razões de visualização, mas o total inclui todos os registros encontrados.
- Sempre defina o parâmetro 'limit' para 100000 para garantir que todos os dados sejam contabilizados.
- Para buscas por texto, utilize preferencialmente o parâmetro 'search_term' em vez de campos específicos, garantindo que o assistente faça a varredura Full-Text em TODOS os campos do banco (histórico, descrição, centro de custo, etc).

MUITO IMPORTANTE - ESTRUTURA DA RESPOSTA:
1. PRIMEIRO, você DEVE exibir os dados solicitados OBRIGATORIAMENTE em formato de TABELA MARKDOWN (Markdown Table). NUNCA apresente os dados em texto corrido ou listas (bullet points).
Exemplo exato de como você deve estruturar a resposta (comece diretamente com a tabela):
| Fornecedor | Valor | Data de Emissão |
|---|---|---|
| NOMA PARTS | R$ 1.500,00 | 12/03/2024 |

- Se for uma pergunta de TOTAIS, você DEVE inserir o valor calculado no banco na última linha ou fora da tabela explicando com clareza.
Se não houver informações, informe claramente que os dados não foram encontrados.
NUNCA crie links de paginação (como "Ver mais", "Próxima página", etc) na sua resposta. A interface do chat já possui paginação nativa que detecta tabelas grandes automaticamente.

2. APENAS DEPOIS de apresentar os dados completos, você DEVE OBRIGATORIAMENTE incluir no final da sua resposta um link direto para a página correspondente no sistema em formato Markdown.
Exemplos de rotas OBRIGATÓRIAS (NUNCA INVENTE OUTRAS ROTAS):
- Ao listar Empresas: [Acessar Gestão de Empresas](/empresas)
- Ao listar Departamentos: [Acessar Departamentos](/departamentos)
- Ao listar Contas Bancárias: [Acessar Listagem de Contas](/app)
- Ao listar Usuários: [Acessar Usuários](/usuarios)
- Ao listar Movimento Financeiro TGA ou ERP (erp_financial_movements): [Acessar Movimento Financeiro](/movimento-financeiro)
- Ao listar Lançamentos (accounting_entries): [Acessar Lançamentos](/lancamentos)
- Ao listar Centros de Custo: [Acessar Centros de Custo](/centros-de-custo)
- Ao listar Plano de Contas: [Acessar Plano de Contas](/plano-de-contas)

Sempre termine a sua resposta com o link sugerido em uma nova linha. Não pergunte se o usuário quer o link, apenas forneça-o automaticamente.

MUITO IMPORTANTE - FORMATO DE DATAS:
- Todas as datas já são retornadas pelo banco no formato brasileiro: DD/MM/AAAA. NUNCA exiba datas no formato AAAA-MM-DD. Mantenha exatamente o formato DD/MM/AAAA.`,
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [systemPrompt, ...messages],
      tools: tools as any,
      tool_choice: 'auto',
    })

    const responseMessage = response.choices[0].message

    if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
      messages.push(responseMessage)

      for (const toolCall of responseMessage.tool_calls) {
        const functionName = toolCall.function.name
        const functionArgs = JSON.parse(toolCall.function.arguments || '{}')
        const functionResponse = await runTool(functionName, functionArgs)
        messages.push({
          tool_call_id: toolCall.id,
          role: 'tool',
          name: functionName,
          content: functionResponse,
        })
      }

      const secondResponse = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [systemPrompt, ...messages],
      })

      return new Response(JSON.stringify({ reply: secondResponse.choices[0].message.content }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ reply: responseMessage.content }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
