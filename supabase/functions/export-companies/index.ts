import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { jsPDF } from 'npm:jspdf@2.5.1'

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
      let csv = 'Relatorio de Empresas\n\nNome,CNPJ,CPF,Status,Telefone,Email,Data Criacao\n'
      data.forEach((r: any) => {
        csv += `"${r.name}","${r.cnpj || ''}","${r.cpf || ''}","${r.status ? 'Ativo' : 'Inativo'}","${r.phone || ''}","${r.email || ''}","${r.created_at}"\n`
      })
      return new Response(JSON.stringify({ csv }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (format === 'pdf') {
      const doc = new jsPDF()
      doc.setFontSize(16)
      doc.text('Relatorio de Empresas', 14, 20)

      doc.setFontSize(10)
      let y = 35

      const checkPage = () => {
        if (y > 280) {
          doc.addPage()
          y = 20
        }
      }

      data.forEach((r: any) => {
        doc.text(`Nome: ${r.name} | Status: ${r.status ? 'Ativo' : 'Inativo'}`, 14, y)
        y += 6
        checkPage()
        doc.text(`CNPJ: ${r.cnpj || 'N/A'} | CPF: ${r.cpf || 'N/A'}`, 14, y)
        y += 6
        checkPage()
        doc.text(`Tel: ${r.phone || 'N/A'} | Email: ${r.email || 'N/A'}`, 14, y)
        y += 6
        checkPage()
        doc.text(`Endereço: ${r.address || 'N/A'}`, 14, y)
        y += 8
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
