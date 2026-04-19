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
          Nome: r.name || '',
          CPF: r.cpf || '',
          Email: r.email || '',
          Telefone: r.phone || '',
          Endereço: r.address || '',
          Departamento: r.departments?.name || r.department || '',
          Perfil:
            r.role === 'admin'
              ? 'Administrador'
              : r.role === 'supervisor'
                ? 'Supervisor'
                : r.role === 'client_user'
                  ? 'Usuário Cliente'
                  : 'Colaborador',
          Status: r.approval_status === 'pending' ? 'Em Aprovação' : r.status ? 'Ativo' : 'Inativo',
          'Data Criação': r.created_at || '',
        })),
      )
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Usuários')
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'base64' })

      return new Response(JSON.stringify({ excel: excelBuffer }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (format === 'csv') {
      let csvContent = 'Nome;CPF;Email;Telefone;Endereço;Departamento;Perfil;Status;Data Criação\n'
      data.forEach((r: any) => {
        const perfil =
          r.role === 'admin'
            ? 'Administrador'
            : r.role === 'supervisor'
              ? 'Supervisor'
              : r.role === 'client_user'
                ? 'Usuário Cliente'
                : 'Colaborador'
        const status =
          r.approval_status === 'pending' ? 'Em Aprovação' : r.status ? 'Ativo' : 'Inativo'
        csvContent += `"${r.name || ''}";"${r.cpf || ''}";"${r.email || ''}";"${r.phone || ''}";"${r.address || ''}";"${r.departments?.name || r.department || ''}";"${perfil}";"${status}";"${r.created_at || ''}"\n`
      })
      return new Response(JSON.stringify({ csv: csvContent }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (format === 'txt') {
      let txtContent = 'RELATÓRIO DE USUÁRIOS\n=========================================\n\n'
      data.forEach((r: any) => {
        const perfil =
          r.role === 'admin'
            ? 'Administrador'
            : r.role === 'supervisor'
              ? 'Supervisor'
              : r.role === 'client_user'
                ? 'Usuário Cliente'
                : 'Colaborador'
        const status =
          r.approval_status === 'pending' ? 'Em Aprovação' : r.status ? 'Ativo' : 'Inativo'
        txtContent += `Nome: ${r.name || '-'}\n`
        txtContent += `CPF: ${r.cpf || '-'}\n`
        txtContent += `Email: ${r.email || '-'}\n`
        txtContent += `Telefone: ${r.phone || '-'}\n`
        txtContent += `Departamento: ${r.departments?.name || r.department || '-'}\n`
        txtContent += `Perfil: ${perfil}\n`
        txtContent += `Status: ${status}\n`
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
  <title>Relatório de Usuários</title>
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
      padding: 12px 16px; 
      text-align: left; 
      font-size: 15px; 
      font-weight: bold; 
      border-bottom: 1px solid #e2e8f0; 
    }
    td { 
      padding: 8px 16px; 
      font-size: 13px; 
      vertical-align: middle; 
      border: none;
    }
    
    .row-odd { background-color: #ffffff; color: #64748b; }
    .row-even { background-color: #800000; color: #ffffff; font-weight: bold; }
    
    .row-odd td.main-text { color: #0f172a; font-weight: 500; }
    .row-even td.main-text { color: #ffffff; font-weight: bold; }
    
    .badge { padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: normal; border: 1px solid transparent; }
    .row-even .badge { background-color: transparent !important; color: #ffffff !important; border-color: #ffffff !important; font-weight: bold; }
    
    .role-badge { border-color: #e2e8f0; }
    
    .status-active { background-color: #dcfce7; color: #065f46; }
    .status-inactive { background-color: #f1f5f9; color: #1e293b; }
    .status-pending { background-color: #fef3c7; color: #92400e; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        <h1>Relatório de Usuários</h1>
        <p>Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
      </div>
      <button class="print-btn" onclick="window.print()">Imprimir</button>
    </div>
    <div class="table-container">
      <table class="styled-table">
        <thead>
          <tr>
            <th>Nome</th>
            <th>E-mail</th>
            <th>CPF</th>
            <th>Perfil</th>
            <th>Departamento</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${data
            .map((r: any, index: number) => {
              const isEven = index % 2 === 1
              const rowClass = isEven ? 'row-even' : 'row-odd'
              
              const perfil = r.role === 'admin' ? 'Administrador' : r.role === 'supervisor' ? 'Supervisor' : r.role === 'client_user' ? 'Usuário Cliente' : 'Colaborador';
              
              let statusText = 'Inativo';
              let statusClass = 'status-inactive';
              if (r.approval_status === 'pending') {
                statusText = 'Pendente de Aprovação';
                statusClass = 'status-pending';
              } else if (r.status) {
                statusText = 'Ativo';
                statusClass = 'status-active';
              }
              
              return `
            <tr class="${rowClass}">
              <td class="main-text">${r.name || '-'}</td>
              <td>${r.email || '-'}</td>
              <td>${r.cpf || '-'}</td>
              <td><span class="badge role-badge">${perfil}</span></td>
              <td>${r.departments?.name || r.department || '-'}</td>
              <td><span class="badge ${statusClass}">${statusText}</span></td>
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
      const doc = new jsPDF('landscape')
      doc.setFontSize(18)
      doc.setTextColor(15, 23, 42)
      doc.text('Relatório de Usuários', 14, 20)

      doc.setFontSize(10)
      doc.setTextColor(100, 116, 139)
      doc.text(
        `Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`,
        280 - 14,
        20,
        { align: 'right' },
      )

      const body = data.map((r: any) => {
        const perfil =
          r.role === 'admin'
            ? 'Administrador'
            : r.role === 'supervisor'
              ? 'Supervisor'
              : r.role === 'client_user'
                ? 'Usuário Cliente'
                : 'Colaborador'
        const status =
          r.approval_status === 'pending' ? 'Em Aprovação' : r.status ? 'Ativo' : 'Inativo'

        return [
          r.name || '-',
          r.email || '-',
          r.cpf || '-',
          perfil,
          r.departments?.name || r.department || '-',
          status
        ]
      })

      autoTable(doc, {
        startY: 28,
        head: [['Nome', 'E-mail', 'CPF', 'Perfil', 'Departamento', 'Status']],
        body: body,
        theme: 'plain',
        tableLineWidth: 0.5,
        tableLineColor: [128, 0, 0], // #800000 outer border
        headStyles: {
          fillColor: [248, 250, 252],
          textColor: [0, 0, 0], // black header
          fontStyle: 'bold',
          halign: 'left',
          fontSize: 11, // larger font
        },
        styles: { 
          fontSize: 9,
          cellPadding: 4,
        },
        didParseCell: function (data: any) {
          if (data.section === 'body') {
            const isEven = data.row.index % 2 === 1
            if (isEven) {
              data.cell.styles.fillColor = [128, 0, 0] // #800000
              data.cell.styles.textColor = [255, 255, 255]
              data.cell.styles.fontStyle = 'bold'
            } else {
              data.cell.styles.fillColor = [255, 255, 255]
              data.cell.styles.textColor = [15, 23, 42] // darker text for main column could be set via column index
              data.cell.styles.fontStyle = 'normal'
            }
            
            // Adjust specific column text color if needed for odd rows
            if (!isEven && data.column.index === 0) {
              data.cell.styles.textColor = [15, 23, 42] // name main color
              data.cell.styles.fontStyle = 'bold'
            } else if (!isEven) {
              data.cell.styles.textColor = [100, 116, 139] // muted foreground for other columns
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
