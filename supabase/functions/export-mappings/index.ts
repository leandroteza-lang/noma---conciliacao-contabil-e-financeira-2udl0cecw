import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { jsPDF } from 'npm:jspdf@2.5.1'
import autoTablePkg from 'npm:jspdf-autotable@3.8.2'
import * as XLSX from 'npm:xlsx@0.18.5'

const autoTable =
  typeof autoTablePkg === 'function' ? autoTablePkg : (autoTablePkg as any).default || autoTablePkg

if (typeof globalThis.window === 'undefined') {
  ;(globalThis as any).window = globalThis
}
if (typeof globalThis.document === 'undefined') {
  ;(globalThis as any).document = { createElement: () => ({}) }
}

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

    const { format, data } = await req.json()

    if (format === 'excel') {
      const worksheet = XLSX.utils.json_to_sheet(data)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Mapeamentos')
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'base64' })
      return new Response(JSON.stringify({ excel: excelBuffer }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (format === 'csv') {
      let csvContent = 'Centro de Custo TGA;Conta Contábil;Status\n'
      data.forEach((r: any) => {
        csvContent += `"${r['Centro de Custo'] || ''}";"${r['Conta Contábil'] || ''}";"${r['Status'] || ''}"\n`
      })
      return new Response(JSON.stringify({ csv: csvContent }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (format === 'txt') {
      let txtContent = 'RELATÓRIO DE MAPEAMENTOS\n=========================================\n\n'
      data.forEach((r: any) => {
        txtContent += `Centro de Custo TGA: ${r['Centro de Custo'] || '-'}\n`
        txtContent += `Conta Contábil Vinculada: ${r['Conta Contábil'] || '-'}\n`
        txtContent += `Status: ${r['Status'] || '-'}\n`
        txtContent += '-----------------------------------------\n'
      })
      return new Response(JSON.stringify({ txt: txtContent }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (format === 'pdf' || format === 'browser') {
      const doc = new jsPDF('landscape')
      doc.setFontSize(16)
      doc.text('Relatório de Mapeamentos', 14, 20)

      const body = data.map((r: any) => [
        r['Centro de Custo'] || '-',
        r['Conta Contábil'] || '-',
        r['Status'] || '-',
      ])

      autoTable(doc, {
        startY: 25,
        head: [['Centro de Custo TGA', 'Conta Contábil Vinculada', 'Status']],
        body: body,
        theme: 'grid',
        headStyles: { fillColor: [220, 38, 38] },
        styles: { fontSize: 9 },
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
