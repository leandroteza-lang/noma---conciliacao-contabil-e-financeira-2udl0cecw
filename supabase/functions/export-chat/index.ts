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

function parseMarkdownToBlocks(content: string) {
  const lines = content.split('\n')
  const blocks: any[] = []
  let currentText = ''
  let inTable = false
  let tableHeaders: string[] = []
  let tableRows: string[][] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (line.startsWith('|') && line.endsWith('|')) {
      if (!inTable) {
        if (currentText) {
          blocks.push({ type: 'text', content: currentText.trim() })
          currentText = ''
        }
        inTable = true
        tableHeaders = line
          .split('|')
          .map((c) => c.trim())
          .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1)
      } else {
        if (line.replace(/[\|\-\s:]/g, '').length === 0) continue
        tableRows.push(
          line
            .split('|')
            .map((c) => c.trim())
            .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1),
        )
      }
    } else {
      if (inTable) {
        blocks.push({ type: 'table', headers: tableHeaders, rows: tableRows })
        inTable = false
        tableHeaders = []
        tableRows = []
      }
      currentText += lines[i] + '\n'
    }
  }
  if (currentText) blocks.push({ type: 'text', content: currentText.trim() })
  if (inTable) blocks.push({ type: 'table', headers: tableHeaders, rows: tableRows })

  return blocks
}

// Clean markdown links and bold formatting for export
function stripMarkdown(text: string) {
  return String(text)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Cabeçalho de autorização ausente')

    const { format, messages } = await req.json()

    if (format === 'excel') {
      const aoa: any[][] = []
      messages.forEach((m: any) => {
        const sender = m.role === 'user' ? 'Você' : 'NOMA'
        aoa.push([sender])

        const blocks = parseMarkdownToBlocks(m.content)
        blocks.forEach((b) => {
          if (b.type === 'text') {
            aoa.push([stripMarkdown(b.content)])
          } else if (b.type === 'table') {
            aoa.push(b.headers.map(stripMarkdown))
            b.rows.forEach((r: any) => aoa.push(r.map(stripMarkdown)))
          }
        })
        aoa.push([])
      })

      const worksheet = XLSX.utils.aoa_to_sheet(aoa)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Chat')
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'base64' })
      return new Response(JSON.stringify({ excel: excelBuffer }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (format === 'pdf') {
      const doc = new jsPDF()
      doc.setFontSize(16)
      doc.text('Histórico de Conversa - Assistente NOMA', 14, 20)
      doc.setFontSize(10)

      const now = new Date().toLocaleString('pt-BR')
      doc.setFontSize(9)
      doc.setTextColor(100)
      doc.text(`Gerado em ${now}`, 14, 26)
      doc.setTextColor(0)

      let currentY = 35

      messages.forEach((m: any) => {
        if (currentY > 270) {
          doc.addPage()
          currentY = 20
        }

        const sender = m.role === 'user' ? 'Você' : 'Assistente NOMA'
        doc.setFontSize(11)
        doc.setFont('helvetica', 'bold')

        if (m.role === 'user') {
          doc.setTextColor(79, 70, 229) // indigo-600
        } else {
          doc.setTextColor(30, 41, 59) // slate-800
        }

        doc.text(sender, 14, currentY)
        currentY += 6

        doc.setTextColor(0)
        doc.setFontSize(10)

        const blocks = parseMarkdownToBlocks(m.content)
        blocks.forEach((b) => {
          if (b.type === 'text') {
            doc.setFont('helvetica', 'normal')
            const cleanText = stripMarkdown(b.content)
            const lines = doc.splitTextToSize(cleanText, 180)
            if (currentY + lines.length * 5 > 280) {
              doc.addPage()
              currentY = 20
            }
            doc.text(lines, 14, currentY)
            currentY += lines.length * 5 + 4
          } else if (b.type === 'table') {
            autoTable(doc, {
              startY: currentY,
              head: [b.headers.map(stripMarkdown)],
              body: b.rows.map((r: any) => r.map(stripMarkdown)),
              theme: 'grid',
              headStyles: { fillColor: [30, 27, 75] }, // indigo-950
              styles: { fontSize: 8 },
              margin: { left: 14 },
            })
            currentY = (doc as any).lastAutoTable.finalY + 8
          }
        })
        currentY += 4
      })

      const pdf = doc.output('datauristring')
      return new Response(JSON.stringify({ pdf }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (format === 'txt') {
      let txt = 'Histórico de Conversa - Assistente NOMA\n=========================================\n\n'
      messages.forEach((m: any) => {
        const sender = m.role === 'user' ? 'Você' : 'NOMA'
        txt += `[${sender}]:\n`
        const blocks = parseMarkdownToBlocks(m.content)
        blocks.forEach((b) => {
          if (b.type === 'text') {
            txt += stripMarkdown(b.content) + '\n'
          } else if (b.type === 'table') {
            txt += b.headers.map(stripMarkdown).join(' | ') + '\n'
            txt += b.headers.map(() => '---').join('-|-') + '\n'
            b.rows.forEach((r: any) => {
              txt += r.map(stripMarkdown).join(' | ') + '\n'
            })
            txt += '\n'
          }
        })
        txt += '\n-----------------------------------------\n\n'
      })
      return new Response(JSON.stringify({ txt }), {
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
