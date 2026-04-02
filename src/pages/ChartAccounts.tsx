import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, Building2, AlignLeft, Filter } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAuth } from '@/hooks/use-auth'

interface ChartAccount {
  id: string
  account_code: string
  account_name: string
  account_type: string
  organization: { name: string } | null
}

export default function ChartAccounts() {
  const { user } = useAuth()
  const [accounts, setAccounts] = useState<ChartAccount[]>([])
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    const fetchAccounts = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('chart_of_accounts')
        .select('*, organization:organizations(name)')
        .order('account_code', { ascending: true })

      if (!error && data) {
        setAccounts(data as any)
      }
      setLoading(false)
    }

    fetchAccounts()

    const channel = supabase
      .channel('schema-db-changes-chart-accounts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chart_of_accounts' }, () => {
        fetchAccounts()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  const filteredData = accounts.filter((acc) => {
    const term = search.toLowerCase()
    const matchesSearch =
      (acc.account_code && acc.account_code.toLowerCase().includes(term)) ||
      (acc.account_name && acc.account_name.toLowerCase().includes(term)) ||
      (acc.organization?.name && acc.organization.name.toLowerCase().includes(term))

    const matchesType =
      typeFilter === 'all' ||
      (acc.account_type && acc.account_type.toLowerCase() === typeFilter.toLowerCase())

    return matchesSearch && matchesType
  })

  const getIndent = (code: string) => {
    if (!code) return 0
    const level = (code.match(/\./g) || []).length
    return level * 1.5
  }

  return (
    <div className="container mx-auto max-w-6xl py-8 space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Plano de Contas</h1>
          <p className="text-muted-foreground">Gerencie a hierarquia contábil das suas empresas.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link to="/import">Importar Planilha</Link>
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nova Conta
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-1">
              <CardTitle>Listagem de Contas</CardTitle>
              <CardDescription>Visualize e filtre sua estrutura contábil.</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar por código ou nome..."
                  className="pl-8"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="w-full sm:w-48">
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                    <SelectValue placeholder="Filtrar por tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Tipos</SelectItem>
                    <SelectItem value="Ativo">Ativo</SelectItem>
                    <SelectItem value="Passivo">Passivo</SelectItem>
                    <SelectItem value="Receita">Receita</SelectItem>
                    <SelectItem value="Despesa">Despesa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[200px]">Código</TableHead>
                  <TableHead>Nome da Conta</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Empresa</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      Carregando plano de contas...
                    </TableCell>
                  </TableRow>
                ) : filteredData.length > 0 ? (
                  filteredData.map((acc) => (
                    <TableRow key={acc.id}>
                      <TableCell className="font-medium whitespace-nowrap">
                        <div
                          className="flex items-center"
                          style={{ paddingLeft: `${getIndent(acc.account_code)}rem` }}
                        >
                          <AlignLeft className="h-3 w-3 text-muted-foreground mr-2 opacity-50" />
                          {acc.account_code}
                        </div>
                      </TableCell>
                      <TableCell>{acc.account_name}</TableCell>
                      <TableCell>
                        {acc.account_type && (
                          <Badge
                            variant="outline"
                            className={
                              acc.account_type.toLowerCase() === 'ativo'
                                ? 'bg-blue-500/10 text-blue-700 border-blue-200 dark:text-blue-400'
                                : acc.account_type.toLowerCase() === 'passivo'
                                  ? 'bg-red-500/10 text-red-700 border-red-200 dark:text-red-400'
                                  : acc.account_type.toLowerCase() === 'receita'
                                    ? 'bg-green-500/10 text-green-700 border-green-200 dark:text-green-400'
                                    : acc.account_type.toLowerCase() === 'despesa'
                                      ? 'bg-orange-500/10 text-orange-700 border-orange-200 dark:text-orange-400'
                                      : ''
                            }
                          >
                            {acc.account_type}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-3 w-3 text-muted-foreground" />
                          <span className="truncate max-w-[150px]">
                            {acc.organization?.name || '-'}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      Nenhuma conta contábil encontrada.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
