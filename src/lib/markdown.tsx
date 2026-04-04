import React from 'react'
import { Link } from 'react-router-dom'

export const processInline = (text: string) => {
  const parts = text.split(/(\[.*?\]\(.*?\))/g)
  return parts.map((part, i) => {
    const linkMatch = part.match(/\[(.*?)\]\((.*?)\)/)
    if (linkMatch) {
      const label = linkMatch[1].replace(/\*\*/g, '').replace(/\*/g, '')
      const url = linkMatch[2]
      if (url.startsWith('/')) {
        return (
          <Link
            key={i}
            to={url}
            className="inline-flex items-center justify-center gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-1.5 rounded-md no-underline font-medium transition-colors my-1.5 shadow-sm text-sm w-fit"
          >
            {label}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </Link>
        )
      }
      return (
        <a
          key={i}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="underline text-primary hover:text-primary/80 transition-colors"
        >
          {label}
        </a>
      )
    }

    const subParts = part.split(/(\*\*.*?\*\*|\*.*?\*)/g)
    return subParts.map((subPart, j) => {
      if (subPart.startsWith('**') && subPart.endsWith('**')) {
        return (
          <strong key={j} className="font-semibold">
            {subPart.slice(2, -2)}
          </strong>
        )
      }
      if (subPart.startsWith('*') && subPart.endsWith('*')) {
        return <em key={j}>{subPart.slice(1, -1)}</em>
      }
      return <span key={j}>{subPart}</span>
    })
  })
}

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const MarkdownTable = ({
  headers,
  rows,
  processInline,
}: {
  headers: string[]
  rows: string[][]
  processInline: (text: string) => React.ReactNode
}) => {
  const [currentPage, setCurrentPage] = useState(1)
  const totalRows = rows.length
  const rowsPerPage = 10
  const totalPages = Math.ceil(totalRows / rowsPerPage)

  const currentRows = rows.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)

  const handlePrev = () => setCurrentPage((p) => Math.max(1, p - 1))
  const handleNext = () => setCurrentPage((p) => Math.min(totalPages, p + 1))

  return (
    <div className="my-4 w-full flex flex-col gap-3">
      <div className="flex flex-col gap-3 w-full overflow-y-auto max-h-[500px] custom-scrollbar pr-2">
        {currentRows.map((row, i) => (
          <div
            key={i}
            className="flex flex-col gap-1.5 p-3.5 rounded-lg bg-card border shadow-sm text-sm break-words w-full"
          >
            <div className="font-bold text-primary mb-2 flex items-center gap-2">
              📄 Registro {(currentPage - 1) * rowsPerPage + i + 1}
            </div>
            <div className="flex flex-col gap-2 w-full">
              {headers.map((h, j) => {
                const val = row[j] || ''
                if (!val.trim() || val.trim() === '-') return null
                return (
                  <div
                    key={j}
                    className="flex flex-col sm:flex-row sm:gap-2 items-start break-words w-full"
                  >
                    <span className="font-semibold text-muted-foreground shrink-0 flex items-center gap-1.5">
                      🔹 {processInline(h)}:
                    </span>
                    <span className="text-foreground break-words flex-1 w-full">
                      {processInline(val)}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-1 py-2 text-xs text-muted-foreground shrink-0 w-full border-t border-border/40 mt-1">
          <div>Total: {totalRows} registros</div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 px-3 text-xs rounded-full"
              onClick={handlePrev}
              disabled={currentPage === 1}
            >
              Anterior
            </Button>
            <span className="font-medium">
              Página {currentPage} de {totalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 px-3 text-xs rounded-full"
              onClick={handleNext}
              disabled={currentPage === totalPages}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export const renderMarkdown = (text: string) => {
  const lines = text.split('\n')
  const elements: React.ReactNode[] = []
  let inTable = false
  let tableHeaders: string[] = []
  let tableRows: string[][] = []

  const flushTable = () => {
    if (inTable) {
      if (tableHeaders.length > 0) {
        elements.push(
          <MarkdownTable
            key={`table-${elements.length}`}
            headers={tableHeaders}
            rows={tableRows}
            processInline={processInline}
          />,
        )
      }
      inTable = false
      tableHeaders = []
      tableRows = []
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimLine = line.trim()

    if (!trimLine) {
      flushTable()
      elements.push(<div key={`br-${i}`} className="h-2" />)
      continue
    }

    const isTableLine = trimLine.includes('|')
    const isSeparator = isTableLine && trimLine.replace(/[|\-\s:]/g, '').length === 0

    if (isTableLine) {
      let cleaned = trimLine
      if (cleaned.startsWith('|')) cleaned = cleaned.slice(1)
      if (cleaned.endsWith('|')) cleaned = cleaned.slice(0, -1)
      const cells = cleaned.split('|').map((c) => c.trim())

      if (isSeparator) {
        inTable = true
        continue
      }

      if (!inTable) {
        const nextLine = lines[i + 1]?.trim() || ''
        const nextIsSeparator =
          nextLine.includes('|') && nextLine.replace(/[|\-\s:]/g, '').length === 0

        if (nextIsSeparator) {
          inTable = true
          tableHeaders = cells
        } else {
          elements.push(
            <div key={`text-${i}`} className="min-h-[1.25rem] break-words">
              {processInline(trimLine)}
            </div>,
          )
        }
      } else {
        tableRows.push(cells)
      }
    } else {
      flushTable()
      if (trimLine.startsWith('### ')) {
        elements.push(
          <h3 key={`h3-${i}`} className="font-semibold text-[15px] mt-2 mb-1">
            {processInline(trimLine.slice(4))}
          </h3>,
        )
      } else if (trimLine.startsWith('## ')) {
        elements.push(
          <h2 key={`h2-${i}`} className="font-bold text-base mt-3 mb-1">
            {processInline(trimLine.slice(3))}
          </h2>,
        )
      } else if (trimLine.startsWith('# ')) {
        elements.push(
          <h1 key={`h1-${i}`} className="font-bold text-lg mt-4 mb-2">
            {processInline(trimLine.slice(2))}
          </h1>,
        )
      } else if (trimLine.match(/^[-*]\s/)) {
        elements.push(
          <div key={`li-${i}`} className="ml-3 flex gap-2">
            <span className="select-none text-muted-foreground">•</span>
            <span className="flex-1">{processInline(trimLine.slice(2))}</span>
          </div>,
        )
      } else {
        const numberedListMatch = trimLine.match(/^(\d+\.\s)(.*)/)
        if (numberedListMatch) {
          elements.push(
            <div key={`li-num-${i}`} className="ml-3 flex gap-2">
              <span className="select-none min-w-[1.2rem] text-muted-foreground">
                {numberedListMatch[1].trim()}
              </span>
              <span className="flex-1">{processInline(numberedListMatch[2])}</span>
            </div>,
          )
        } else {
          elements.push(
            <div key={`text-${i}`} className="min-h-[1.25rem] break-words">
              {processInline(trimLine)}
            </div>,
          )
        }
      }
    }
  }

  flushTable()

  return (
    <div className="flex flex-col gap-1 text-[13px] leading-relaxed break-words w-full min-w-0">
      {elements}
    </div>
  )
}
