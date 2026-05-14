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

    if (format === 'browser') {
      const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Relatório de Departamentos</title>
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
    .table-container-wrapper {
      padding: 24px;
    }
    .styled-table-container {
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      overflow: hidden;
    }
    .styled-table { 
      width: 100%; 
      border-collapse: collapse;
    }
    th { 
      background-color: #1e1b4b; 
      color: #ffffff; 
      padding: 12px 16px; 
      text-align: left; 
      font-size: 14px; 
      font-weight: bold; 
      border: 1px solid #cbd5e1; 
      border-top: none;
    }
    td { 
      padding: 8px 16px; 
      font-size: 11px; 
      vertical-align: middle; 
      border: 1px solid #cbd5e1;
    }
    th:first-child, td:first-child { border-left: none; }
    th:last-child, td:last-child { border-right: none; }
    tr:last-child td { border-bottom: none; }
    
    .row-odd { background-color: #ffffff; color: #0f172a; }
    .row-even { background-color: #bfdbfe; color: #0f172a; }
    
    .row-odd td.main-text { color: #0f172a; font-weight: bold; }
    .row-even td.main-text { color: #0f172a; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        <h1>Relatório de Departamentos</h1>
        <p>Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
      </div>
      <button class="print-btn" onclick="window.print()">Imprimir</button>
    </div>
    <div class="table-container-wrapper">
      <div class="styled-table-container">
      <table class="styled-table">
        <thead>
          <tr>
            <th>Código</th>
            <th>Nome</th>
            <th>Data Criação</th>
          </tr>
        </thead>
        <tbody>
          ${data
            .map((r: any, index: number) => {
              const isEven = index % 2 === 1
              const rowClass = isEven ? 'row-even' : 'row-odd'

              return `
            <tr class="${rowClass}">
              <td class="main-text">${r.code || '-'}</td>
              <td class="main-text">${r.name || '-'}</td>
              <td>${r.created_at || '-'}</td>
            </tr>
          `
            })
            .join('')}
        </tbody>
      </table>
      </div>
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
      doc.text('Relatório de Departamentos', 14, 20)

      doc.setFontSize(10)
      doc.setTextColor(100, 116, 139)
      doc.text(
        `Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`,
        200 - 14,
        20,
        { align: 'right' },
      )

      const body = data.map((r: any) => [r.code || '-', String(r.name || '-'), r.created_at || '-'])

      autoTable(doc, {
        startY: 28,
        head: [['Código', 'Nome', 'Data Criação']],
        body: body,
        theme: 'grid',
        headStyles: {
          fillColor: [30, 27, 75],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          halign: 'left',
          fontSize: 11,
        },
        styles: {
          fontSize: 8,
          cellPadding: 4,
          lineWidth: 0.1,
          lineColor: [203, 213, 225],
        },
        didParseCell: function (data: any) {
          if (data.section === 'body') {
            const isEven = data.row.index % 2 === 1
            if (isEven) {
              data.cell.styles.fillColor = [191, 219, 254]
              data.cell.styles.textColor = [15, 23, 42]
            } else {
              data.cell.styles.fillColor = [255, 255, 255]
              data.cell.styles.textColor = [15, 23, 42]
            }
            if (data.column.index === 0 || data.column.index === 1) {
              data.cell.styles.fontStyle = 'bold'
            }
          }
        },
      })

      const pdf = doc.output('datauristring')
      return new Response(JSON.stringify({ pdf }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    throw new Error('Formato inválido. Use "excel", "pdf", "csv", "txt" ou "browser".')
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
