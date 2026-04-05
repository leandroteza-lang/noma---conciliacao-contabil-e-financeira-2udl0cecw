import { useState, useEffect, useMemo } from 'react'
import {
  CheckSquare,
  RotateCcw,
  Trash2,
  Loader2,
  AlertCircle,
  CalendarIcon,
  Eraser,
  Mail,
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Label } from '@/components/ui/label'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { ItemsTable, PendingItem } from '@/components/approvals/ItemsTable'

export default function Approvals() {
  const [items, setItems] = useState<PendingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<'pending' | 'new_users' | 'trash'>('pending')
  const [newUsers, setNewUsers] = useState<any[]>([])
  const [progress, setProgress] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterRequester, setFilterRequester] = useState<string>('all')
  const [filterDate, setFilterDate] = useState<Date | undefined>()
  const { role } = useAuth()
  const { toast } = useToast()

  const logAuditAction = async (item: any, actionType: string, customChanges: any = null) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      let finalEntityType = item.type || 'unknown'
      if (finalEntityType === 'employee') finalEntityType = 'usuario'
      if (finalEntityType === 'organization') finalEntityType = 'empresa'
      if (finalEntityType === 'department') finalEntityType = 'departamento'
      if (finalEntityType === 'cost_center') finalEntityType = 'centro_custo'
      if (finalEntityType === 'chart_account') finalEntityType = 'conta_contabil'
      if (finalEntityType === 'bank_account') finalEntityType = 'conta_bancaria'

      let changes = customChanges ? { ...customChanges } : {}

      if (actionType === 'DELETE' && !customChanges) {
        if (item.originalData) {
          Object.keys(item.originalData).forEach((k) => {
            if (item.originalData[k] !== null && typeof item.originalData[k] !== 'object') {
              changes[k] = { old: item.originalData[k], new: null }
            }
          })
        }
      }

      // Salva o snapshot do registro para histórico, mesmo se for excluído definitivamente
      changes._snapshot = {
        name: item.name || item.originalData?.name || 'Desconhecido',
        email: item.originalData?.email || 'N/A',
      }

      const { data: auditLog, error } = await supabase
        .from('audit_logs')
        .insert({
          entity_type: finalEntityType,
          entity_id: item.id,
          action: actionType,
          performed_by: user.id,
          changes,
        })
        .select()
        .single()

      if (!error && auditLog && changes) {
        const details = Object.entries(changes)
          .filter(([field]) => field !== '_snapshot')
          .map(([field, vals]: [string, any]) => ({
            audit_log_id: auditLog.id,
            field_name: field,
            old_value: vals.old !== undefined ? String(vals.old) : null,
            new_value: vals.new !== undefined ? String(vals.new) : null,
          }))
        if (details.length > 0) {
          await supabase.from('audit_details').insert(details)
        }
      }
    } catch (e) {
      console.error('Erro ao salvar log de auditoria', e)
    }
  }

  const fetchPendingItems = async () => {
    if (role !== 'admin') return
    try {
      setLoading(true)
      const [orgs, depts, emps, newUsersRes, costs, charts, banks] = await Promise.all([
        supabase
          .from('organizations')
          .select('*')
          .or('pending_deletion.eq.true,deleted_at.not.is.null')
          .then((res) => (res.error ? { data: [] } : res))
          .catch(() => ({ data: [] })),
        supabase
          .from('departments')
          .select('*')
          .or('pending_deletion.eq.true,deleted_at.not.is.null')
          .then((res) => (res.error ? { data: [] } : res))
          .catch(() => ({ data: [] })),
        supabase
          .from('cadastro_usuarios')
          .select('*')
          .or('pending_deletion.eq.true,deleted_at.not.is.null')
          .then((res) => (res.error ? { data: [] } : res))
          .catch(() => ({ data: [] })),
        supabase
          .from('cadastro_usuarios')
          .select('*')
          .eq('approval_status', 'pending')
          .is('deleted_at', null)
          .then((res) => (res.error ? { data: [] } : res))
          .catch(() => ({ data: [] })),
        supabase
          .from('cost_centers')
          .select('*')
          .or('pending_deletion.eq.true,deleted_at.not.is.null')
          .then((res) => (res.error ? { data: [] } : res))
          .catch(() => ({ data: [] })),
        supabase
          .from('chart_of_accounts')
          .select('*')
          .or('pending_deletion.eq.true,deleted_at.not.is.null')
          .then((res) => (res.error ? { data: [] } : res))
          .catch(() => ({ data: [] })),
        supabase
          .from('bank_accounts')
          .select('*')
          .or('pending_deletion.eq.true,deleted_at.not.is.null')
          .then((res) => (res.error ? { data: [] } : res))
          .catch(() => ({ data: [] })),
      ])

      const unified: PendingItem[] = [
        ...(orgs.data || []).map((o: any) => ({
          id: o.id,
          type: 'organization' as const,
          typeLabel: 'Empresa',
          name: o.name,
          requestedAt: o.deletion_requested_at || o.created_at,
          requestedBy: o.deletion_requested_by,
          deletedAt: o.deleted_at,
          deletedBy: o.deleted_by,
          pending: o.pending_deletion,
          originalData: o,
        })),
        ...(depts.data || []).map((d: any) => ({
          id: d.id,
          type: 'department' as const,
          typeLabel: 'Departamento',
          name: d.name,
          requestedAt: d.deletion_requested_at || d.created_at,
          requestedBy: d.deletion_requested_by,
          deletedAt: d.deleted_at,
          deletedBy: d.deleted_by,
          pending: d.pending_deletion,
          originalData: d,
        })),
        ...(emps.data || []).map((e: any) => ({
          id: e.id,
          type: 'employee' as const,
          typeLabel: 'Funcionário',
          name: e.name,
          requestedAt: e.deletion_requested_at || e.created_at,
          requestedBy: e.deletion_requested_by,
          deletedAt: e.deleted_at,
          deletedBy: e.deleted_by,
          pending: e.pending_deletion,
          originalData: e,
        })),
        ...(costs.data || []).map((c: any) => ({
          id: c.id,
          type: 'cost_center' as const,
          typeLabel: 'Centro de Custo',
          name: `${c.code} - ${c.description}`,
          requestedAt: c.deletion_requested_at || c.created_at,
          requestedBy: c.deletion_requested_by,
          deletedAt: c.deleted_at,
          deletedBy: c.deleted_by,
          pending: c.pending_deletion,
          originalData: c,
        })),
        ...(charts.data || []).map((c: any) => ({
          id: c.id,
          type: 'chart_account' as const,
          typeLabel: 'Conta Contábil',
          name: `${c.account_code} - ${c.account_name}`,
          requestedAt: c.deletion_requested_at || c.created_at,
          requestedBy: c.deletion_requested_by,
          deletedAt: c.deleted_at,
          deletedBy: c.deleted_by,
          pending: c.pending_deletion,
          originalData: c,
        })),
        ...(banks.data || []).map((b: any) => ({
          id: b.id,
          type: 'bank_account' as const,
          typeLabel: 'Conta Bancária',
          name: `${b.bank_code} - ${b.description}`,
          requestedAt: b.deletion_requested_at || b.created_at,
          requestedBy: b.deletion_requested_by,
          deletedAt: b.deleted_at,
          deletedBy: b.deleted_by,
          pending: b.pending_deletion,
          originalData: b,
        })),
      ]

      const userIds = [
        ...new Set(unified.flatMap((i) => [i.requestedBy, i.deletedBy]).filter(Boolean)),
      ]
      if (userIds.length > 0) {
        const { data: users } = await supabase
          .from('employees')
          .select('user_id, name')
          .in('user_id', userIds)
        const userMap: Record<string, string> = {}
        users?.forEach((u: any) => {
          if (u.user_id) userMap[u.user_id] = u.name
        })
        unified.forEach((i) => {
          if (i.requestedBy) i.requestedByName = userMap[i.requestedBy] || 'Usuário Desconhecido'
          if (i.deletedBy) i.deletedByName = userMap[i.deletedBy] || 'Usuário Desconhecido'
        })
      }
      unified.sort(
        (a, b) => new Date(b.requestedAt || 0).getTime() - new Date(a.requestedAt || 0).getTime(),
      )
      setItems(unified)
      const fetchedNewUsers = newUsersRes.data || []
      setNewUsers(fetchedNewUsers)
      setSelectedIds((prev) => prev.filter((id) => unified.some((i) => i.id === id)))

      setActiveTab((prev) =>
        prev === 'pending' &&
        fetchedNewUsers.length > 0 &&
        unified.filter((i) => i.pending).length === 0
          ? 'new_users'
          : prev,
      )
    } catch (e: any) {
      toast({ title: 'Erro ao carregar', description: e.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPendingItems()
  }, [role])
  useEffect(() => {
    setSelectedIds([])
  }, [activeTab])

  const getTableForType = (type: string) => {
    const map: Record<string, string> = {
      organization: 'organizations',
      department: 'departments',
      employee: 'cadastro_usuarios',
      cost_center: 'cost_centers',
      chart_account: 'chart_of_accounts',
      bank_account: 'bank_accounts',
    }
    return map[type] || ''
  }

  const handleResendInvite = async (user: any) => {
    setProcessingId(`resend-${user.id}`)
    try {
      const { data: userData } = await supabase
        .from('cadastro_usuarios')
        .select('user_id, email, name')
        .eq('id', user.id)
        .single()

      if (!userData?.email || !userData?.user_id)
        throw new Error('Email ou ID do usuário não encontrado.')

      const { data, error } = await supabase.functions.invoke('manage-user', {
        body: {
          action: 'resend_email',
          user_id: userData.user_id,
          email: userData.email,
          name: userData.name,
        },
      })

      if (error) throw error
      if (!data?.success) throw new Error(data?.error || 'Erro ao reenviar convite.')

      toast({ title: 'Convite Reenviado', description: 'O e-mail foi reenviado com sucesso.' })
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' })
    } finally {
      setProcessingId(null)
    }
  }

  const handleApproveNewUser = async (id: string) => {
    setProcessingId(id)
    setIsProcessing(true)
    setProgress(50)
    try {
      const { data: userData } = await supabase
        .from('cadastro_usuarios')
        .select('email, name')
        .eq('id', id)
        .single()

      const { error } = await supabase
        .from('cadastro_usuarios')
        .update({ approval_status: 'approved' } as any)
        .eq('id', id)
      if (error) throw error

      const userFullData = newUsers.find((u) => u.id === id)
      await logAuditAction({ type: 'employee', id, originalData: userFullData }, 'APPROVE', {
        approval_status: { old: 'pending', new: 'approved' },
      })

      if (userData?.email) {
        await supabase.functions.invoke('send-email', {
          body: {
            to: userData.email,
            subject: 'Acesso Aprovado!',
            body: `Olá ${userData.name}, seu cadastro foi aprovado e você já pode acessar o sistema.`,
          },
        })
      }

      setProgress(100)
      toast({ title: 'Aprovado', description: 'O acesso do usuário foi liberado e notificado.' })
      fetchPendingItems()
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' })
    } finally {
      setProcessingId(null)
      setIsProcessing(false)
      setProgress(0)
    }
  }

  const handleRejectNewUser = async (id: string) => {
    if (!confirm('Deseja realmente rejeitar este cadastro? O registro será excluído.')) return
    setProcessingId(id)
    setIsProcessing(true)
    setProgress(50)
    try {
      const { data: userData } = await supabase
        .from('cadastro_usuarios')
        .select('user_id')
        .eq('id', id)
        .single()

      if (userData?.user_id) {
        await supabase.functions.invoke('manage-user', {
          body: { action: 'delete', user_id: userData.user_id },
        })
      }

      const userFullData = newUsers.find((u) => u.id === id)
      await logAuditAction({ type: 'employee', id, originalData: userFullData }, 'DELETE')

      const { error } = await supabase.from('cadastro_usuarios').delete().eq('id', id)
      if (error) throw error
      setProgress(100)
      toast({ title: 'Rejeitado', description: 'O cadastro foi removido.' })
      fetchPendingItems()
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' })
    } finally {
      setProcessingId(null)
      setIsProcessing(false)
      setProgress(0)
    }
  }

  const handleApprove = async (item: PendingItem) => {
    setProcessingId(item.id)
    setIsProcessing(true)
    setProgress(50)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      const { error } = await supabase
        .from(getTableForType(item.type))
        .update({
          pending_deletion: false,
          deleted_at: new Date().toISOString(),
          deleted_by: user?.id,
        } as any)
        .eq('id', item.id)
      if (error) throw error

      await logAuditAction(item, 'SOFT_DELETE', {
        pending_deletion: { old: true, new: false },
        deleted_at: { old: null, new: new Date().toISOString() },
      })

      setProgress(100)
      toast({ title: 'Aprovado', description: 'Registro movido para a lixeira.' })
      fetchPendingItems()
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' })
    } finally {
      setProcessingId(null)
      setIsProcessing(false)
      setProgress(0)
    }
  }

  const handleRestore = async (item: PendingItem) => {
    setProcessingId(item.id)
    setIsProcessing(true)
    setProgress(50)
    try {
      const { error } = await supabase
        .from(getTableForType(item.type))
        .update({
          pending_deletion: false,
          deletion_requested_at: null,
          deletion_requested_by: null,
          deleted_at: null,
          deleted_by: null,
        } as any)
        .eq('id', item.id)
      if (error) throw error

      await logAuditAction(item, 'RESTORE', {
        pending_deletion: { old: item.pending, new: false },
        deleted_at: { old: item.deletedAt, new: null },
      })

      setProgress(100)
      toast({ title: 'Restaurado', description: 'O registro voltou a ficar ativo no sistema.' })
      fetchPendingItems()
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' })
    } finally {
      setProcessingId(null)
      setIsProcessing(false)
      setProgress(0)
    }
  }

  const handleHardDelete = async (item: PendingItem) => {
    if (!confirm(`Deseja realmente EXCLUIR DEFINITIVAMENTE o(a) ${item.typeLabel} "${item.name}"?`))
      return
    setProcessingId(item.id)
    setIsProcessing(true)
    setProgress(50)
    try {
      if (item.type === 'employee' && item.originalData?.user_id) {
        await supabase.functions.invoke('manage-user', {
          body: { action: 'delete', user_id: item.originalData.user_id },
        })
      }

      await logAuditAction(item, 'DELETE')

      const { error } = await supabase.from(getTableForType(item.type)).delete().eq('id', item.id)
      if (error) throw error
      setProgress(100)
      toast({ title: 'Excluído', description: 'Registro removido permanentemente.' })
      fetchPendingItems()
    } catch (e: any) {
      toast({ title: 'Erro na exclusão', description: e.message, variant: 'destructive' })
    } finally {
      setProcessingId(null)
      setIsProcessing(false)
      setProgress(0)
    }
  }

  const handleBulkAction = async (action: 'approve' | 'restore' | 'hardDelete') => {
    if (selectedIds.length === 0) return
    if (
      action === 'hardDelete' &&
      !confirm(`Deseja EXCLUIR DEFINITIVAMENTE os ${selectedIds.length} itens selecionados?`)
    )
      return
    setProcessingId('bulk')
    setIsProcessing(true)
    setProgress(0)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      const itemsToProcess = items.filter((i) => selectedIds.includes(i.id))
      let processed = 0
      for (const item of itemsToProcess) {
        if (action === 'hardDelete') {
          if (item.type === 'employee' && item.originalData?.user_id) {
            await supabase.functions.invoke('manage-user', {
              body: { action: 'delete', user_id: item.originalData.user_id },
            })
          }
          await logAuditAction(item, 'DELETE')
          await supabase.from(getTableForType(item.type)).delete().eq('id', item.id)
        } else if (action === 'approve') {
          await supabase
            .from(getTableForType(item.type))
            .update({
              pending_deletion: false,
              deleted_at: new Date().toISOString(),
              deleted_by: user?.id,
            } as any)
            .eq('id', item.id)
          await logAuditAction(item, 'SOFT_DELETE', {
            pending_deletion: { old: true, new: false },
            deleted_at: { old: null, new: new Date().toISOString() },
          })
        } else {
          await supabase
            .from(getTableForType(item.type))
            .update({
              pending_deletion: false,
              deletion_requested_at: null,
              deletion_requested_by: null,
              deleted_at: null,
              deleted_by: null,
            } as any)
            .eq('id', item.id)
          await logAuditAction(item, 'RESTORE', {
            pending_deletion: { old: item.pending, new: false },
            deleted_at: { old: item.deletedAt, new: null },
          })
        }
        processed++
        setProgress((processed / itemsToProcess.length) * 100)
      }
      toast({
        title: 'Ação concluída',
        description: 'Os registros selecionados foram processados.',
      })
      setSelectedIds([])
      fetchPendingItems()
    } catch (e: any) {
      toast({ title: 'Erro na ação em lote', description: e.message, variant: 'destructive' })
    } finally {
      setProcessingId(null)
      setIsProcessing(false)
      setProgress(0)
    }
  }

  const pendingItems = items.filter((i) => i.pending)
  const trashItems = items.filter((i) => i.deletedAt)
  const uniqueTrashRequesters = useMemo(
    () =>
      Array.from(new Map(trashItems.map((i) => [i.deletedBy, i.deletedByName])).entries()).map(
        ([id, name]) => ({ id, name: name || 'Desconhecido' }),
      ),
    [trashItems],
  )

  const filteredTrash = trashItems.filter((item) => {
    if (filterCategory !== 'all' && item.type !== filterCategory) return false
    if (filterRequester !== 'all' && item.deletedBy !== filterRequester) return false
    if (filterDate && item.deletedAt) {
      const itemD = new Date(item.deletedAt)
      if (
        itemD.getFullYear() !== filterDate.getFullYear() ||
        itemD.getMonth() !== filterDate.getMonth() ||
        itemD.getDate() !== filterDate.getDate()
      )
        return false
    }
    return true
  })

  if (role !== 'admin')
    return (
      <div className="container mx-auto p-4 flex flex-col items-center justify-center min-h-[60vh]">
        <AlertCircle className="h-16 w-16 text-slate-300 mb-4" />
        <h2 className="text-2xl font-bold">Acesso Restrito</h2>
      </div>
    )

  const currentList = activeTab === 'pending' ? pendingItems : filteredTrash

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-7xl space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <CheckSquare className="h-8 w-8 text-blue-600" /> Central de Aprovações
        </h1>
        <p className="text-slate-500 mt-1">
          Gerencie as solicitações pendentes e itens na lixeira.
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as 'pending' | 'new_users' | 'trash')}
      >
        <TabsList className="mb-2 w-full justify-start overflow-x-auto">
          <TabsTrigger value="pending">Pendentes de Exclusão ({pendingItems.length})</TabsTrigger>
          <TabsTrigger value="new_users">Novos Usuários ({newUsers.length})</TabsTrigger>
          <TabsTrigger value="trash">Lixeira ({trashItems.length})</TabsTrigger>
        </TabsList>

        {activeTab === 'trash' && (
          <div className="flex flex-col sm:flex-row gap-4 mb-4 items-end bg-slate-50 p-4 rounded-md border border-slate-200">
            <div className="space-y-1">
              <Label>Categoria</Label>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-[160px] bg-white">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="organization">Empresa</SelectItem>
                  <SelectItem value="department">Departamento</SelectItem>
                  <SelectItem value="employee">Funcionário</SelectItem>
                  <SelectItem value="cost_center">Centro de Custo</SelectItem>
                  <SelectItem value="chart_account">Conta Contábil</SelectItem>
                  <SelectItem value="bank_account">Conta Bancária</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Excluído por</Label>
              <Select value={filterRequester} onValueChange={setFilterRequester}>
                <SelectTrigger className="w-[160px] bg-white">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {uniqueTrashRequesters.map(
                    (r) =>
                      r.id && (
                        <SelectItem key={r.id} value={r.id}>
                          {r.name}
                        </SelectItem>
                      ),
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Data</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-[160px] justify-start text-left font-normal bg-white',
                      !filterDate && 'text-muted-foreground',
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filterDate ? format(filterDate, 'dd/MM/yyyy') : 'Qualquer data'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={filterDate}
                    onSelect={setFilterDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            {(filterCategory !== 'all' || filterRequester !== 'all' || filterDate) && (
              <Button
                variant="ghost"
                onClick={() => {
                  setFilterCategory('all')
                  setFilterRequester('all')
                  setFilterDate(undefined)
                }}
                className="text-slate-500"
              >
                <Eraser className="h-4 w-4 mr-2" /> Limpar
              </Button>
            )}
          </div>
        )}

        {isProcessing && (
          <div className="mb-4 space-y-2 animate-in fade-in duration-300">
            <div className="flex justify-between text-sm text-slate-500 font-medium">
              <span>Processando ações, por favor aguarde...</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {selectedIds.length > 0 && (
          <div className="bg-slate-50 border border-slate-200 rounded-md p-3 flex items-center justify-between mb-4 animate-in slide-in-from-top-2">
            <span className="text-sm font-medium text-slate-700">
              {selectedIds.length} item(ns) selecionado(s)
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('restore')}
                disabled={processingId === 'bulk'}
                className="text-blue-600 hover:text-blue-700"
              >
                <RotateCcw className="h-4 w-4 mr-2" /> Restaurar
              </Button>
              {activeTab === 'pending' ? (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleBulkAction('approve')}
                  disabled={processingId === 'bulk'}
                >
                  <Trash2 className="h-4 w-4 mr-2" /> Aprovar Exclusão
                </Button>
              ) : (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleBulkAction('hardDelete')}
                  disabled={processingId === 'bulk'}
                >
                  <Trash2 className="h-4 w-4 mr-2" /> Excluir Definitivamente
                </Button>
              )}
            </div>
          </div>
        )}

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="py-12 flex justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : activeTab === 'new_users' ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 font-medium text-slate-600">Usuário</th>
                      <th className="px-4 py-3 font-medium text-slate-600">Email</th>
                      <th className="px-4 py-3 font-medium text-slate-600">Perfil Solicitado</th>
                      <th className="px-4 py-3 font-medium text-slate-600 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {newUsers.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-12 text-center text-slate-500">
                          Nenhum cadastro pendente de aprovação.
                        </td>
                      </tr>
                    ) : (
                      newUsers.map((user) => (
                        <tr
                          key={user.id}
                          className="border-b border-slate-100 hover:bg-slate-50/50"
                        >
                          <td className="px-4 py-3 font-medium text-slate-900">{user.name}</td>
                          <td className="px-4 py-3 text-slate-600">{user.email || '-'}</td>
                          <td className="px-4 py-3 text-slate-600 capitalize">
                            {user.role.replace('_', ' ')}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleResendInvite(user)}
                                disabled={!!processingId}
                                className="text-blue-600 hover:text-blue-700"
                              >
                                {processingId === `resend-${user.id}` ? (
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                  <Mail className="h-4 w-4 mr-2" />
                                )}
                                Reenviar
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRejectNewUser(user.id)}
                                disabled={!!processingId}
                              >
                                Rejeitar
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleApproveNewUser(user.id)}
                                disabled={!!processingId}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                Aprovar
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <ItemsTable
                items={currentList}
                isTrash={activeTab === 'trash'}
                selectedIds={selectedIds}
                onSelect={(id, c) =>
                  setSelectedIds((prev) => (c ? [...prev, id] : prev.filter((x) => x !== id)))
                }
                onSelectAll={(c) => setSelectedIds(c ? currentList.map((i) => i.id) : [])}
                processingId={processingId}
                onRestore={handleRestore}
                onApprove={handleApprove}
                onHardDelete={handleHardDelete}
              />
            )}
          </CardContent>
        </Card>
      </Tabs>
    </div>
  )
}
