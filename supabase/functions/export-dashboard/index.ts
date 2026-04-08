import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { jsPDF } from 'npm:jspdf@2.5.1'
import autoTable from 'npm:jspdf-autotable@3.8.2'

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
      doc.text('Relatório de Dashboard', 14, 20)

      let currentY = 30

      doc.setFontSize(12)
      doc.text('Saldo por Conta Bancária', 14, currentY)
      autoTable(doc, {
        startY: currentY + 5,
        head: [['Conta', 'Saldo (R$)']],
        body: bankData.map((r: any) => [r.name, r.value.toFixed(2)]),
        theme: 'grid',
        headStyles: { fillColor: [220, 38, 38] },
        margin: { bottom: 10 },
      })
      currentY = (doc as any).lastAutoTable.finalY + 15

      doc.text('Lançamentos por Centro de Custo', 14, currentY)
      autoTable(doc, {
        startY: currentY + 5,
        head: [['Centro de Custo', 'Valor (R$)']],
        body: costCenterData.map((r: any) => [r.name, r.value.toFixed(2)]),
        theme: 'grid',
        headStyles: { fillColor: [220, 38, 38] },
        margin: { bottom: 10 },
      })
      currentY = (doc as any).lastAutoTable.finalY + 15

      doc.text('Fluxo de Caixa Mensal', 14, currentY)
      autoTable(doc, {
        startY: currentY + 5,
        head: [['Mês', 'Valor (R$)']],
        body: cashFlowData.map((r: any) => [r.month, r.value.toFixed(2)]),
        theme: 'grid',
        headStyles: { fillColor: [220, 38, 38] },
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
