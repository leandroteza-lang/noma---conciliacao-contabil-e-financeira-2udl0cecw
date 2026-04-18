import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Edit2, Trash2, Loader2, Building2, CreditCard } from 'lucide-react'
import { useIsMobile } from '@/hooks/use-mobile'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'

export function BankAccountsTable({
  accounts,
  loading,
  onEdit,
  onDelete,
  currentPage,
  totalPages,
  onPageChange,
}: any) {
  const isMobile = useIsMobile()

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center border rounded-xl bg-card">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (accounts.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center border rounded-xl bg-card text-muted-foreground animate-in fade-in duration-500">
        <CreditCard className="w-12 h-12 mb-4 opacity-20" />
        <p>Nenhuma conta encontrada com os filtros atuais.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {isMobile ? (
        <div className="space-y-3">
          {accounts.map((acc: any) => (
            <Card
              key={acc.id}
              className={`overflow-hidden transition-all ${acc.pending_deletion ? 'opacity-50' : ''}`}
            >
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-base">
                      {acc.description || 'Sem descrição'}
                    </h3>
                    <div className="flex items-center text-sm text-muted-foreground mt-1">
                      <Building2 className="w-3 h-3 mr-1" />{' '}
                      {acc.organizations?.name || acc.company_name}
                    </div>
                  </div>
                  <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full font-medium">
                    {acc.account_type || 'N/A'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm bg-secondary/50 p-2 rounded-lg">
                  <div>
                    <span className="text-muted-foreground block text-xs">Banco</span>
                    {acc.bank_code || '-'}
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs">Agência</span>
                    {acc.agency || '-'}
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs">Conta</span>
                    {acc.account_number || '-'}
                    {acc.check_digit ? `-${acc.check_digit}` : ''}
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs">C. Contábil</span>
                    {acc.account_code || '-'}
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs">Classificação</span>
                    {acc.classification || '-'}
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => onEdit(acc)}
                    disabled={acc.pending_deletion}
                  >
                    <Edit2 className="w-4 h-4 mr-2" /> Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-destructive hover:bg-destructive/10"
                    onClick={() => onDelete(acc)}
                    disabled={acc.pending_deletion}
                  >
                    <Trash2 className="w-4 h-4 mr-2" /> Excluir
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="border rounded-xl bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="p-2">Empresa</TableHead>
                <TableHead className="p-2">Descrição</TableHead>
                <TableHead className="p-2">Banco</TableHead>
                <TableHead className="p-2">Agência</TableHead>
                <TableHead className="p-2">Conta</TableHead>
                <TableHead className="p-2">C. Contábil</TableHead>
                <TableHead className="p-2">Tipo de Conta</TableHead>
                <TableHead className="p-2">Classificação</TableHead>
                <TableHead className="text-right p-2">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.map((acc: any) => (
                <TableRow
                  key={acc.id}
                  className={`transition-opacity ${acc.pending_deletion ? 'opacity-50 bg-secondary/20' : 'hover:bg-muted/30'}`}
                >
                  <TableCell className="p-2">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      {acc.organizations?.name || acc.company_name}
                    </div>
                  </TableCell>
                  <TableCell className="p-2 font-medium">{acc.description}</TableCell>
                  <TableCell className="p-2">{acc.bank_code || '-'}</TableCell>
                  <TableCell className="p-2">{acc.agency || '-'}</TableCell>
                  <TableCell className="p-2">
                    {acc.account_number || '-'}
                    {acc.check_digit ? `-${acc.check_digit}` : ''}
                  </TableCell>
                  <TableCell className="p-2 font-mono text-sm">{acc.account_code || '-'}</TableCell>
                  <TableCell className="p-2">
                    <span className="bg-primary/10 text-primary text-xs px-2.5 py-0.5 rounded-full font-medium whitespace-nowrap">
                      {acc.account_type || '-'}
                    </span>
                  </TableCell>
                  <TableCell className="p-2">
                    {acc.classification ? (
                      <span className="bg-secondary text-secondary-foreground text-xs px-2.5 py-0.5 rounded-full font-medium whitespace-nowrap">
                        {acc.classification}
                      </span>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell className="text-right p-2">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onEdit(acc)}
                        disabled={acc.pending_deletion}
                      >
                        <Edit2 className="w-4 h-4 text-muted-foreground hover:text-primary" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onDelete(acc)}
                        disabled={acc.pending_deletion}
                      >
                        <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {totalPages > 1 && (
        <Pagination className="mt-4">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  onPageChange(Math.max(1, currentPage - 1))
                }}
                className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>
            <PaginationItem className="hidden sm:block">
              <span className="text-sm text-muted-foreground px-4">
                Página {currentPage} de {totalPages}
              </span>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  onPageChange(Math.min(totalPages, currentPage + 1))
                }}
                className={
                  currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  )
}
