import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import OpenAI from 'npm:openai@4'

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

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) throw new Error('Usuário não autenticado')

    const { messages } = await req.json()

    if (!messages || !Array.isArray(messages)) {
      throw new Error('Formato de mensagens inválido')
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
            'Obtém os lançamentos e movimentações financeiras recentes, útil para procurar divergências ou analisar conciliações',
          parameters: {
            type: 'object',
            properties: {
              limit: {
                type: 'number',
                description: 'Número de registros para retornar (padrão 10)',
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
          description: 'Obtém os lançamentos contábeis recentes',
          parameters: {
            type: 'object',
            properties: {
              limit: {
                type: 'number',
                description: 'Número de registros para retornar (padrão 15)',
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
    ]

    const { data: orgsData } = await supabase
      .from('organizations')
      .select('id, name')
      .is('deleted_at', null)
    const orgIds = orgsData?.map((o) => o.id) || []

    const runTool = async (name: string, args: any) => {
      try {
        if (name === 'get_organizations') {
          return JSON.stringify(orgsData || [])
        }
        if (name === 'get_bank_accounts') {
          const { data } = await supabase
            .from('bank_accounts')
            .select('company_name, account_code, description, bank_code, agency, account_number')
            .in('organization_id', orgIds)
            .is('deleted_at', null)
          return JSON.stringify(data || [])
        }
        if (name === 'get_cost_centers') {
          const { data } = await supabase
            .from('cost_centers')
            .select('code, description, classification, type_tga')
            .in('organization_id', orgIds)
            .is('deleted_at', null)
          return JSON.stringify(data || [])
        }
        if (name === 'get_financial_movements') {
          const limit = args.limit || 15
          const { data } = await supabase
            .from('financial_movements')
            .select('movement_date, description, amount, status')
            .in('organization_id', orgIds)
            .order('movement_date', { ascending: false })
            .limit(limit)
          return JSON.stringify(data || [])
        }
        if (name === 'get_users') {
          const { data } = await supabase
            .from('cadastro_usuarios')
            .select('name, email, role, status, department_id')
            .is('deleted_at', null)
          return JSON.stringify(data || [])
        }
        if (name === 'get_departments') {
          const { data } = await supabase
            .from('departments')
            .select('id, code, name')
            .is('deleted_at', null)
          return JSON.stringify(data || [])
        }
        if (name === 'get_chart_accounts') {
          const { data } = await supabase
            .from('chart_of_accounts')
            .select('account_code, account_name, account_type')
            .in('organization_id', orgIds)
            .is('deleted_at', null)
          return JSON.stringify(data || [])
        }
        if (name === 'get_accounting_entries') {
          const limit = args.limit || 15
          const { data } = await supabase
            .from('accounting_entries')
            .select('entry_date, description, amount, status, debit_account_id, credit_account_id')
            .in('organization_id', orgIds)
            .order('entry_date', { ascending: false })
            .limit(limit)
          return JSON.stringify(data || [])
        }
        if (name === 'get_account_mappings') {
          const { data } = await supabase
            .from('account_mapping')
            .select(
              'mapping_type, cost_centers(code, description), chart_of_accounts(account_code, account_name)',
            )
            .in('organization_id', orgIds)
          return JSON.stringify(data || [])
        }
        if (name === 'get_tga_account_types') {
          const { data } = await supabase
            .from('tipo_conta_tga')
            .select('codigo, nome, abreviacao')
            .in('organization_id', orgIds)
            .is('deleted_at', null)
          return JSON.stringify(data || [])
        }
        return 'Função não encontrada'
      } catch (e: any) {
        return `Erro ao executar função: ${e.message}`
      }
    }

    const systemPrompt = {
      role: 'system',
      content: `Você é um assistente virtual especializado em inteligência contábil e financeira, desenvolvido para a Molas Noma.
Sua missão é ajudar os usuários na extração de dados gerenciais, conciliação, análise de divergências entre o ERP e a gestão financeira, além de fornecer informações sobre toda a estrutura organizacional (empresas, departamentos, usuários/funcionários, plano de contas, mapeamentos, etc).
Comunique-se em português de forma profissional, direta e com um tom industrial e corporativo.
Sempre utilize as funções (tools) disponíveis para buscar informações reais no banco de dados e fundamentar suas respostas. Não invente dados. Cruce os dados se necessário para fornecer respostas completas (ex: se perguntarem os usuários e seus departamentos, use get_users e get_departments e faça o vínculo).
MUITO IMPORTANTE: Quando for apresentar dados de registros (como usuários, empresas, lançamentos, etc), NUNCA apresente os campos em texto corrido. Você DEVE exibir CADA CAMPO EM UMA LINHA SEPARADA utilizando listas (bullets), para facilitar a leitura técnica. Utilize quebras de linha (\\n) consistentemente.
Exemplo:
- **Nome:** João Silva
- **Email:** joao@exemplo.com
Se não houver informações disponíveis no retorno das funções, informe que os dados não foram encontrados nas tabelas correspondentes.`,
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
