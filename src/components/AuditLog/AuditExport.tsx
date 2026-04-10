import React from 'react'
import { FileText, Download, FileSpreadsheet } from 'lucide-react'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import { Button } from '@/components/ui/button'

interface ExportProps {
  logs: any[]
  entityType: string
}

export const AuditExport: React.FC<ExportProps> = ({ logs, entityType }) => {
  const prepareDataForExport = () => {
    return logs.flatMap((log) =>
      log.audit_details && log.audit_details.length > 0
        ? log.audit_details.map((detail: any) => ({
            'Data/Hora': new Date(log.performed_at).toLocaleString('pt-BR'),
            Ação: log.action,
            'Quem Fez': log.performed_by_user?.email || 'Sistema',
            Campo: detail.field_name,
            'Valor Anterior': detail.old_value || '(vazio)',
            'Valor Novo': detail.new_value || '(vazio)',
            IP: log.ip_address || 'N/A',
            Localização: `${log.city || 'N/A'}, ${log.country || 'N/A'}`,
            Dispositivo: log.device_type || 'N/A',
            'Session ID': log.session_id || 'N/A',
            'User Agent': log.user_agent || 'N/A',
            'ID Entidade': log.entity_id || 'N/A',
            'ID Log': log.id || 'N/A',
          }))
        : [
            {
              'Data/Hora': new Date(log.performed_at).toLocaleString('pt-BR'),
              Ação: log.action,
              'Quem Fez': log.performed_by_user?.email || 'Sistema',
              Campo: 'N/A',
              'Valor Anterior': 'N/A',
              'Valor Novo': 'N/A',
              IP: log.ip_address || 'N/A',
              Localização: `${log.city || 'N/A'}, ${log.country || 'N/A'}`,
              Dispositivo: log.device_type || 'N/A',
              'Session ID': log.session_id || 'N/A',
              'User Agent': log.user_agent || 'N/A',
              'ID Entidade': log.entity_id || 'N/A',
              'ID Log': log.id || 'N/A',
            },
          ],
    )
  }

  const downloadFile = (content: string | Blob, filename: string, type: string) => {
    const blob = new Blob([content], { type })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const exportCSV = () => {
    const data = prepareDataForExport()
    if (data.length === 0) return
    const headers = Object.keys(data[0])
    const csv = [
      headers.map((h) => `"${h}"`).join(','),
      ...data.map((row) =>
        headers.map((h) => `"${String((row as any)[h] || '').replace(/"/g, '""')}"`).join(','),
      ),
    ].join('\n')
    downloadFile(csv, `auditoria-${entityType}-${Date.now()}.csv`, 'text/csv;charset=utf-8;')
  }

  const exportPDF = () => {
    const data = prepareDataForExport()
    if (data.length === 0) return
    const doc = new jsPDF('landscape')
    doc.setFontSize(16)
    doc.text(`Relatório de Auditoria: ${entityType}`, 14, 15)
    doc.setFontSize(10)
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 25)

    const tableData = data.map((row) => Object.values(row))
    const tableHeaders = Object.keys(data[0] || {})

    ;(doc as any).autoTable({
      head: [tableHeaders.slice(0, 9)], // Limit columns to fit in PDF horizontally
      body: tableData.map((r) => r.slice(0, 9)),
      startY: 35,
      styles: { fontSize: 7, cellPadding: 2, overflow: 'linebreak' },
      headStyles: { fillColor: [220, 38, 38], textColor: [255, 255, 255] },
      margin: { top: 30, left: 10, right: 10, bottom: 10 },
    })

    doc.save(`auditoria-${entityType}-${Date.now()}.pdf`)
  }

  const exportXLSX = () => {
    const data = prepareDataForExport()
    if (data.length === 0) return
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Auditoria')
    XLSX.writeFile(wb, `auditoria-${entityType}-${Date.now()}.xlsx`)
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        onClick={exportCSV}
        variant="outline"
        size="sm"
        className="gap-2"
        disabled={logs.length === 0}
      >
        <FileText className="w-4 h-4 text-green-600" /> CSV
      </Button>
      <Button
        onClick={exportPDF}
        variant="outline"
        size="sm"
        className="gap-2"
        disabled={logs.length === 0}
      >
        <Download className="w-4 h-4 text-red-600" /> PDF
      </Button>
      <Button
        onClick={exportXLSX}
        variant="outline"
        size="sm"
        className="gap-2"
        disabled={logs.length === 0}
      >
        <FileSpreadsheet className="w-4 h-4 text-blue-600" /> Excel
      </Button>
    </div>
  )
}
