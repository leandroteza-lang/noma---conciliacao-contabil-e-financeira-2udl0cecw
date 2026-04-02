import { Trash2, Building } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Account, Organization } from '@/types'
import { cn } from '@/lib/utils'

interface Props {
  accounts: Account[]
  organizations: Organization[]
  onDelete: (id: string) => void
  onUpdateInline?: (id: string, field: keyof Account, value: string) => Promise<boolean>
}

const getTheme = (name: string | null | undefined) => {
  const n = name?.toUpperCase() || ''
  if (n.includes('NOMA PARTS'))
    return { badge: 'bg-blue-100 text-blue-800', border: 'border-blue-500' }
  if (n.includes('LS ALMEIDA'))
    return { badge: 'bg-yellow-100 text-yellow-800', border: 'border-yellow-500' }
  if (n.includes('NOMA SERVICE'))
    return { badge: 'bg-orange-100 text-orange-800', border: 'border-orange-500' }
  if (n.includes('PF'))
    return { badge: 'bg-purple-100 text-purple-800', border: 'border-purple-500' }
  return { badge: 'bg-slate-100 text-slate-800', border: 'border-slate-500' }
}

function EditableCell({
  value,
  field,
  isEditing,
  onEditStart,
  onEditCommit,
  onEditCancel,
  organizations,
}: any) {
  const [tempVal, setTempVal] = useState(value)
  const inputRef = useRef<any>(null)

  useEffect(() => {
    if (isEditing) {
      setTempVal(value)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isEditing, value])

  const handleBlur = () => onEditCommit(tempVal)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') onEditCommit(tempVal)
    if (e.key === 'Escape') onEditCancel()
  }

  if (!isEditing) {
    if (field === 'organization_id') {
      const org = organizations.find((o: Organization) => o.id === value)
      const theme = getTheme(org?.name)
      return (
        <div
          className="cursor-pointer hover:bg-slate-100/50 p-1 -m-1 rounded min-h-[28px] flex items-center"
          onClick={onEditStart}
        >
          <Badge
            variant="outline"
            className={cn('py-0.5 whitespace-nowrap shadow-sm', theme.badge)}
          >
            {org?.name || 'Desconhecida'}
          </Badge>
        </div>
      )
    }

    return (
      <div
        className="cursor-pointer hover:bg-slate-100/50 p-1 -m-1 rounded min-h-[28px] flex items-center"
        onClick={onEditStart}
      >
        {field === 'classificacao' ? (
          <Badge
            variant="secondary"
            className="bg-slate-100 text-slate-600 font-normal hover:bg-slate-200"
          >
            {value}
          </Badge>
        ) : (
          value || <span className="text-slate-300 italic text-xs">Vazio</span>
        )}
      </div>
    )
  }

  if (field === 'organization_id') {
    return (
      <select
        ref={inputRef}
        value={tempVal}
        onChange={(e) => setTempVal(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="w-full text-sm border border-blue-400 rounded p-1 outline-none ring-2 ring-blue-500/20 bg-white"
      >
        <option value="">Selecione...</option>
        {organizations.map((org: Organization) => (
          <option key={org.id} value={org.id}>
            {org.name}
          </option>
        ))}
      </select>
    )
  }

  return (
    <Input
      ref={inputRef}
      value={tempVal}
      onChange={(e) => setTempVal(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className="h-7 py-1 px-2 text-sm border-blue-400 focus-visible:ring-blue-500 min-w-[100px]"
    />
  )
}

export function AccountList({ accounts, organizations, onDelete, onUpdateInline }: Props) {
  const [editing, setEditing] = useState<{ id: string; field: keyof Account } | null>(null)

  const handleEditCommit = async (id: string, field: keyof Account, val: string) => {
    if (!val && field !== 'organization_id') {
      // Optional: add validation here if needed, but proceeding with empty string if intended
    }
    if (onUpdateInline) {
      await onUpdateInline(id, field, val)
    }
    setEditing(null)
  }

  if (accounts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-slate-500 bg-white rounded-xl border border-dashed border-slate-300 shadow-sm animate-in fade-in">
        <div className="bg-slate-100 p-4 rounded-full mb-4">
          <Building className="h-8 w-8 text-slate-400" />
        </div>
        <p className="text-lg font-semibold text-slate-700">Nenhuma conta encontrada</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="hidden lg:block rounded-xl border bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/80">
              <TableHead className="w-[180px]">Empresa</TableHead>
              <TableHead>Conta Contábil</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Banco</TableHead>
              <TableHead>Agência</TableHead>
              <TableHead>Número Conta</TableHead>
              <TableHead>Classificação</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {accounts.map((acc) => (
              <TableRow key={acc.id} className="group hover:bg-slate-50/50">
                {(
                  [
                    'organization_id',
                    'contaContabil',
                    'descricao',
                    'banco',
                    'agencia',
                    'numeroConta',
                    'classificacao',
                  ] as const
                ).map((field) => (
                  <TableCell
                    key={field}
                    className={field === 'contaContabil' ? 'font-mono text-xs' : ''}
                  >
                    <EditableCell
                      value={acc[field]}
                      field={field}
                      organizations={organizations}
                      isEditing={editing?.id === acc.id && editing?.field === field}
                      onEditStart={() => setEditing({ id: acc.id, field })}
                      onEditCommit={(val: string) =>
                        val !== acc[field] ? handleEditCommit(acc.id, field, val) : setEditing(null)
                      }
                      onEditCancel={() => setEditing(null)}
                    />
                  </TableCell>
                ))}
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                      onClick={() => onDelete(acc.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:hidden">
        {accounts.map((acc) => {
          const org = organizations.find((o) => o.id === acc.organization_id)
          const theme = getTheme(org?.name)
          return (
            <Card key={acc.id} className={cn('border-l-4 shadow-sm', theme.border)}>
              <CardContent className="p-4 flex justify-between items-start">
                <div className="space-y-3 flex-1 pr-4">
                  {(['organization_id', 'descricao', 'contaContabil'] as const).map((field) => (
                    <div
                      key={field}
                      className={
                        field === 'descricao'
                          ? 'font-bold text-lg'
                          : field === 'contaContabil'
                            ? 'font-mono text-xs text-slate-500'
                            : ''
                      }
                    >
                      <EditableCell
                        value={acc[field]}
                        field={field}
                        organizations={organizations}
                        isEditing={editing?.id === acc.id && editing?.field === field}
                        onEditStart={() => setEditing({ id: acc.id, field })}
                        onEditCommit={(val: string) =>
                          val !== acc[field]
                            ? handleEditCommit(acc.id, field, val)
                            : setEditing(null)
                        }
                        onEditCancel={() => setEditing(null)}
                      />
                    </div>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="text-slate-500 hover:text-red-600 hover:bg-red-50 bg-white"
                  onClick={() => onDelete(acc.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
