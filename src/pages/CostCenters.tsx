import { useState, useEffect } from 'react'
import { Plus, Search, Edit2, Trash2, History, Building2 } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { EntityAuditHistory } from '@/components/AuditLog/EntityAuditHistory'
import { Badge } from '@/components/ui/badge'

export default function CostCenters() {
  const { toast } = useToast()
  const [costCenters, setCostCenters] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [auditEntityId, setAuditEntityId] = useState<string | null>(null)
  const [auditEntityName, setAuditEntityName] = useState<string>('')
  const [auditOpen, setAuditOpen] = useState(false)

  useEffect(() => {
    fetchCostCenters()
  }, [])

  const fetchCostCenters = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('cost_centers')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (error) {
      toast({
        title: 'Erro ao buscar',
        description: error.message,
        variant: 'destructive',
      })
    } else {
      setCostCenters(data || [])
    }
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este centro de custo?')) return

    const { error } = await supabase
      .from('cost_centers')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' })
    } else {
      toast({ title: 'Sucesso', description: 'Centro de custo excluído com sucesso.' })
      fetchCostCenters()
    }
  }

  const openAudit = (id: string, name: string) => {
    setAuditEntityId(id)
    setAuditEntityName(name)
    setAuditOpen(true)
  }

  const filteredData = costCenters.filter(
    (cc) =>
      cc.code?.toLowerCase().includes(search.toLowerCase()) ||
      '' ||
      cc.description?.toLowerCase().includes(search.toLowerCase()) ||
      '',
  )

  return (
    <div className="flex flex-col gap-6 p-6 mx-auto w-full max-w-[1400px] animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
            <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Centros de Custo</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie a estrutura de custos da sua organização
            </p>
          </div>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Novo Centro de Custo
        </Button>
      </div>

      <Card className="border-border/50 shadow-sm">
        <CardHeader className="bg-muted/20 border-b pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg">Listagem</CardTitle>
              <CardDescription>Visualize e edite os centros de custo cadastrados.</CardDescription>
            </div>
            <div className="relative w-full sm:max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por código ou descrição..."
                className="pl-8 bg-background"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="font-semibold">Código</TableHead>
                <TableHead className="font-semibold">Descrição</TableHead>
                <TableHead className="font-semibold">Classificação</TableHead>
                <TableHead className="text-right font-semibold pr-4">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <div className="h-4 w-16 bg-muted animate-pulse rounded" />
                    </TableCell>
                    <TableCell>
                      <div className="h-4 w-48 bg-muted animate-pulse rounded" />
                    </TableCell>
                    <TableCell>
                      <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                    </TableCell>
                    <TableCell>
                      <div className="h-8 w-24 bg-muted animate-pulse rounded ml-auto" />
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredData.length > 0 ? (
                filteredData.map((cc) => (
                  <TableRow key={cc.id} className="hover:bg-muted/30">
                    <TableCell className="font-medium">
                      <Badge variant="outline" className="font-mono bg-background">
                        {cc.code || '-'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{cc.description}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {cc.classification || <span className="italic opacity-50">Não definida</span>}
                    </TableCell>
                    <TableCell className="text-right pr-4">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-primary hover:text-primary hover:bg-primary/10"
                          onClick={() => openAudit(cc.id, cc.description)}
                          title="Ver Histórico de Auditoria"
                        >
                          <History className="h-4 w-4 mr-2" />
                          Log
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="hover:bg-muted/50"
                          title="Editar"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(cc.id)}
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center">
                      <Search className="h-8 w-8 mb-2 opacity-20" />
                      <p>Nenhum centro de custo encontrado.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <EntityAuditHistory
        entityId={auditEntityId}
        entityName={auditEntityName}
        open={auditOpen}
        onOpenChange={setAuditOpen}
      />
    </div>
  )
}
