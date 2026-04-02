import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { jsPDF } from 'npm:jspdf@2.5.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, x-supabase-client-platform, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Cabeçalho de autorização ausente')

    const { format, costCenterData, periodData, cashFlowData, revExpData } = await req.json()

    if (format === 'excel') {
      let csv =
        'Relatorio de Analises Gerenciais\n\nSaldo por Centro de Custo\nCentro de Custo,Saldo\n'
      costCenterData.forEach((r: any) => (csv += `"${r.name}",${r.value}\n`))

      csv += '\nMovimentacoes por Periodo\nData,Valor\n'
      periodData.forEach((r: any) => (csv += `"${r.date}",${r.value}\n`))

      csv += '\nFluxo de Caixa Mensal\nMes,Valor\n'
      cashFlowData.forEach((r: any) => (csv += `"${r.month}",${r.value}\n`))

      csv += '\nComparativo Receitas vs Despesas\nMes,Receita,Despesa\n'
      revExpData.forEach((r: any) => (csv += `"${r.month}",${r.receita},${r.despesa}\n`))

      return new Response(JSON.stringify({ csv }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (format === 'pdf') {
      const doc = new jsPDF()
      doc.setFontSize(16)
      doc.text('Relatorio de Analises Gerenciais', 14, 20)

      doc.setFontSize(12)
      let y = 35

      const checkPage = () => {
        if (y > 280) {
          doc.addPage()
          y = 20
        }
      }

      doc.text('Saldo por Centro de Custo:', 14, y)
      y += 10
      checkPage()
      costCenterData.forEach((r: any) => {
        doc.text(`${r.name}: R$ ${r.value.toFixed(2)}`, 14, y)
        y += 8
        checkPage()
      })

      y += 5
      checkPage()
      doc.text('Fluxo de Caixa Mensal:', 14, y)
      y += 10
      checkPage()
      cashFlowData.forEach((r: any) => {
        doc.text(`${r.month}: R$ ${r.value.toFixed(2)}`, 14, y)
        y += 8
        checkPage()
      })

      y += 5
      checkPage()
      doc.text('Receitas vs Despesas:', 14, y)
      y += 10
      checkPage()
      revExpData.forEach((r: any) => {
        doc.text(
          `${r.month} - Rec: R$ ${r.receita.toFixed(2)} | Desp: R$ ${r.despesa.toFixed(2)}`,
          14,
          y,
        )
        y += 8
        checkPage()
      })

      const pdf = doc.output('datauristring')
      return new Response(JSON.stringify({ pdf }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    throw new Error('Formato inválido.')
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
