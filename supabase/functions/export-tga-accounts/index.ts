import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { jsPDF } from 'npm:jspdf@2.5.1'
import autoTable from 'npm:jspdf-autotable@3.8.2'
import * as XLSX from 'npm:xlsx@0.18.5'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, x-supabase-client-platform, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Cabeçalho de autorização ausente')

    const { format, data } = await req.json()
    
    if (format === 'excel') {
      const worksheet = XLSX.utils.json_to_sheet(data.map((r: any) => ({
        'Empresa': r.empresa || 'Geral',
        'Código': r.codigo || '',
        'Nome': r.nome || '',
        'Abreviação': r.abreviacao || '',
        'Observações': r.observacoes || ''
      })))
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, "Tipos Conta TGA")
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'base64' })
      
      return new Response(JSON.stringify({ excel: excelBuffer }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    
    if (format === 'csv') {
      let csvContent = 'Código;Nome;Abreviação;Empresa\n';
      data.forEach((r: any) => {
        csvContent += `"${r.codigo || ''}";"${r.nome || ''}";"${r.abreviacao || ''}";"${r.empresa || 'Geral'}"\n`;
      });
      return new Response(JSON.stringify({ csv: csvContent }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    
    if (format === 'txt') {
      let txtContent = 'RELATÓRIO DE TIPOS DE CONTA TGA\n=========================================\n\n';
      data.forEach((r: any) => {
        txtContent += `Código: ${r.codigo || '-'}\n`;
        txtContent += `Nome: ${r.nome || '-'}\n`;
        txtContent += `Abreviação: ${r.abreviacao || '-'}\n`;
        txtContent += `Empresa: ${r.empresa || 'Geral'}\n`;
        txtContent += '-----------------------------------------\n';
      });
      return new Response(JSON.stringify({ txt: txtContent }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (format === 'pdf') {
      const doc = new jsPDF()
      doc.setFontSize(16)
      doc.text('Relatório de Tipos de Conta TGA', 14, 20)
      
      const body = data.map((r: any) => [
        r.codigo || '-',
        r.nome || '-',
        r.abreviacao || '-',
        r.empresa || 'Geral'
      ])

      autoTable(doc, {
        startY: 25,
        head: [['Código', 'Nome', 'Abreviação', 'Empresa']],
        body: body,
        theme: 'grid',
        headStyles: { fillColor: [220, 38, 38] },
        styles: { fontSize: 10 }
      })
      
      const pdf = doc.output('datauristring')
      return new Response(JSON.stringify({ pdf }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    
    throw new Error('Formato inválido.')
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
