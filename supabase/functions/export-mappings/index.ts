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

    // Flatten data for Excel and PDF
    const flatData: any[] = []
    data.forEach((r: any) => {
      flatData.push({
        ...r,
        isHierarchyRow: false
      })
      if (r.isExpanded && r.hierarchyArray && r.hierarchyArray.length > 0) {
        flatData.push({
          isHierarchyHeader: true,
          ccCode: '', ccDesc: '↳ Raiz Hierárquica da Conta Vinculada',
          caCode: '', caDesc: '',
          status: '', level: r.level + 1
        })
        r.hierarchyArray.forEach((node: any) => {
          const code = node.classification || node.account_code || ''
          const nodeLevel = (code.match(/\./g) || []).length + 1
          flatData.push({
            isHierarchyRow: true,
            ccCode: '',
            ccDesc: '',
            caCode: code,
            caDesc: node.account_name,
            nodeLevel,
            isSyntheticNode: node.account_level === 'Sintética',
            level: r.level + 1
          })
        })
      }
    })

    if (format === 'excel') {
      const exportExcelData = flatData.map((r: any) => {
        if (r.isHierarchyHeader) {
          return {
            'Centro de Custo': r.ccDesc,
            'Conta Contábil': '',
            'Status': ''
          }
        }
        if (r.isHierarchyRow) {
          return {
            'Centro de Custo': '',
            'Conta Contábil': `   ${r.caCode} - ${r.caDesc}`,
            'Status': ''
          }
        }
        return {
          'Centro de Custo': `${'  '.repeat(r.level)}${r.isSynthetic ? '[S]' : '[A]'} ${r.ccCode} - ${r.ccDesc}`.trim(),
          'Conta Contábil': r.mapped ? `${r.caCode} - ${r.caDesc}` : 'Não vinculado',
          'Status': r.Status
        }
      })
      const worksheet = XLSX.utils.json_to_sheet(exportExcelData)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Mapeamentos')
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'base64' })
      return new Response(JSON.stringify({ excel: excelBuffer }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (format === 'csv') {
      let csvContent = 'Centro de Custo TGA;Conta Contábil;Status\n'
      flatData.forEach((r: any) => {
        if (r.isHierarchyHeader) {
          csvContent += `"${r.ccDesc}";"";""\n`
        } else if (r.isHierarchyRow) {
          csvContent += `"";"${r.caCode} - ${r.caDesc}";""\n`
        } else {
          const ccStr = `${'  '.repeat(r.level)}${r.isSynthetic ? '[S]' : '[A]'} ${r.ccCode} - ${r.ccDesc}`
          const caStr = r.mapped ? `${r.caCode} - ${r.caDesc}` : 'Não vinculado'
          csvContent += `"${ccStr}";"${caStr}";"${r.Status}"\n`
        }
      })
      return new Response(JSON.stringify({ csv: csvContent }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (format === 'txt') {
      let txtContent = 'RELATÓRIO DE MAPEAMENTOS\n=========================================\n\n'
      flatData.forEach((r: any) => {
        if (r.isHierarchyHeader) {
          txtContent += `${r.ccDesc}\n`
        } else if (r.isHierarchyRow) {
          txtContent += `      -> ${r.caCode} - ${r.caDesc}\n`
        } else {
          const ccStr = `${'  '.repeat(r.level)}${r.isSynthetic ? '[S]' : '[A]'} ${r.ccCode} - ${r.ccDesc}`
          const caStr = r.mapped ? `${r.caCode} - ${r.caDesc}` : 'Não vinculado'
          txtContent += `Centro de Custo TGA: ${ccStr}\n`
          txtContent += `Conta Contábil Vinculada: ${caStr}\n`
          txtContent += `Status: ${r.Status}\n`
          txtContent += '-----------------------------------------\n'
        }
      })
      return new Response(JSON.stringify({ txt: txtContent }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (format === 'browser') {
      const getRowStyle = (r: any) => {
        if (r.isSynthetic) {
          switch (r.level) {
            case 0: return 'background-color: #1e1b4b; color: #ffffff;'
            case 1: return 'background-color: #312e81; color: #ffffff;'
            case 2: return 'background-color: #3730a3; color: #ffffff;'
            case 3: return 'background-color: #e0e7ff; color: #1e1b4b;'
            default: return 'background-color: #f8fafc; color: #1e293b;'
          }
        }
        if (!r.mapped) {
          return r.rowIndex % 2 === 0 ? 'background-color: rgba(254, 243, 199, 0.4); color: #334155;' : 'background-color: rgba(254, 243, 199, 0.7); color: #334155;'
        }
        if (r.ccPendingDeletion) {
          return 'background-color: rgba(254, 226, 226, 0.5); color: #64748b;'
        }
        return r.rowIndex % 2 === 0 ? 'background-color: #ffffff; color: #334155;' : 'background-color: #dbeefc; color: #1e293b;'
      }

      const getHierarchyNodeStyle = (nodeLevel: number, isSyntheticNode: boolean) => {
        if (!isSyntheticNode) return 'background-color: #ffffff; color: #334155; border-bottom: 1px solid #f1f5f9;'
        switch (nodeLevel) {
          case 1: return 'background-color: #1e1b4b; color: #ffffff; font-weight: 700; border-bottom: 1px solid rgba(255,255,255,0.1);'
          case 2: return 'background-color: #312e81; color: #ffffff; font-weight: 600; border-bottom: 1px solid rgba(255,255,255,0.1);'
          case 3: return 'background-color: #3730a3; color: #ffffff; font-weight: 500; border-bottom: 1px solid rgba(255,255,255,0.1);'
          case 4: return 'background-color: #e0e7ff; color: #1e1b4b; font-weight: 500; border-bottom: 1px solid #c7d2fe;'
          default: return 'background-color: #f8fafc; color: #1e293b; font-weight: 500; border-bottom: 1px solid #e2e8f0;'
        }
      }

      const getHierarchyBadgeStyle = (nodeLevel: number, isSyntheticNode: boolean) => {
        if (!isSyntheticNode) return 'background-color: #f1f5f9; color: #475569; border: 1px solid #e2e8f0;'
        switch (nodeLevel) {
          case 1: return 'background-color: #312e81; color: #ffffff; border: 1px solid #3730a3;'
          case 2: return 'background-color: #3730a3; color: #ffffff; border: 1px solid #4338ca;'
          case 3: return 'background-color: #4338ca; color: #ffffff; border: 1px solid #4f46e5;'
          case 4: return 'background-color: #c7d2fe; color: #1e1b4b; border: 1px solid #a5b4fc;'
          default: return 'background-color: #e2e8f0; color: #1e293b; border: 1px solid #cbd5e1;'
        }
      }

      const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Relatório de Mapeamento DE/PARA</title>
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
    }
    table { width: 100%; border-collapse: collapse; }
    th { background-color: #1e1b4b; color: white; padding: 12px 16px; text-align: left; font-size: 14px; font-weight: 600; }
    td { padding: 6px 16px; border-bottom: 1px solid #f1f5f9; font-size: 12px; vertical-align: middle; }
    
    .badge-de { background-color: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.3); padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; margin-right: 12px; }
    .badge-para { background-color: rgba(255,255,255,0.2); padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; margin-right: 12px; }
    
    .type-badge-s { background-color: rgba(255,255,255,0.2); padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 700; }
    .type-badge-s-dark { background-color: rgba(0,0,0,0.1); padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 700; color: inherit; }
    .type-badge-a { background-color: #eff6ff; color: #2563eb; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 700; border: 1px solid #bfdbfe; }
    
    .ca-badge { background-color: #1e1b4b; color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; font-family: monospace; }
    .status-mapped { display: inline-flex; align-items: center; background-color: #ecfdf5; color: #059669; padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: 600; border: 1px solid #a7f3d0; }
    .status-pending { display: inline-flex; align-items: center; background-color: #fffbeb; color: #b45309; padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: 600; border: 1px solid #fde68a; }
    
    .hierarchy-container { margin: 8px 0; border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden; background: white; }
    .hierarchy-header { background: #f8fafc; padding: 6px 12px; font-size: 9px; font-weight: 700; color: #64748b; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; }
    .hierarchy-node { padding: 6px 12px; display: flex; align-items: center; gap: 8px; }
    .hierarchy-badge { font-family: monospace; font-size: 10px; padding: 2px 6px; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        <h1>Mapeamento DE/PARA</h1>
        <p>Relatório gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
      </div>
      <button class="print-btn" onclick="window.print()">Imprimir PDF</button>
    </div>
    <table>
      <thead>
        <tr>
          <th style="width: 45%;"><span class="badge-de">DE</span> Centro de Custo TGA</th>
          <th style="width: 40%;"><span class="badge-para">PARA</span> Conta Contábil Vinculada</th>
          <th style="width: 15%; text-align: center;">Status</th>
        </tr>
      </thead>
      <tbody>
        ${data.map((r: any) => `
          <tr style="${getRowStyle(r)}">
            <td>
              <div style="display: flex; align-items: center; gap: 8px; padding-left: ${r.level * 20}px">
                <span class="${r.isSynthetic ? (r.level <= 2 ? 'type-badge-s' : 'type-badge-s-dark') : 'type-badge-a'}">${r.isSynthetic ? 'S' : 'A'}</span>
                <span style="font-family: monospace; font-size: 11px; font-weight: 600;">${r.ccCode}</span>
                <span>${r.ccDesc}</span>
              </div>
            </td>
            <td>
              ${r.isSynthetic ? '' : r.mapped ? `
                <div style="display: flex; flex-direction: column; gap: 4px;">
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span class="ca-badge">${r.caCode}</span>
                    <span>${r.caDesc}</span>
                  </div>
                  ${r.isExpanded && r.hierarchyArray && r.hierarchyArray.length > 0 ? `
                    <div class="hierarchy-container">
                      <div class="hierarchy-header">Raiz Hierárquica</div>
                      ${r.hierarchyArray.map((node: any) => {
                        const code = node.classification || node.account_code || ''
                        const nodeLevel = (code.match(/\./g) || []).length + 1
                        const isSyn = node.account_level === 'Sintética'
                        return `
                          <div class="hierarchy-node" style="${getHierarchyNodeStyle(nodeLevel, isSyn)}">
                            <span class="hierarchy-badge" style="${getHierarchyBadgeStyle(nodeLevel, isSyn)}">${code}</span>
                            <span style="font-size: 11px;">${node.account_name}</span>
                          </div>
                        `
                      }).join('')}
                    </div>
                  ` : ''}
                </div>
              ` : '<span style="color: #94a3b8; font-style: italic;">Não vinculado</span>'}
            </td>
            <td style="text-align: center;">
              ${r.isSynthetic ? '-' : `<span class="${r.mapped ? 'status-mapped' : 'status-pending'}">${r.Status}</span>`}
            </td>
          </tr>
        `).join('')}
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
      doc.text(`Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 280 - 14, 20, { align: 'right' })

      const body = flatData.map((r: any) => {
        if (r.isHierarchyHeader) {
          return [
            { content: `${'   '.repeat(r.level)} ${r.ccDesc}`, colSpan: 3 }
          ]
        }
        if (r.isHierarchyRow) {
          return [
            '',
            { content: `      [${r.caCode}] ${r.caDesc}` },
            ''
          ]
        }
        const ccPrefix = r.isSynthetic ? '[S] ' : '[A] '
        return [
          { content: `${'   '.repeat(r.level)}${ccPrefix}${r.ccCode} - ${r.ccDesc}` },
          { content: r.isSynthetic ? '' : r.mapped ? `[${r.caCode}] ${r.caDesc}` : 'Não vinculado' },
          { content: r.isSynthetic ? '-' : r.Status }
        ]
      })

      autoTable(doc, {
        startY: 28,
        head: [['DE: Centro de Custo TGA', 'PARA: Conta Contábil Vinculada', 'Status']],
        body: body,
        theme: 'grid',
        headStyles: { 
          fillColor: [30, 27, 75], // indigo-950
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          halign: 'left'
        },
        columnStyles: {
          0: { cellWidth: 125 },
          1: { cellWidth: 115 },
          2: { cellWidth: 30, halign: 'center' }
        },
        styles: { 
          fontSize: 9,
          cellPadding: 4,
          lineColor: [226, 232, 240], // slate-200
          lineWidth: 0.1
        },
        willDrawCell: function (cellData: any) {
          const rowData = flatData[cellData.row.index]
          if (!rowData) return;

          if (cellData.section === 'body') {
            if (rowData.isHierarchyHeader) {
              cellData.cell.styles.fillColor = [248, 250, 252]
              cellData.cell.styles.textColor = [100, 116, 139]
              cellData.cell.styles.fontStyle = 'bold'
              cellData.cell.styles.fontSize = 8
              return;
            }

            if (rowData.isHierarchyRow) {
              if (rowData.isSyntheticNode) {
                switch (rowData.nodeLevel) {
                  case 1: cellData.cell.styles.fillColor = [30, 27, 75]; cellData.cell.styles.textColor = [255, 255, 255]; break;
                  case 2: cellData.cell.styles.fillColor = [49, 46, 129]; cellData.cell.styles.textColor = [255, 255, 255]; break;
                  case 3: cellData.cell.styles.fillColor = [55, 48, 163]; cellData.cell.styles.textColor = [255, 255, 255]; break;
                  case 4: cellData.cell.styles.fillColor = [224, 231, 255]; cellData.cell.styles.textColor = [30, 27, 75]; break;
                  default: cellData.cell.styles.fillColor = [248, 250, 252]; cellData.cell.styles.textColor = [30, 41, 59]; break;
                }
                cellData.cell.styles.fontStyle = 'bold'
              } else {
                cellData.cell.styles.fillColor = [255, 255, 255]
                cellData.cell.styles.textColor = [51, 65, 85]
              }
              return;
            }

            if (rowData.isSynthetic) {
              switch (rowData.level) {
                case 0:
                  cellData.cell.styles.fillColor = [30, 27, 75] // indigo-950
                  cellData.cell.styles.textColor = [255, 255, 255]
                  cellData.cell.styles.fontStyle = 'bold'
                  break
                case 1:
                  cellData.cell.styles.fillColor = [49, 46, 129] // indigo-900
                  cellData.cell.styles.textColor = [255, 255, 255]
                  cellData.cell.styles.fontStyle = 'bold'
                  break
                case 2:
                  cellData.cell.styles.fillColor = [55, 48, 163] // indigo-800
                  cellData.cell.styles.textColor = [255, 255, 255]
                  cellData.cell.styles.fontStyle = 'bold'
                  break
                case 3:
                  cellData.cell.styles.fillColor = [224, 231, 255] // indigo-100
                  cellData.cell.styles.textColor = [30, 27, 75]
                  cellData.cell.styles.fontStyle = 'bold'
                  break
                default:
                  cellData.cell.styles.fillColor = [248, 250, 252] // slate-50
                  cellData.cell.styles.textColor = [30, 41, 59]
                  cellData.cell.styles.fontStyle = 'bold'
                  break
              }
            } else {
              if (!rowData.mapped) {
                cellData.cell.styles.fillColor = rowData.rowIndex % 2 === 0 ? [255, 251, 235] : [254, 243, 199]
                cellData.cell.styles.textColor = [51, 65, 85]
              } else if (rowData.ccPendingDeletion) {
                cellData.cell.styles.fillColor = [254, 242, 242]
                cellData.cell.styles.textColor = [100, 116, 139]
              } else {
                cellData.cell.styles.fillColor = rowData.rowIndex % 2 === 0 ? [255, 255, 255] : [219, 238, 252] // #dbeefc
                cellData.cell.styles.textColor = [51, 65, 85]
              }
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

            if (cellData.column.index === 1 && !rowData.mapped && !rowData.isSynthetic) {
               cellData.cell.styles.textColor = [148, 163, 184] // slate-400
               cellData.cell.styles.fontStyle = 'italic'
            }
          }
        }
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
