import { Edit2, Trash2, Building } from 'lucide-react'
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
import { Account } from '@/types'
import { EMPRESA_THEME } from '@/lib/constants'
import { cn } from '@/lib/utils'

interface Props {
  accounts: Account[]
  onEdit: (account: Account) => void
  onDelete: (id: string) => void
}

export function AccountList({ accounts, onEdit, onDelete }: Props) {
  if (accounts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-slate-500 bg-white rounded-xl border border-dashed border-slate-300 shadow-sm animate-in fade-in">
        <div className="bg-slate-100 p-4 rounded-full mb-4">
          <Building className="h-8 w-8 text-slate-400" />
        </div>
        <p className="text-lg font-semibold text-slate-700">Nenhuma conta encontrada</p>
        <p className="text-sm text-center mt-1 max-w-sm">
          Tente ajustar seus filtros de busca ou crie um novo registro para visualizar aqui.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Desktop Table View */}
      <div className="hidden lg:block rounded-xl border bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/80 hover:bg-slate-50/80 border-b border-slate-200">
              <TableHead className="font-semibold text-slate-700 w-[160px]">Empresa</TableHead>
              <TableHead className="font-semibold text-slate-700">Conta Contábil</TableHead>
              <TableHead className="font-semibold text-slate-700">Descrição</TableHead>
              <TableHead className="font-semibold text-slate-700">Banco</TableHead>
              <TableHead className="font-semibold text-slate-700">Agência</TableHead>
              <TableHead className="font-semibold text-slate-700">Número Conta</TableHead>
              <TableHead className="font-semibold text-slate-700">Classificação</TableHead>
              <TableHead className="text-right font-semibold text-slate-700">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {accounts.map((acc) => (
              <TableRow key={acc.id} className="group transition-colors hover:bg-slate-50/50">
                <TableCell>
                  <Badge
                    variant="outline"
                    className={cn(
                      'font-medium shadow-sm py-1 whitespace-nowrap',
                      EMPRESA_THEME[acc.empresa]?.badge ||
                        'bg-slate-100 text-slate-800 border-slate-200',
                    )}
                  >
                    {acc.empresa}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-xs text-slate-600">
                  {acc.contaContabil}
                </TableCell>
                <TableCell className="font-medium text-slate-900">{acc.descricao}</TableCell>
                <TableCell className="text-slate-600">{acc.banco}</TableCell>
                <TableCell className="text-slate-600">{acc.agencia}</TableCell>
                <TableCell className="text-slate-600">{acc.numeroConta}</TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className="bg-slate-100 text-slate-600 font-normal hover:bg-slate-200"
                  >
                    {acc.classificacao}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                      onClick={() => onEdit(acc)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
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

      {/* Mobile/Tablet Card View */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:hidden">
        {accounts.map((acc) => (
          <Card
            key={acc.id}
            className={cn(
              'overflow-hidden border-l-4 shadow-sm transition-shadow hover:shadow-md',
              EMPRESA_THEME[acc.empresa]?.border || 'border-slate-500',
            )}
          >
            <CardContent className="p-4 sm:p-5">
              <div className="flex justify-between items-start mb-4">
                <div className="pr-4">
                  <Badge
                    variant="outline"
                    className={cn(
                      'mb-2.5 shadow-sm py-0.5',
                      EMPRESA_THEME[acc.empresa]?.badge ||
                        'bg-slate-100 text-slate-800 border-slate-200',
                    )}
                  >
                    {acc.empresa}
                  </Badge>
                  <h3 className="font-bold text-slate-900 text-lg leading-tight mb-1">
                    {acc.descricao}
                  </h3>
                  <p className="font-mono text-xs text-slate-500">{acc.contaContabil}</p>
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 text-slate-500 border-slate-200 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 bg-white shadow-sm"
                    onClick={() => onEdit(acc)}
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 text-slate-500 border-slate-200 hover:text-red-600 hover:border-red-200 hover:bg-red-50 bg-white shadow-sm"
                    onClick={() => onDelete(acc.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm mt-4 pt-4 border-t border-slate-100">
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider mb-0.5">
                    Banco
                  </span>
                  <span className="font-medium text-slate-800 truncate block">{acc.banco}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider mb-0.5">
                    Ag / Conta
                  </span>
                  <span className="font-medium text-slate-800">
                    {acc.agencia} / {acc.numeroConta}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider mb-1">
                    Classificação
                  </span>
                  <Badge variant="secondary" className="bg-slate-100 text-slate-600 font-normal">
                    {acc.classificacao}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
