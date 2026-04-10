import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, Building2, Layers, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { useAuditLog } from '@/hooks/use-audit-log'

interface CostCenter {
  id: string
  code: string
  description: string
  parent_id: string | null
  type_tga: string | null
  fixed_variable: string | null
  classification: string | null
  operational: string | null
  tipo_lcto: string | null
  tipo_tga_id: string | null
  contabiliza: string | null
  observacoes: string | null
  organization: { name: string } | null
  tipo_conta_tga: { nome: string } | null
}

export default function CostCenters() {
  const { user, role } = useAuth()
  const { toast } = useToast()
  const { logAction } = useAuditLog()
  const [costCenters, setCostCenters] = useState<CostCenter[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  const canDelete = role === 'admin'

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [orgs, setOrgs] = useState<{ id: string; name: string }[]>([])
  const [tgaOptions, setTgaOptions] = useState<{ id: string; nome: string }[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [newCC, setNewCC] = useState({
    organization_id: '',
    code: '',
    description: '',
    tipo_lcto: 'none',
    operational: 'none',
    tipo_tga_id: 'none',
    type_tga: '',
    fixed_variable: '',
    contabiliza: 'none',
    observacoes: '',
  })

  const loadOrgs = async () => {
    const { data } = await supabase.from('organizations').select('id, name').is('deleted_at', null)
    if (data) setOrgs(data)
  }

  useEffect(() => {
    if (newCC.organization_id) {
      supabase
        .from('tipo_conta_tga')
        .select('id, nome')
        .eq('organization_id', newCC.organization_id)
        .is('deleted_at', null)
        .then(({ data }) => setTgaOptions(data || []))
    } else {
      setTgaOptions([])
    }
  }, [newCC.organization_id])

  const handleCreate = async () => {
    if (!newCC.organization_id || !newCC.code || !newCC.description) {
      toast({
        title: 'Atenção',
        description: 'Preencha empresa, código e descrição.',
        variant: 'destructive',
      })
      return
    }
    setSubmitting(true)
    const payload = {
      organization_id: newCC.organization_id,
      code: newCC.code,
      description: newCC.description,
      tipo_lcto: newCC.tipo_lcto !== 'none' ? newCC.tipo_lcto : null,
      operational: newCC.operational !== 'none' ? newCC.operational : null,
      tipo_tga_id: newCC.tipo_tga_id !== 'none' ? newCC.tipo_tga_id : null,
      type_tga: newCC.type_tga || null,
      fixed_variable: newCC.fixed_variable || null,
      contabiliza: newCC.contabiliza !== 'none' ? newCC.contabiliza : null,
      observacoes: newCC.observacoes || null,
    }
    const { data: inserted, error } = await supabase
      .from('cost_centers')
      .insert([payload])
      .select()
      .single()
    setSubmitting(false)

    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' })
    } else {
      if (inserted) {
        const changes: any = {}
        Object.keys(payload).forEach((k) => {
          changes[k] = { new: (payload as any)[k] }
        })
        await logAction('COST_CENTERS', inserted.id, 'CRIACAO', changes)
      }
      toast({ title: 'Sucesso', description: 'Centro de custo criado.' })
      setIsCreateOpen(false)
      setNewCC({
        organization_id: '',
        code: '',
        description: '',
        tipo_lcto: 'none',
        operational: 'none',
        tipo_tga_id: 'none',
        type_tga: '',
        fixed_variable: '',
        contabiliza: 'none',
        observacoes: '',
      })
      fetchCostCenters()
    }
  }

  const fetchCostCenters = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('cost_centers')
      .select('*, organization:organizations(name), tipo_conta_tga(nome)')
      .neq('pending_deletion', true)
      .is('deleted_at', null)
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

  const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage))
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  )

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
        .is('deleted_at', null)
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
      else {
        for (const id of toDelete) {
          await logAction('COST_CENTERS', id, 'SOLICITACAO_EXCLUSAO_EM_LOTE', {
            pending_deletion: { old: false, new: true },
          })
        }
        toast({
          title: 'Sucesso',
          description: `${toDelete.length} centro(s) de custo enviado(s) para aprovação.`,
        })
      }
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
      .is('deleted_at', null)
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
      await logAction('COST_CENTERS', id, 'SOLICITACAO_EXCLUSAO', {
        pending_deletion: { old: false, new: true },
      })
      toast({ title: 'Enviado para Aprovação', description: 'A exclusão foi solicitada.' })
      fetchCostCenters()
    }
  }

  return (
    <div className="container mx-auto max-w-7xl py-8 space-y-6 animate-fade-in-up">
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
          <Button
            onClick={() => {
              loadOrgs()
              setIsCreateOpen(true)
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Centro de Custo
          </Button>
        </div>
      </div>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Novo Centro de Custo</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-2 md:col-span-2">
              <Label>Empresa</Label>
              <Select
                value={newCC.organization_id}
                onValueChange={(v) => setNewCC({ ...newCC, organization_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a empresa" />
                </SelectTrigger>
                <SelectContent>
                  {orgs.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Código</Label>
              <Input
                value={newCC.code}
                onChange={(e) => setNewCC({ ...newCC, code: e.target.value })}
                placeholder="Ex: 1.01"
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input
                value={newCC.description}
                onChange={(e) => setNewCC({ ...newCC, description: e.target.value })}
                placeholder="Ex: Diretoria"
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo Lcto</Label>
              <Select
                value={newCC.tipo_lcto}
                onValueChange={(v) => setNewCC({ ...newCC, tipo_lcto: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Selecione...</SelectItem>
                  <SelectItem value="A">A</SelectItem>
                  <SelectItem value="S">S</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Operacional</Label>
              <Select
                value={newCC.operational}
                onValueChange={(v) => setNewCC({ ...newCC, operational: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Selecione...</SelectItem>
                  <SelectItem value="F">F</SelectItem>
                  <SelectItem value="T">T</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Tipo TGA</Label>
              <Select
                value={newCC.tipo_tga_id}
                onValueChange={(v) => setNewCC({ ...newCC, tipo_tga_id: v })}
                disabled={!newCC.organization_id}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Busque de Tipos de Conta TGA..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Selecione...</SelectItem>
                  {tgaOptions.map((tga) => (
                    <SelectItem key={tga.id} value={tga.id}>
                      {tga.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Input
                value={newCC.type_tga}
                onChange={(e) => setNewCC({ ...newCC, type_tga: e.target.value })}
                placeholder="Ex: T"
              />
            </div>
            <div className="space-y-2">
              <Label>Fixo/Variável</Label>
              <Input
                value={newCC.fixed_variable}
                onChange={(e) => setNewCC({ ...newCC, fixed_variable: e.target.value })}
                placeholder="Ex: Fixo"
              />
            </div>
            <div className="space-y-2">
              <Label>Contabiliza</Label>
              <Select
                value={newCC.contabiliza}
                onValueChange={(v) => setNewCC({ ...newCC, contabiliza: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Selecione...</SelectItem>
                  <SelectItem value="SIM">SIM</SelectItem>
                  <SelectItem value="NAO">NÃO</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Observações</Label>
              <Input
                value={newCC.observacoes}
                onChange={(e) => setNewCC({ ...newCC, observacoes: e.target.value })}
                placeholder="Observações adicionais"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={submitting}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                onChange={(e) => {
                  setSearch(e.target.value)
                  setCurrentPage(1)
                }}
              />{' '}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50 whitespace-nowrap">
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
                  <TableHead className="w-[180px]">Código</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Tipo Lcto</TableHead>
                  <TableHead>Operacional</TableHead>
                  <TableHead>Tipo TGA</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Fixo/Variável</TableHead>
                  <TableHead>Classificação</TableHead>
                  <TableHead>Contabiliza</TableHead>
                  <TableHead>Observações</TableHead>
                  {canDelete && <TableHead className="text-right">Ações</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={13} className="h-24 text-center">
                      Carregando centros de custo...
                    </TableCell>
                  </TableRow>
                ) : paginatedData.length > 0 ? (
                  paginatedData.map((cc) => (
                    <TableRow key={cc.id} className="whitespace-nowrap">
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
                      <TableCell className="font-medium">
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
                      <TableCell>{cc.tipo_lcto || '-'}</TableCell>
                      <TableCell>{cc.operational || '-'}</TableCell>
                      <TableCell>{cc.tipo_conta_tga?.nome || '-'}</TableCell>
                      <TableCell>
                        {cc.type_tga ? <Badge variant="outline">{cc.type_tga}</Badge> : '-'}
                      </TableCell>
                      <TableCell>
                        {cc.fixed_variable ? (
                          <Badge variant="secondary">{cc.fixed_variable}</Badge>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        {cc.classification ? (
                          <Badge variant="outline" className="bg-primary/5">
                            {cc.classification}
                          </Badge>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        {cc.contabiliza ? (
                          <Badge variant={cc.contabiliza === 'SIM' ? 'default' : 'secondary'}>
                            {cc.contabiliza}
                          </Badge>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate" title={cc.observacoes || ''}>
                        {cc.observacoes || '-'}
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
                    <TableCell colSpan={13} className="h-24 text-center">
                      Nenhum centro de custo encontrado.
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
