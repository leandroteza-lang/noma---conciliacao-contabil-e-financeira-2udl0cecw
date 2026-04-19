import { memo } from 'react'
import { TableRow, TableCell } from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertCircle, ListTree, ChevronDown, ChevronRight, Unlink } from 'lucide-react'
import { AccountCombobox } from '@/components/AccountCombobox'
import { cn } from '@/lib/utils'

export const MappingRow = memo(function MappingRow({
  cc,
  index,
  isSelected,
  isExpanded,
  isGroupCollapsed,
  enrichedCAs,
  onToggleCC,
  onToggleExpand,
  onToggleGroup,
  onMap,
  onRemove,
}: any) {
  const getRowStyle = (cc: any) => {
    if (cc.isSynthetic) {
      const code = cc.code || ''
      const level = (code.match(/\./g) || []).length + 1

      if (level === 1) return 'bg-indigo-950 font-bold text-white'
      if (level === 2) return 'bg-blue-800 font-semibold text-white'
      if (level === 3) return 'bg-blue-500 font-medium text-white'
      if (level === 4) return 'bg-blue-200 font-medium text-blue-950'
      return 'bg-blue-50 font-medium text-blue-900'
    }

    return 'bg-white font-normal text-slate-700'
  }

  return (
    <TableRow className={cn('transition-colors border-b border-slate-100', getRowStyle(cc))}>
      <TableCell className="p-1.5 px-4 w-[40px] border-r border-slate-200/40 align-middle text-center">
        {!cc.isSynthetic && (
          <div className="flex justify-center">
            <Checkbox
              checked={isSelected}
              disabled={cc.ccPendingDeletion}
              onCheckedChange={() => onToggleCC(cc.id)}
            />
          </div>
        )}
      </TableCell>

      {cc.isSynthetic && !cc.mappingId ? (
        <>
          <TableCell className="p-1.5 border-r border-slate-200/40 align-middle max-w-0">
            <div
              className="flex items-center justify-start gap-2 w-full min-w-0"
              style={{ paddingLeft: cc.level > 0 ? `${cc.level * 1.25}rem` : undefined }}
            >
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => onToggleGroup(cc.id)}
                  className="w-5 h-5 flex items-center justify-center rounded hover:bg-white/20 text-inherit transition-colors"
                  title={isGroupCollapsed ? 'Expandir grupo' : 'Recolher grupo'}
                >
                  {isGroupCollapsed ? (
                    <ChevronRight className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>
                <Badge
                  variant="outline"
                  className="w-5 h-5 p-0 flex items-center justify-center shrink-0 rounded text-[10px] font-bold border-0 bg-white/20 text-inherit"
                  title="Conta Sintética"
                >
                  S
                </Badge>
              </div>
              <div className="flex flex-col overflow-hidden text-left cursor-default w-full min-w-0">
                <div className="flex items-center justify-start gap-2 truncate w-full min-w-0">
                  <span className="font-mono text-[11px] font-semibold whitespace-nowrap shrink-0">
                    {cc.code}
                  </span>
                  <span className="text-xs truncate font-medium">{cc.description}</span>
                </div>
              </div>
            </div>
          </TableCell>
          <TableCell className="p-1.5 px-2 pr-4 align-middle max-w-0">
            <div className="flex justify-end shrink-0 w-full">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onToggleGroup(cc.id)}
                className={cn(
                  'h-8 px-3 text-xs font-medium transition-colors border-0',
                  ((cc.code || '').match(/\./g) || []).length + 1 <= 3
                    ? 'bg-white/10 text-white hover:bg-white/20 hover:text-white'
                    : 'bg-black/5 text-blue-950 hover:bg-black/10 hover:text-blue-950',
                )}
              >
                {isGroupCollapsed ? (
                  <ChevronRight className="h-3.5 w-3.5 mr-1" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5 mr-1" />
                )}
                {isGroupCollapsed ? 'Expandir' : 'Recolher'}
              </Button>
            </div>
          </TableCell>
        </>
      ) : (
        <>
          <TableCell className="p-1.5 border-r border-slate-200/40 align-middle max-w-0">
            <div
              className="flex items-center justify-start gap-2 w-full min-w-0"
              style={{ paddingLeft: cc.level > 0 ? `${cc.level * 1.25}rem` : undefined }}
            >
              <div className="flex items-center gap-1 shrink-0">
                {cc.isSynthetic ? (
                  <button
                    onClick={() => onToggleGroup(cc.id)}
                    className="w-5 h-5 flex items-center justify-center rounded hover:bg-white/20 text-inherit transition-colors"
                    title={isGroupCollapsed ? 'Expandir grupo' : 'Recolher grupo'}
                  >
                    {isGroupCollapsed ? (
                      <ChevronRight className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>
                ) : (
                  <div className="w-5 h-5" />
                )}
                <Badge
                  variant="outline"
                  className={cn(
                    'w-5 h-5 p-0 flex items-center justify-center shrink-0 rounded text-[10px] font-bold border-0',
                    cc.isSynthetic ? 'bg-white/20 text-inherit' : 'bg-blue-50 text-blue-600',
                  )}
                  title={cc.isSynthetic ? 'Conta Sintética' : 'Conta Analítica'}
                >
                  {cc.isSynthetic ? 'S' : 'A'}
                </Badge>
              </div>
              <div className="flex flex-col overflow-hidden text-left cursor-default w-full min-w-0">
                <div className="flex items-center justify-start gap-2 truncate w-full min-w-0">
                  <span className="font-mono text-[11px] font-semibold whitespace-nowrap shrink-0">
                    {cc.code}
                  </span>
                  <span className="text-xs truncate font-medium">{cc.description}</span>
                  {!cc.mappingId && !cc.isSynthetic && (
                    <AlertCircle className="h-3 w-3 text-amber-500 shrink-0" />
                  )}
                </div>
              </div>
            </div>
          </TableCell>
          <TableCell className="p-1.5 px-2 pr-4 align-middle max-w-0">
            <div className="flex flex-col gap-1 w-full min-w-0">
              <div className="flex items-center gap-2 w-full min-w-0">
                <div className="flex-1 min-w-0 flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <AccountCombobox
                      accounts={enrichedCAs}
                      value={cc.mappedCa?.id}
                      disabled={cc.pendingDeletion}
                      onChange={(caId) => {
                        const selectedId = typeof caId === 'object' ? (caId as any)?.id : caId
                        if (selectedId) {
                          onMap(cc.id, selectedId, cc.mappingId)
                        } else {
                          if (cc.mappingId) onRemove(cc.mappingId)
                        }
                      }}
                      onClear={
                        cc.mappingId && !cc.pendingDeletion
                          ? () => onRemove(cc.mappingId)
                          : undefined
                      }
                    />
                  </div>
                  {cc.ccPendingDeletion && (
                    <Badge
                      variant="outline"
                      className="bg-red-50 text-red-600 border-red-200 whitespace-nowrap shrink-0 text-[10px] h-8 flex items-center px-2 shadow-sm mr-2"
                    >
                      CC em Exclusão
                    </Badge>
                  )}
                  {cc.pendingDeletion && !cc.ccPendingDeletion && (
                    <Badge
                      variant="outline"
                      className="bg-orange-50 text-orange-600 border-orange-200 whitespace-nowrap shrink-0 text-[10px] h-8 flex items-center px-2 shadow-sm mr-2"
                    >
                      Desvínculo Pendente
                    </Badge>
                  )}
                  {cc.mappingId && !cc.pendingDeletion && !cc.ccPendingDeletion && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onRemove(cc.mappingId)}
                      className="h-9 px-2 shrink-0 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 shadow-sm ml-2"
                      title="Desvincular"
                    >
                      <Unlink className="h-4 w-4" />
                      <span className="sr-only">Desvincular</span>
                    </Button>
                  )}
                </div>
                {cc.mappedCa &&
                  cc.mappedCa.hierarchyArray &&
                  cc.mappedCa.hierarchyArray.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onToggleExpand(cc.id)}
                      className={cn(
                        'h-9 px-3 text-xs font-medium shrink-0 transition-colors shadow-sm',
                        isExpanded
                          ? 'bg-slate-100 text-slate-800 border-slate-300'
                          : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200',
                      )}
                      title="Ver raiz da conta"
                    >
                      <ListTree className="h-3.5 w-3.5 mr-1" />
                      {isExpanded ? 'Recolher' : 'Expandir'}
                    </Button>
                  )}
              </div>

              {isExpanded && cc.mappedCa && cc.mappedCa.hierarchyArray && (
                <div className="mt-2 mb-2 rounded-md overflow-hidden border border-slate-200 shadow-sm animate-in fade-in slide-in-from-top-1">
                  <div className="bg-slate-50 px-2 py-1.5 border-b border-slate-200">
                    <span className="text-[9px] font-bold uppercase text-slate-500 tracking-wider">
                      Raiz Hierárquica
                    </span>
                  </div>
                  <div className="flex flex-col">
                    {cc.mappedCa.hierarchyArray.map((node: any) => {
                      const code = node.classification || node.account_code || ''
                      const level = (code.match(/\./g) || []).length + 1

                      let rowClass = 'bg-white font-normal text-slate-700'
                      let badgeClass = 'bg-slate-100 text-slate-600 border-slate-200'

                      if (node.account_level === 'Sintética') {
                        if (level === 1) {
                          rowClass = 'bg-indigo-950 font-bold text-white'
                          badgeClass = 'bg-indigo-900 text-white border-indigo-800'
                        } else if (level === 2) {
                          rowClass = 'bg-blue-800 font-semibold text-white'
                          badgeClass = 'bg-blue-700 text-white border-blue-600'
                        } else if (level === 3) {
                          rowClass = 'bg-blue-500 font-medium text-white'
                          badgeClass = 'bg-blue-600 text-white border-blue-500'
                        } else if (level === 4) {
                          rowClass = 'bg-blue-200 font-medium text-blue-950'
                          badgeClass = 'bg-blue-300 text-blue-950 border-blue-400'
                        } else {
                          rowClass = 'bg-blue-50 font-medium text-blue-900'
                          badgeClass = 'bg-blue-200 text-blue-900 border-blue-300'
                        }
                      }

                      return (
                        <div
                          key={node.id}
                          className={cn(
                            'flex items-center justify-start gap-2 px-2 py-1.5 transition-colors border-b border-slate-100/50 last:border-0',
                            rowClass,
                          )}
                        >
                          <span
                            className={cn(
                              'font-mono text-[10px] px-1.5 py-0.5 rounded border shadow-sm shrink-0',
                              badgeClass,
                            )}
                          >
                            {code}
                          </span>
                          <span className="text-[11px] truncate font-medium">
                            {node.account_name}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </TableCell>
        </>
      )}
    </TableRow>
  )
})
