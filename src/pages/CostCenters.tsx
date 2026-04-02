import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, Building2, Layers } from 'lucide-react'
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
import { useAuth } from '@/hooks/use-auth'

interface CostCenter {
  id: string
  code: string
  description: string
  parent_id: string | null
  type_tga: string | null
  fixed_variable: string | null
  classification: string | null
  operational: string | null
  organization: { name: string } | null
}

export default function CostCenters() {
  const { user } = useAuth()
  const [costCenters, setCostCenters] = useState<CostCenter[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    const fetchCostCenters = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('cost_centers')
        .select('*, organization:organizations(name)')
        .order('code', { ascending: true })

      if (!error && data) {
        setCostCenters(data as any)
      }
      setLoading(false)
    }

    fetchCostCenters()

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'cost_centers' },
        (payload) => {
          fetchCostCenters()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  const filteredData = costCenters.filter((cc) => {
    const term = search.toLowerCase()
    return (
      (cc.code && cc.code.toLowerCase().includes(term)) ||
      (cc.description && cc.description.toLowerCase().includes(term)) ||
      (cc.organization?.name && cc.organization.name.toLowerCase().includes(term))
    )
  })

  const getIndent = (code: string) => {
    const level = (code.match(/\./g) || []).length
    return level * 1.5
  }

  return (
    <div className="container mx-auto max-w-6xl py-8 space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Centros de Custo</h1>
          <p className="text-muted-foreground">
            Gerencie a hierarquia de centros de custo das suas empresas.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link to="/import">Importar Planilha</Link>
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Novo Centro de Custo
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-1">
              <CardTitle>Lista de Centros de Custo</CardTitle>
              <CardDescription>Visualize e filtre sua estrutura hierárquica.</CardDescription>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar por código ou descrição..."
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[200px]">Código</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Tipo / Fixo-Var</TableHead>
                  <TableHead>Classificação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      Carregando centros de custo...
                    </TableCell>
                  </TableRow>
                ) : filteredData.length > 0 ? (
                  filteredData.map((cc) => (
                    <TableRow key={cc.id}>
                      <TableCell className="font-medium whitespace-nowrap">
                        <div
                          className="flex items-center"
                          style={{ paddingLeft: `${getIndent(cc.code)}rem` }}
                        >
                          <Layers className="h-3 w-3 text-muted-foreground mr-2 opacity-50" />
                          {cc.code}
                        </div>
                      </TableCell>
                      <TableCell>{cc.description}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-3 w-3 text-muted-foreground" />
                          <span className="truncate max-w-[150px]">
                            {cc.organization?.name || '-'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap max-w-[150px]">
                          {cc.type_tga && <Badge variant="outline">{cc.type_tga}</Badge>}
                          {cc.fixed_variable && (
                            <Badge variant="secondary">{cc.fixed_variable}</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {cc.classification && (
                          <Badge variant="outline" className="bg-primary/5">
                            {cc.classification}
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      Nenhum centro de custo encontrado.
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
