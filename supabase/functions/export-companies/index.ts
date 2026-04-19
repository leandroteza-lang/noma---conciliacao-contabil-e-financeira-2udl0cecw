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
          Nome: r.name,
          CNPJ: r.cnpj || '',
          CPF: r.cpf || '',
          Status: r.status ? 'Ativo' : 'Inativo',
          Telefone: r.phone || '',
          Email: r.email || '',
          'Data Criacao': r.created_at,
        })),
      )
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Empresas')
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'base64' })

      return new Response(JSON.stringify({ excel: excelBuffer }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (format === 'csv') {
      let csvContent = 'Nome;CNPJ/CPF;Email;Telefone;Status\n'
      data.forEach((r: any) => {
        const doc = r.cnpj || r.cpf || ''
        const status = r.status ? 'Ativa' : 'Inativa'
        csvContent += `"${r.name || ''}";"${doc}";"${r.email || ''}";"${r.phone || ''}";"${status}"\n`
      })
      return new Response(JSON.stringify({ csv: csvContent }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (format === 'txt') {
      let txtContent = 'RELATÓRIO DE EMPRESAS\n=========================================\n\n'
      data.forEach((r: any) => {
        txtContent += `Nome: ${r.name || '-'}\n`
        txtContent += `CNPJ/CPF: ${r.cnpj || r.cpf || '-'}\n`
        txtContent += `Email: ${r.email || '-'}\n`
        txtContent += `Telefone: ${r.phone || '-'}\n`
        txtContent += `Status: ${r.status ? 'Ativa' : 'Inativa'}\n`
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
  <title>Relatório de Empresas</title>
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
      max-width: 1400px; 
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
      .container { box-shadow: none; border-radius: 0; max-width: 100%; }
      .print-btn { display: none; }
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    }
    table { width: 100%; border-collapse: collapse; }
    th { background-color: #f8fafc; color: #000; padding: 12px 16px; text-align: left; font-size: 14px; font-weight: bold; border-bottom: 1px solid #e2e8f0; }
    td { padding: 8px 16px; font-size: 13px; vertical-align: middle; }
    
    .row-odd { background-color: #ffffff; color: #0f172a; border-bottom: 1px solid #f1f5f9; }
    .row-even { background-color: #800000; color: #ffffff; font-weight: bold; }
    
    .status-badge { padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 600; }
    
    .status-active-odd { background-color: #dcfce7; color: #065f46; }
    .status-inactive-odd { background-color: #f1f5f9; color: #475569; }
    
    .status-active-even { background-color: rgba(255,255,255,0.2); color: #ffffff; }
    .status-inactive-even { background-color: rgba(255,255,255,0.2); color: #ffffff; }

    .doc-label-odd { font-weight: 500; color: #64748b; margin-right: 4px; }
    .doc-label-even { font-weight: 500; color: #ffffff; margin-right: 4px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        <h1>Relatório de Empresas</h1>
        <p>Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
      </div>
      <button class="print-btn" onclick="window.print()">Imprimir</button>
    </div>
    <table>
      <thead>
        <tr>
          <th>Empresa</th>
          <th>Documentos</th>
          <th>Contato</th>
          <th>Status</th>
          <th>Criado em</th>
        </tr>
      </thead>
      <tbody>
        ${data
          .map((r: any, index: number) => {
            const isEven = index % 2 === 1
            const rowClass = isEven ? 'row-even' : 'row-odd'
            const statusClass = r.status 
              ? (isEven ? 'status-active-even' : 'status-active-odd') 
              : (isEven ? 'status-inactive-even' : 'status-inactive-odd')
            const docLabelClass = isEven ? 'doc-label-even' : 'doc-label-odd'
            
            return `
          <tr class="${rowClass}">
            <td>
              <div>
                <div style="font-size: 14px;">${r.name || '-'}</div>
                ${r.address ? `<div style="font-size: 11px; font-weight: normal; margin-top: 2px; ${isEven ? 'color: #e2e8f0;' : 'color: #64748b;'}">${r.address}</div>` : ''}
              </div>
            </td>
            <td>
              ${r.cnpj ? `<div><span class="${docLabelClass}">CNPJ:</span>${r.cnpj}</div>` : ''}
              ${r.cpf ? `<div><span class="${docLabelClass}">CPF:</span>${r.cpf}</div>` : ''}
              ${!r.cnpj && !r.cpf ? '-' : ''}
            </td>
            <td>
              ${r.email ? `<div>${r.email}</div>` : ''}
              ${r.phone ? `<div>${r.phone}</div>` : ''}
              ${!r.email && !r.phone ? '-' : ''}
            </td>
            <td>
              <span class="status-badge ${statusClass}">${r.status ? 'Ativo' : 'Inativo'}</span>
            </td>
            <td>
              ${r.created_at || '-'}
            </td>
          </tr>
        `
          })
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
      doc.text('Relatório de Empresas', 14, 20)

      doc.setFontSize(10)
      doc.setTextColor(100, 116, 139)
      doc.text(
        `Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`,
        280 - 14,
        20,
        { align: 'right' },
      )

      const body = data.map((r: any) => [
        r.name + (r.address ? `\n${r.address}` : ''),
        (r.cnpj ? `CNPJ: ${r.cnpj}` : '') + (r.cnpj && r.cpf ? '\n' : '') + (r.cpf ? `CPF: ${r.cpf}` : (!r.cnpj && !r.cpf ? '-' : '')),
        (r.email || '') + (r.email && r.phone ? '\n' : '') + (r.phone || (!r.email && !r.phone ? '-' : '')),
        r.status ? 'Ativo' : 'Inativo',
        r.created_at || '-'
      ])

      autoTable(doc, {
        startY: 28,
        head: [['Empresa', 'Documentos', 'Contato', 'Status', 'Criado em']],
        body: body,
        theme: 'grid',
        headStyles: {
          fillColor: [248, 250, 252],
          textColor: [0, 0, 0],
          fontStyle: 'bold',
          halign: 'left',
        },
        styles: { 
          fontSize: 9,
          cellPadding: 4,
          lineColor: [226, 232, 240],
          lineWidth: 0.1,
        },
        didParseCell: function (data: any) {
          if (data.section === 'body') {
            const isEven = data.row.index % 2 === 1
            if (isEven) {
              data.cell.styles.fillColor = [128, 0, 0] // #800000 Maroon
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
