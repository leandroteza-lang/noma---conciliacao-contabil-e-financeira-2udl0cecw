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
      const exportData = data.map((r: any) => ({
        'Centro de Custo': r['Centro de Custo'],
        'Conta Contábil': r['Conta Contábil'],
        Status: r['Status'],
      }))
      const worksheet = XLSX.utils.json_to_sheet(exportData)
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

    if (format === 'browser') {
      const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Relatório de Mapeamento DE/PARA</title>
  <style>
    :root {
      --slate-50: #f8fafc;
      --slate-200: #e2e8f0;
      --slate-400: #94a3b8;
      --slate-500: #64748b;
      --slate-700: #334155;
      --slate-900: #0f172a;
      --indigo-950: #1e1b4b;
      --emerald-50: #ecfdf5;
      --emerald-600: #059669;
      --amber-50: #fffbeb;
      --amber-700: #b45309;
    }
    body { 
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; 
      background-color: var(--slate-50); 
      margin: 0; 
      padding: 24px; 
      color: var(--slate-900); 
      -webkit-font-smoothing: antialiased;
    }
    .container { 
      max-width: 1400px; 
      margin: 0 auto; 
      background: white; 
      border-radius: 12px; 
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06); 
      overflow: hidden; 
    }
    .header { 
      padding: 24px; 
      border-bottom: 1px solid var(--slate-200); 
      display: flex; 
      justify-content: space-between; 
      align-items: center; 
      background: white;
    }
    .header-content h1 { 
      margin: 0 0 4px 0; 
      font-size: 24px; 
      font-weight: 700;
      color: var(--slate-900); 
    }
    .header-content p {
      margin: 0;
      color: var(--slate-500);
      font-size: 14px;
    }
    .print-btn {
      background-color: var(--indigo-950);
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
      font-size: 14px;
      transition: opacity 0.2s;
    }
    .print-btn:hover { opacity: 0.9; }
    @media print {
      body { background-color: white; padding: 0; }
      .container { box-shadow: none; border-radius: 0; max-width: 100%; }
      .print-btn { display: none; }
    }
    table { 
      width: 100%; 
      border-collapse: collapse; 
    }
    th { 
      background-color: var(--indigo-950); 
      color: white; 
      padding: 16px; 
      text-align: left; 
      font-size: 14px; 
      font-weight: 600; 
    }
    .badge-de { 
      background-color: rgba(255,255,255,0.1); 
      border: 1px solid rgba(255,255,255,0.3); 
      padding: 2px 8px; 
      border-radius: 4px; 
      font-size: 11px; 
      font-weight: 700;
      margin-right: 12px; 
    }
    .badge-para { 
      background-color: rgba(255,255,255,0.2); 
      padding: 2px 8px; 
      border-radius: 4px; 
      font-size: 11px; 
      font-weight: 700;
      margin-right: 12px; 
      border: none; 
    }
    td { 
      padding: 12px 16px; 
      border-bottom: 1px solid var(--slate-200); 
      font-size: 14px; 
      vertical-align: middle;
    }
    .synthetic { 
      background-color: var(--slate-50); 
    }
    .synthetic td {
      font-weight: 600;
    }
    .analytic { 
      background-color: white; 
    }
    .status-mapped { 
      display: inline-flex; 
      align-items: center; 
      background-color: var(--emerald-50); 
      color: var(--emerald-600); 
      padding: 4px 12px; 
      border-radius: 9999px; 
      font-size: 12px; 
      font-weight: 600; 
    }
    .status-pending { 
      display: inline-flex; 
      align-items: center; 
      background-color: var(--amber-50); 
      color: var(--amber-700); 
      padding: 4px 12px; 
      border-radius: 9999px; 
      font-size: 12px; 
      font-weight: 600; 
    }
    .flex-col { display: flex; flex-direction: column; }
    .flex-row { display: flex; align-items: center; }
    .code { color: var(--slate-500); margin-right: 8px; font-variant-numeric: tabular-nums; }
    .empty-state { color: var(--slate-400); font-style: italic; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="header-content">
        <h1>Mapeamento DE/PARA</h1>
        <p>Relatório gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
      </div>
      <button class="print-btn" onclick="window.print()">Imprimir PDF</button>
    </div>
    <table>
      <thead>
        <tr>
          <th style="width: 45%;"><div class="flex-row"><span class="badge-de">DE</span> Centro de Custo TGA</div></th>
          <th style="width: 40%;"><div class="flex-row"><span class="badge-para">PARA</span> Conta Contábil Vinculada</div></th>
          <th style="width: 15%; text-align: center;">Status</th>
        </tr>
      </thead>
      <tbody>
        ${data
          .map(
            (r: any) => `
          <tr class="${r.isSynthetic ? 'synthetic' : 'analytic'}">
            <td>
              <div class="flex-row">
                <span style="display: inline-block; width: ${(r.level || 0) * 24}px"></span>
                <span class="code">${r.ccCode}</span>
                <span>${r.ccDesc}</span>
              </div>
            </td>
            <td>
              ${
                r.mapped
                  ? `
                <div class="flex-row">
                  <span class="code">${r.caCode}</span>
                  <span>${r.caDesc}</span>
                </div>
              `
                  : '<span class="empty-state">Não vinculado</span>'
              }
            </td>
            <td style="text-align: center;">
              ${r.isSynthetic ? '-' : `<span class="${r.mapped ? 'status-mapped' : 'status-pending'}">${r.status}</span>`}
            </td>
          </tr>
        `,
          )
          .join('')}
      </tbody>
    </table>
  </div>
</body>
</html>
      `
      return new Response(JSON.stringify({ html }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (format === 'pdf') {
      const doc = new jsPDF('landscape')

      doc.setFontSize(18)
      doc.setTextColor(15, 23, 42)
      doc.text('Relatório de Mapeamento DE/PARA', 14, 20)

      doc.setFontSize(10)
      doc.setTextColor(100, 116, 139)
      doc.text(
        `Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`,
        280 - 14,
        20,
        { align: 'right' },
      )

      const body = data.map((r: any) => [
        { content: `${'   '.repeat(r.level || 0)}${r.ccCode} - ${r.ccDesc}` },
        { content: r.mapped ? `${r.caCode} - ${r.caDesc}` : 'Não vinculado' },
        { content: r.isSynthetic ? '-' : r.status },
      ])

      autoTable(doc, {
        startY: 28,
        head: [['DE: Centro de Custo TGA', 'PARA: Conta Contábil Vinculada', 'Status']],
        body: body,
        theme: 'grid',
        headStyles: {
          fillColor: [30, 27, 75], // indigo-950
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          halign: 'left',
        },
        columnStyles: {
          0: { cellWidth: 125 },
          1: { cellWidth: 115 },
          2: { cellWidth: 30, halign: 'center' },
        },
        styles: {
          fontSize: 9,
          cellPadding: 5,
          lineColor: [226, 232, 240], // slate-200
          lineWidth: 0.1,
        },
        willDrawCell: function (cellData: any) {
          const rowData = data[cellData.row.index]
          if (cellData.section === 'body') {
            if (rowData.isSynthetic) {
              cellData.cell.styles.fillColor = [248, 250, 252] // slate-50
              cellData.cell.styles.fontStyle = 'bold'
              cellData.cell.styles.textColor = [15, 23, 42] // slate-900
            } else {
              cellData.cell.styles.fillColor = [255, 255, 255]
              cellData.cell.styles.textColor = [51, 65, 85] // slate-700
            }

            if (cellData.column.index === 2 && !rowData.isSynthetic) {
              if (rowData.mapped) {
                cellData.cell.styles.textColor = [5, 150, 105] // emerald-600
                cellData.cell.styles.fontStyle = 'bold'
              } else {
                cellData.cell.styles.textColor = [180, 83, 9] // amber-700
                cellData.cell.styles.fontStyle = 'bold'
              }
            }

            if (cellData.column.index === 1 && !rowData.mapped) {
              cellData.cell.styles.textColor = [148, 163, 184] // slate-400
              cellData.cell.styles.fontStyle = 'italic'
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
