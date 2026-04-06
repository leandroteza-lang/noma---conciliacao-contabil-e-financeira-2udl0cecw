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

    const { format, data, template } = await req.json()

    if (format === 'excel') {
      const worksheet = template
        ? XLSX.utils.json_to_sheet(data)
        : XLSX.utils.json_to_sheet(
            data.map((r: any) => ({
              Código: r.code || '',
              Nome: r.name || '',
              'Data Criação': r.created_at || '',
            })),
          )
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Departamentos')
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'base64' })

      return new Response(JSON.stringify({ excel: excelBuffer }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (format === 'pdf') {
      const doc = new jsPDF()
      doc.setFontSize(16)
      doc.text('Relatório de Departamentos', 14, 20)

      const body = data.map((r: any) => [r.code || '-', String(r.name || '-'), r.created_at || '-'])

      autoTable(doc, {
        startY: 25,
        head: [['Código', 'Nome', 'Data Criação']],
        body: body,
        theme: 'grid',
        headStyles: { fillColor: [220, 38, 38] },
        styles: { fontSize: 10 },
      })

      const pdf = doc.output('datauristring')
      return new Response(JSON.stringify({ pdf }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (format === 'csv') {
      let csvContent = 'Código;Nome;Data Criação\n'
      data.forEach((r: any) => {
        csvContent += `"${r.code || ''}";"${r.name || ''}";"${r.created_at || ''}"\n`
      })
      return new Response(JSON.stringify({ csv: csvContent }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (format === 'txt') {
      let txtContent = 'RELATÓRIO DE DEPARTAMENTOS\n=========================================\n\n'
      data.forEach((r: any) => {
        txtContent += `Código: ${r.code || '-'}\n`
        txtContent += `Nome: ${r.name || '-'}\n`
        txtContent += `Data Criação: ${r.created_at || '-'}\n`
        txtContent += '-----------------------------------------\n'
      })
      return new Response(JSON.stringify({ txt: txtContent }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    throw new Error('Formato inválido. Use "excel", "pdf", "csv" ou "txt".')
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
