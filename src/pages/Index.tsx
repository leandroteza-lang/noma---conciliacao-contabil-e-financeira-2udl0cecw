import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, Building2, Trash2, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function Index() {
  const { user, role } = useAuth()
  const { toast } = useToast()
  const [accounts, setAccounts] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  const canDelete = role === 'admin'

  const fetchAccounts = async () => {
    if (!user) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('bank_accounts')
        .select('*')
        .neq('pending_deletion', true)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      if (error) throw error
      setAccounts(data || [])
      setSelectedIds((prev) => prev.filter((id) => (data || []).some((d) => d.id === id)))
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAccounts()
  }, [user])

  const filteredData = useMemo(
    () =>
      accounts.filter((acc) => {
        const term = search.toLowerCase()
        return (
          (acc.description && acc.description.toLowerCase().includes(term)) ||
          (acc.account_code && acc.account_code.toLowerCase().includes(term)) ||
          (acc.company_name && acc.company_name.toLowerCase().includes(term))
        )
      }),
    [accounts, search],
  )

  const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage))
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  )

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return
    if (!confirm(`Deseja solicitar a exclusão de ${selectedIds.length} conta(s)?`)) return

    const { error } = await supabase
      .from('bank_accounts')
      .update({
        pending_deletion: true,
        deletion_requested_at: new Date().toISOString(),
        deletion_requested_by: user?.id,
      })
      .in('id', selectedIds)

    if (error) toast({ title: 'Erro', description: error.message, variant: 'destructive' })
    else {
      toast({
        title: 'Sucesso',
        description: `${selectedIds.length} conta(s) enviada(s) para aprovação.`,
      })
      setSelectedIds([])
      fetchAccounts()
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja solicitar a exclusão desta conta?')) return

    const { error } = await supabase
      .from('bank_accounts')
      .update({
        pending_deletion: true,
        deletion_requested_at: new Date().toISOString(),
        deletion_requested_by: user?.id,
      })
      .eq('id', id)

    if (error) toast({ title: 'Erro', description: error.message, variant: 'destructive' })
    else {
      toast({ title: 'Enviado para Aprovação', description: 'A exclusão foi solicitada.' })
      fetchAccounts()
    }
  }

  return (
    <div className="container mx-auto max-w-6xl py-8 space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Listagem de Contas</h1>
          <p className="text-muted-foreground">Gerencie as contas bancárias e contas correntes.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link to="/import">Importar Planilha</Link>
          </Button>
        </div>
      </div>

      {selectedIds.length > 0 && canDelete && (
        <div className="bg-slate-50 border border-slate-200 rounded-md p-3 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <span className="text-sm font-medium text-slate-700">
            {selectedIds.length} item(ns) selecionado(s)
          </span>
          <Button variant="destructive" size="sm" onClick={handleBulkDelete} className="gap-2">
            <Trash2 className="h-4 w-4" /> Excluir Selecionados
          </Button>
        </div>
      )}

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-1">
              <CardTitle>Listagem de Contas</CardTitle>
              <CardDescription>Visualize e filtre suas contas cadastradas.</CardDescription>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar por descrição, código..."
                className="pl-8"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setCurrentPage(1)
                }}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  {canDelete && (
                    <TableHead className="w-12 text-center">
                      <Checkbox
                        checked={
                          paginatedData.length > 0 && selectedIds.length === paginatedData.length
                        }
                        onCheckedChange={(checked) => {
                          if (checked) setSelectedIds(paginatedData.map((d) => d.id))
                          else setSelectedIds([])
                        }}
                      />
                    </TableHead>
                  )}
                  <TableHead>Conta Contábil</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Banco</TableHead>
                  <TableHead>Agência / Conta</TableHead>
                  <TableHead>Empresa</TableHead>
                  {canDelete && <TableHead className="text-right">Ações</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={canDelete ? 7 : 6} className="h-24 text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-600" />
                    </TableCell>
                  </TableRow>
                ) : paginatedData.length > 0 ? (
                  paginatedData.map((acc) => (
                    <TableRow key={acc.id}>
                      {canDelete && (
                        <TableCell className="text-center">
                          <Checkbox
                            checked={selectedIds.includes(acc.id)}
                            onCheckedChange={(checked) => {
                              if (checked) setSelectedIds((prev) => [...prev, acc.id])
                              else setSelectedIds((prev) => prev.filter((id) => id !== acc.id))
                            }}
                          />
                        </TableCell>
                      )}
                      <TableCell className="font-medium">
                        <Badge variant="outline">{acc.account_code || '-'}</Badge>
                      </TableCell>
                      <TableCell>{acc.description || '-'}</TableCell>
                      <TableCell>{acc.bank_code || '-'}</TableCell>
                      <TableCell>
                        <div className="flex flex-col text-sm text-slate-600">
                          <span>Ag: {acc.agency || '-'}</span>
                          <span>
                            Cc: {acc.account_number || '-'}-{acc.check_digit || '-'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-3 w-3 text-muted-foreground" />
                          <span className="truncate max-w-[150px]">{acc.company_name || '-'}</span>
                        </div>
                      </TableCell>
                      {canDelete && (
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(acc.id)}
                            className="h-8 w-8 text-slate-500 hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={canDelete ? 7 : 6}
                      className="h-24 text-center text-slate-500"
                    >
                      Nenhuma conta encontrada.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {!loading && filteredData.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-slate-100 gap-4">
              <p className="text-sm text-slate-500">
                Mostrando {(currentPage - 1) * itemsPerPage + 1} até{' '}
                {Math.min(currentPage * itemsPerPage, filteredData.length)} de {filteredData.length}
              </p>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <p className="text-sm text-slate-500 hidden sm:block">Itens por página:</p>
                  <Select
                    value={itemsPerPage.toString()}
                    onValueChange={(v) => {
                      setItemsPerPage(Number(v))
                      setCurrentPage(1)
                    }}
                  >
                    <SelectTrigger className="h-8 w-[70px]">
                      <SelectValue placeholder={itemsPerPage} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                      <SelectItem value="1000">1000</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium px-2">
                    {currentPage} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
