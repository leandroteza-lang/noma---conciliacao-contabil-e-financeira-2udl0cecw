import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { jsPDF } from 'npm:jspdf@2.5.1'
import autoTable from 'npm:jspdf-autotable@3.8.2'
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

    if (format === 'pdf') {
      const doc = new jsPDF('landscape')
      doc.setFontSize(16)
      doc.text('Relatório de Usuários', 14, 20)

      const body = data.map((r: any) => [
        r.name,
        r.email || '-',
        r.role === 'admin'
          ? 'Administrador'
          : r.role === 'supervisor'
            ? 'Supervisor'
            : r.role === 'client_user'
              ? 'Usuário Cliente'
              : 'Colaborador',
        r.department || '-',
        r.approval_status === 'pending' ? 'Em Aprovação' : r.status ? 'Ativo' : 'Inativo',
      ])

      autoTable(doc, {
        startY: 25,
        head: [['Nome', 'Email', 'Perfil', 'Departamento', 'Status']],
        body: body,
        theme: 'grid',
        headStyles: { fillColor: [220, 38, 38] },
        styles: { fontSize: 9 },
      })

      const pdf = doc.output('datauristring')
      return new Response(JSON.stringify({ pdf }), {
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
        csvContent += `"${r.name || ''}";"${r.cpf || ''}";"${r.email || ''}";"${r.phone || ''}";"${r.address || ''}";"${r.department || ''}";"${perfil}";"${status}";"${r.created_at || ''}"\n`
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
        txtContent += `Departamento: ${r.department || '-'}\n`
        txtContent += `Perfil: ${perfil}\n`
        txtContent += `Status: ${status}\n`
        txtContent += `Data Criação: ${r.created_at || '-'}\n`
        txtContent += '-----------------------------------------\n'
      })
      return new Response(JSON.stringify({ txt: txtContent }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    throw new Error('Formato inválido. Use "excel", "pdf", "csv" ou "txt".')
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
