import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { jsPDF } from 'npm:jspdf@2.5.1'
import * as XLSX from 'npm:xlsx@0.18.5'

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
          Departamento: r.department || '',
          Perfil:
            r.role === 'admin'
              ? 'Administrador'
              : r.role === 'supervisor'
                ? 'Supervisor'
                : r.role === 'client_user'
                  ? 'Usuário Cliente'
                  : 'Colaborador',
          Status: r.status ? 'Ativo' : 'Inativo',
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

    if (format === 'pdf') {
      const doc = new jsPDF()
      doc.setFontSize(16)
      doc.text('Relatório de Usuários', 14, 20)

      doc.setFontSize(10)
      let y = 35

      const checkPage = () => {
        if (y > 280) {
          doc.addPage()
          y = 20
        }
      }

      data.forEach((r: any) => {
        doc.text(
          `Nome: ${r.name} | CPF: ${r.cpf || '-'} | Status: ${r.status ? 'Ativo' : 'Inativo'}`,
          14,
          y,
        )
        y += 6
        checkPage()
        doc.text(`Email: ${r.email || '-'} | Telefone: ${r.phone || '-'}`, 14, y)
        y += 6
        checkPage()
        doc.text(`Endereço: ${r.address || '-'}`, 14, y)
        y += 6
        checkPage()
        doc.text(`Departamento: ${r.department || '-'} | Perfil: ${r.role || '-'}`, 14, y)
        y += 10
        checkPage()
      })

      const pdf = doc.output('datauristring')
      return new Response(JSON.stringify({ pdf }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    throw new Error('Formato inválido. Use "excel" ou "pdf".')
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
