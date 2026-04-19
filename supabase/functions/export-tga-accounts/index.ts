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
      const worksheet = XLSX.utils.json_to_sheet(
        data.map((r: any) => ({
          Empresa: r.empresa || 'Geral',
          Código: r.codigo || '',
          Nome: r.nome || '',
          Abreviação: r.abreviacao || '',
          Observações: r.observacoes || '',
        })),
      )
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Tipos Conta TGA')
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'base64' })

      return new Response(JSON.stringify({ excel: excelBuffer }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (format === 'csv') {
      let csvContent = 'Código;Nome;Abreviação;Empresa\n'
      data.forEach((r: any) => {
        csvContent += `"${r.codigo || ''}";"${r.nome || ''}";"${r.abreviacao || ''}";"${r.empresa || 'Geral'}"\n`
      })
      return new Response(JSON.stringify({ csv: csvContent }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (format === 'txt') {
      let txtContent =
        'RELATÓRIO DE TIPOS DE CONTA TGA\n=========================================\n\n'
      data.forEach((r: any) => {
        txtContent += `Código: ${r.codigo || '-'}\n`
        txtContent += `Nome: ${r.nome || '-'}\n`
        txtContent += `Abreviação: ${r.abreviacao || '-'}\n`
        txtContent += `Empresa: ${r.empresa || 'Geral'}\n`
        txtContent += '-----------------------------------------\n'
      })
      return new Response(JSON.stringify({ txt: txtContent }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (format === 'browser') {
      const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Relatório de Tipos de Conta TGA</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    body { 
      font-family: 'Inter', system-ui, sans-serif; 
      background-color: #f8fafc; 
      margin: 0; 
      padding: 24px; 
      color: #0f172a; 
      -webkit-font-smoothing: antialiased;
    }
    .container { 
      max-width: 1200px; 
      margin: 0 auto; 
      background: white; 
      border-radius: 12px; 
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); 
      overflow: hidden; 
    }
    .header { 
      padding: 24px; 
      border-bottom: 1px solid #e2e8f0; 
      display: flex; 
      justify-content: space-between; 
      align-items: center; 
      background: white;
    }
    .header h1 { margin: 0 0 4px 0; font-size: 24px; font-weight: 700; color: #0f172a; }
    .header p { margin: 0; color: #64748b; font-size: 14px; }
    .print-btn {
      background-color: #1e1b4b; color: white; border: none; padding: 10px 20px;
      border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 14px;
    }
    @media print {
      body { background-color: white; padding: 0; }
      .container { box-shadow: none; border-radius: 0; max-width: 100%; border: none; }
      .print-btn { display: none; }
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    }
    .table-container {
      padding: 24px;
    }
    .styled-table { 
      width: 100%; 
      border-collapse: collapse;
      border: 2px solid #800000;
      border-radius: 6px;
      overflow: hidden;
    }
    th { 
      background-color: #f8fafc; 
      color: #000000; 
      padding: 8px 16px; 
      text-align: left; 
      font-size: 15px; 
      font-weight: bold; 
      border-bottom: 1px solid #e2e8f0; 
    }
    td { 
      padding: 6px 16px; 
      font-size: 13px; 
      vertical-align: middle; 
      border: none;
    }
    
    .row-odd { background-color: #ffffff; color: #64748b; }
    .row-even { background-color: #800000; color: #ffffff; font-weight: bold; }
    
    .row-odd td.main-text { color: #0f172a; font-weight: 500; }
    .row-even td.main-text { color: #ffffff; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        <h1>Relatório de Tipos de Conta TGA</h1>
        <p>Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
      </div>
      <button class="print-btn" onclick="window.print()">Imprimir</button>
    </div>
    <div class="table-container">
      <table class="styled-table">
        <thead>
          <tr>
            <th>Código</th>
            <th>Nome</th>
            <th>Abreviação</th>
            <th>Empresa</th>
          </tr>
        </thead>
        <tbody>
          ${data
            .map((r: any, index: number) => {
              const isEven = index % 2 === 1
              const rowClass = isEven ? 'row-even' : 'row-odd'

              return `
            <tr class="${rowClass}">
              <td class="main-text">${r.codigo || '-'}</td>
              <td class="main-text">${r.nome || '-'}</td>
              <td>${r.abreviacao || '-'}</td>
              <td>${r.empresa || 'Geral'}</td>
            </tr>
          `
            })
            .join('')}
        </tbody>
      </table>
    </div>
  </div>
</body>
</html>
      `
      return new Response(JSON.stringify({ html }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (format === 'pdf') {
      const doc = new jsPDF() // Portrait
      doc.setFontSize(18)
      doc.setTextColor(15, 23, 42)
      doc.text('Relatório de Tipos de Conta TGA', 14, 20)

      doc.setFontSize(10)
      doc.setTextColor(100, 116, 139)
      doc.text(
        `Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`,
        200 - 14,
        20,
        { align: 'right' },
      )

      const body = data.map((r: any) => [
        r.codigo || '-',
        r.nome || '-',
        r.abreviacao || '-',
        r.empresa || 'Geral',
      ])

      autoTable(doc, {
        startY: 28,
        head: [['Código', 'Nome', 'Abreviação', 'Empresa']],
        body: body,
        theme: 'plain',
        tableLineWidth: 0.5,
        tableLineColor: [128, 0, 0], // Outer border
        headStyles: {
          fillColor: [248, 250, 252],
          textColor: [0, 0, 0], // black header
          fontStyle: 'bold',
          halign: 'left',
          fontSize: 11,
        },
        styles: {
          fontSize: 9,
          cellPadding: 3, // Thinner rows style excel
        },
        didParseCell: function (data: any) {
          if (data.section === 'body') {
            const isZebra = data.row.index % 2 !== 0
            if (isZebra) {
              data.cell.styles.fillColor = [128, 0, 0] // maroon zebra
              data.cell.styles.textColor = [255, 255, 255]
              data.cell.styles.fontStyle = 'bold'
            } else {
              data.cell.styles.fillColor = [255, 255, 255]
              data.cell.styles.textColor = [15, 23, 42]
              data.cell.styles.fontStyle = 'normal'
            }
          }
        },
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
