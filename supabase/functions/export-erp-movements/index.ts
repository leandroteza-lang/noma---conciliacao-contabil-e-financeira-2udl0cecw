import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { jsPDF } from 'npm:jspdf@2.5.1'
import autoTablePkg from 'npm:jspdf-autotable@3.8.2'
import * as XLSX from 'npm:xlsx@0.18.5'

const autoTable = typeof autoTablePkg === 'function' ? autoTablePkg : (autoTablePkg as any).default || autoTablePkg

if (typeof globalThis.window === 'undefined') {
  ;(globalThis as any).window = globalThis
}
if (typeof globalThis.document === 'undefined') {
  ;(globalThis as any).document = { createElement: () => ({}) }
}

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

    const { format, data, totals } = await req.json()

    if (format === 'excel') {
      const worksheet = XLSX.utils.json_to_sheet(data)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Movimentos')
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'base64' })
      return new Response(JSON.stringify({ excel: excelBuffer }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (format === 'txt') {
      let txtContent = 'RELATÓRIO DE MOVIMENTO FINANCEIRO\n=========================================\n\n'
      
      if (totals) {
        const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
        txtContent += `TOTAIS DO PERÍODO:\n`
        txtContent += `Total (Bruto): ${formatCurrency(totals.valor)}\n`
        txtContent += `Total (Líquido): ${formatCurrency(totals.valor_liquido)}\n`
        txtContent += `Entradas / Positivos: ${formatCurrency(totals.entradas)}\n`
        txtContent += `Saídas / Negativos: ${formatCurrency(totals.saidas)}\n`
        txtContent += '=========================================\n\n'
      }

      const headers = Object.keys(data[0] || {})
      data.forEach((r: any) => {
        headers.forEach(h => {
          let val = r[h]
          if (typeof val === 'number') {
             val = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
          }
          txtContent += `${h}: ${val || '-'}\n`
        })
        txtContent += '-----------------------------------------\n'
      })
      return new Response(JSON.stringify({ txt: txtContent }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (format === 'pdf') {
      const headers = Object.keys(data[0] || {}).slice(0, 10) // Limit to 10 cols to fit in PDF
      
      const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

      const totalsHtml = totals ? `
      <div class="totals-container">
        <div class="total-card bg-slate">
          <div class="total-title">Total (Bruto)</div>
          <div class="total-value">${formatCurrency(totals.valor)}</div>
        </div>
        <div class="total-card bg-slate-dark">
          <div class="total-title">Total (Líquido)</div>
          <div class="total-value">${formatCurrency(totals.valor_liquido)}</div>
        </div>
        <div class="total-card bg-blue">
          <div class="total-title">Entradas / Positivos</div>
          <div class="total-value">${formatCurrency(totals.entradas)}</div>
        </div>
        <div class="total-card bg-red">
          <div class="total-title">Saídas / Negativos</div>
          <div class="total-value">${formatCurrency(totals.saidas)}</div>
        </div>
      </div>
      ` : '';

      const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Relatório de Movimento Financeiro</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    body { 
      font-family: 'Inter', system-ui, sans-serif; 
      background-color: #ffffff; 
      margin: 0; 
      padding: 24px; 
      color: #0f172a; 
    }
    .header { 
      margin-bottom: 24px;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .header h1 { margin: 0 0 4px 0; font-size: 20px; font-weight: 700; color: #1e1b4b; }
    .header p { margin: 0; color: #64748b; font-size: 12px; }
    .print-btn {
      background-color: #1e1b4b; color: white; border: none; padding: 8px 16px;
      border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 12px;
    }
    
    /* Novos Cards de Totais */
    .totals-container {
      display: flex;
      gap: 16px;
      margin-bottom: 24px;
    }
    .total-card {
      flex: 1;
      padding: 16px;
      border-radius: 12px;
      color: white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }
    .total-card.bg-slate { background: linear-gradient(135deg, #178f7a, #43d3a2); }
    .total-card.bg-slate-dark { background: linear-gradient(135deg, #a85a05, #f18a18); }
    .total-card.bg-blue { background: linear-gradient(135deg, #234ea3, #3f7de0); }
    .total-card.bg-red { background: #800000; }
    
    .total-title { font-size: 11px; text-transform: uppercase; font-weight: 600; margin-bottom: 6px; opacity: 0.9; letter-spacing: 0.5px; }
    .total-value { font-size: 20px; font-weight: 700; }

    @media print {
      .print-btn { display: none; }
      @page { size: landscape; margin: 1cm; }
      .totals-container {
        display: flex !important;
        flex-direction: row !important;
        gap: 12px !important;
        margin-bottom: 20px !important;
      }
      .total-card {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th { background-color: #1e1b4b; color: white; padding: 8px; text-align: left; font-size: 10px; font-weight: bold; border: 1px solid #cbd5e1; }
    td { padding: 6px 8px; font-size: 9px; vertical-align: top; border: 1px solid #cbd5e1; }
    .row-even { background-color: #f8fafc; }
    .row-odd { background-color: #ffffff; }
    .text-right { text-align: right; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>Relatório de Movimento Financeiro</h1>
      <p>Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
    </div>
    <button class="print-btn" onclick="window.print()">Imprimir / Salvar PDF</button>
  </div>
  ${totalsHtml}
  <table>
    <thead>
      <tr>
        ${headers.map((h: string) => `<th>${h}</th>`).join('')}
      </tr>
    </thead>
    <tbody>
      ${data.map((row: any, index: number) => {
        const isEven = index % 2 === 0;
        return `
          <tr class="${isEven ? 'row-even' : 'row-odd'}">
            ${headers.map((h: string) => {
              let val = row[h];
              let isNumber = typeof val === 'number';
              if (isNumber) {
                val = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
              }
              return `<td class="${isNumber ? 'text-right' : ''}">${val || '-'}</td>`;
            }).join('')}
          </tr>
        `;
      }).join('')}
    </tbody>
  </table>
  <script>
    window.onload = () => { setTimeout(() => window.print(), 500); }
  </script>
</body>
</html>
      `;
      
      return new Response(JSON.stringify({ html }), {
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
