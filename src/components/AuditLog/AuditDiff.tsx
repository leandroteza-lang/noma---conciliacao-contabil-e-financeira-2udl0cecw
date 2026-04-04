import React from 'react'
import { cn } from '@/lib/utils'

interface DiffProps {
  fieldName: string
  oldValue: string | null
  newValue: string | null
}

export const AuditDiff: React.FC<DiffProps> = ({ fieldName, oldValue, newValue }) => {
  const oldLines = (oldValue || '').split('\n').filter(Boolean)
  const newLines = (newValue || '').split('\n').filter(Boolean)

  const renderDiffLine = (line: string, type: 'old' | 'new', key: string) => {
    const isChanged =
      (type === 'old' && !newLines.includes(line)) || (type === 'new' && !oldLines.includes(line))

    return (
      <div
        key={key}
        className={cn(
          'p-1.5 rounded-sm font-mono text-xs flex items-start gap-2',
          isChanged
            ? type === 'old'
              ? 'bg-red-500/10 text-red-700 dark:text-red-300'
              : 'bg-green-500/10 text-green-700 dark:text-green-300'
            : 'bg-muted/50 text-muted-foreground',
        )}
      >
        <span
          className={cn(
            'font-bold select-none shrink-0 w-4',
            type === 'old' ? 'text-red-500' : 'text-green-500',
          )}
        >
          {type === 'old' ? '-' : '+'}
        </span>
        <span className="break-all flex-1">{line || (type === 'old' ? '(vazio)' : '(vazio)')}</span>
      </div>
    )
  }

  return (
    <div className="bg-card text-card-foreground p-4 rounded-lg border shadow-sm h-full">
      <div className="mb-3 border-b pb-2 flex items-center gap-2">
        <span className="text-muted-foreground text-sm font-medium">Campo:</span>
        <span className="font-bold text-sm bg-muted px-2 py-0.5 rounded">{fieldName}</span>
      </div>

      <div className="space-y-1">
        {oldLines.length > 0
          ? oldLines.map((line, idx) => renderDiffLine(line, 'old', `old-${idx}`))
          : renderDiffLine('', 'old', 'old-empty')}

        <div className="text-muted-foreground/50 text-center py-1.5 select-none text-xs tracking-widest font-mono">
          ---
        </div>

        {newLines.length > 0
          ? newLines.map((line, idx) => renderDiffLine(line, 'new', `new-${idx}`))
          : renderDiffLine('', 'new', 'new-empty')}
      </div>

      <div className="mt-4 pt-3 border-t text-xs text-muted-foreground flex justify-between">
        <span className="flex items-center gap-1.5">
          <span className="text-red-500 font-bold bg-red-500/10 px-1 rounded">-</span>{' '}
          Removido/Alterado
        </span>
        <span className="flex items-center gap-1.5">
          <span className="text-green-500 font-bold bg-green-500/10 px-1 rounded">+</span>{' '}
          Adicionado/Novo
        </span>
      </div>
    </div>
  )
}
