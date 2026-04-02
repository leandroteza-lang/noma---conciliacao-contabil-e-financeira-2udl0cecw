import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, Building2, Layers, Trash2 } from 'lucide-react'
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
import { Checkbox } from '@/components/ui/checkbox'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'

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
  const { user, role } = useAuth()
  const { toast } = useToast()
  const [costCenters, setCostCenters] = useState<CostCenter[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const canDelete = role === 'admin'

  const fetchCostCenters = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('cost_centers')
      .select('*, organization:organizations(name)')
      .neq('pending_deletion', true)
      .order('code', { ascending: true })

    if (!error && data) {
      setCostCenters(data as any)
      setSelectedIds((prev) => prev.filter((id) => data.some((d) => d.id === id)))
    }
    setLoading(false)
  }

  useEffect(() => {
    if (!user) return

    fetchCostCenters()

    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cost_centers' }, () => {
        fetchCostCenters()
      })
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
    if (!code) return 0
    const level = (code.match(/\./g) || []).length
    return level * 1.5
  }

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return
    if (!confirm(`Deseja solicitar a exclusão de ${selectedIds.length} centro(s) de custo?`)) return

    const checkPromises = selectedIds.map(async (id) => {
      const { data: linkedMovements } = await supabase
        .from('financial_movements')
        .select('id')
        .eq('cost_center_id', id)
        .limit(1)
      const { data: linkedMappings } = await supabase
        .from('account_mapping')
        .select('id')
        .eq('cost_center_id', id)
        .limit(1)
      const { data: linkedChildren } = await supabase
        .from('cost_centers')
        .select('id')
        .eq('parent_id', id)
        .limit(1)

      const hasRelations =
        (linkedMovements && linkedMovements.length > 0) ||
        (linkedMappings && linkedMappings.length > 0) ||
        (linkedChildren && linkedChildren.length > 0)

      return { id, hasRelations }
    })

    const results = await Promise.all(checkPromises)
    const toDelete = results.filter((r) => !r.hasRelations).map((r) => r.id)
    const blocked = results.filter((r) => r.hasRelations).map((r) => r.id)

    if (toDelete.length > 0) {
      const { error } = await supabase
        .from('cost_centers')
        .update({
          pending_deletion: true,
          deletion_requested_at: new Date().toISOString(),
          deletion_requested_by: user?.id,
        })
        .in('id', toDelete)

      if (error) toast({ title: 'Erro', description: error.message, variant: 'destructive' })
      else
        toast({
          title: 'Sucesso',
          description: `${toDelete.length} centro(s) de custo enviado(s) para aprovação.`,
        })
    }

    if (blocked.length > 0) {
      toast({
        title: 'Ação Parcialmente Bloqueada',
        description: `${blocked.length} centro(s) de custo possuem vínculos (movimentações, mapeamentos ou sub-centros) e não puderam ser excluídos.`,
        variant: 'destructive',
      })
    }

    setSelectedIds([])
    fetchCostCenters()
  }

  const handleDelete = async (id: string) => {
    const { data: linkedMovements } = await supabase
      .from('financial_movements')
      .select('id')
      .eq('cost_center_id', id)
      .limit(1)
    const { data: linkedMappings } = await supabase
      .from('account_mapping')
      .select('id')
      .eq('cost_center_id', id)
      .limit(1)
    const { data: linkedChildren } = await supabase
      .from('cost_centers')
      .select('id')
      .eq('parent_id', id)
      .limit(1)

    if (
      (linkedMovements && linkedMovements.length > 0) ||
      (linkedMappings && linkedMappings.length > 0) ||
      (linkedChildren && linkedChildren.length > 0)
    ) {
      toast({
        title: 'Ação Bloqueada',
        description: 'Este centro de custo possui vínculos e não pode ser excluído.',
        variant: 'destructive',
      })
      return
    }

    if (!confirm('Deseja solicitar a exclusão deste centro de custo?')) return

    const { error } = await supabase
      .from('cost_centers')
      .update({
        pending_deletion: true,
        deletion_requested_at: new Date().toISOString(),
        deletion_requested_by: user?.id,
      })
      .eq('id', id)

    if (error) toast({ title: 'Erro', description: error.message, variant: 'destructive' })
    else {
      toast({ title: 'Enviado para Aprovação', description: 'A exclusão foi solicitada.' })
      fetchCostCenters()
    }
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
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  {canDelete && (
                    <TableHead className="w-12 text-center">
                      <Checkbox
                        checked={
                          filteredData.length > 0 && selectedIds.length === filteredData.length
                        }
                        onCheckedChange={(checked) => {
                          if (checked) setSelectedIds(filteredData.map((d) => d.id))
                          else setSelectedIds([])
                        }}
                      />
                    </TableHead>
                  )}
                  <TableHead className="w-[200px]">Código</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Tipo / Fixo-Var</TableHead>
                  <TableHead>Classificação</TableHead>
                  {canDelete && <TableHead className="text-right">Ações</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={canDelete ? 7 : 5} className="h-24 text-center">
                      Carregando centros de custo...
                    </TableCell>
                  </TableRow>
                ) : filteredData.length > 0 ? (
                  filteredData.map((cc) => (
                    <TableRow key={cc.id}>
                      {canDelete && (
                        <TableCell className="text-center">
                          <Checkbox
                            checked={selectedIds.includes(cc.id)}
                            onCheckedChange={(checked) => {
                              if (checked) setSelectedIds((prev) => [...prev, cc.id])
                              else setSelectedIds((prev) => prev.filter((id) => id !== cc.id))
                            }}
                          />
                        </TableCell>
                      )}
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
                      {canDelete && (
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(cc.id)}
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
                    <TableCell colSpan={canDelete ? 7 : 5} className="h-24 text-center">
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
