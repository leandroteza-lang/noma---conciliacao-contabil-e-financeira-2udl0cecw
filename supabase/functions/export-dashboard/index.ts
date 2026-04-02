import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
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

    const { format, bankData, costCenterData, cashFlowData } = await req.json()

    if (format === 'excel') {
      let csv = 'Relatorio de Dashboard\n\nSaldo por Conta Bancaria\nConta,Saldo\n'
      bankData.forEach((r: any) => (csv += `"${r.name}",${r.value}\n`))
      csv += '\nLancamentos por Centro de Custo\nCentro de Custo,Valor\n'
      costCenterData.forEach((r: any) => (csv += `"${r.name}",${r.value}\n`))
      csv += '\nFluxo de Caixa Mensal\nMes,Valor\n'
      cashFlowData.forEach((r: any) => (csv += `"${r.month}",${r.value}\n`))

      return new Response(JSON.stringify({ csv }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (format === 'pdf') {
      const doc = new jsPDF()
      doc.setFontSize(16)
      doc.text('Relatorio de Dashboard', 14, 20)

      doc.setFontSize(12)
      let y = 35
      doc.text('Saldo por Conta Bancaria:', 14, y)
      y += 10
      bankData.forEach((r: any) => {
        doc.text(`${r.name}: R$ ${r.value.toFixed(2)}`, 14, y)
        y += 8
      })

      y += 5
      doc.text('Lancamentos por Centro de Custo:', 14, y)
      y += 10
      costCenterData.forEach((r: any) => {
        doc.text(`${r.name}: R$ ${r.value.toFixed(2)}`, 14, y)
        y += 8
      })

      y += 5
      doc.text('Fluxo de Caixa Mensal:', 14, y)
      y += 10
      cashFlowData.forEach((r: any) => {
        doc.text(`${r.month}: R$ ${r.value.toFixed(2)}`, 14, y)
        y += 8
      })

      const pdf = doc.output('datauristring')
      return new Response(JSON.stringify({ pdf }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    throw new Error('Formato inválido. Use "excel" ou "pdf".')
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
