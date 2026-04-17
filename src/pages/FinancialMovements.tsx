import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, Map as MapIcon, Trash2, Upload, Loader2, ArrowRight } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

export default function FinancialMovements() {
  const [movements, setMovements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [chartAccounts, setChartAccounts] = useState<any[]>([])
  const [mappingModalOpen, setMappingModalOpen] = useState(false)
  const [selectedMovement, setSelectedMovement] = useState<any>(null)
  const [selectedAccountId, setSelectedAccountId] = useState('')
  const [importing, setImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { user } = useAuth()

  const fetchMovements = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('erp_financial_movements' as any)
      .select('*, chart_of_accounts(account_name, account_code)')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (error) {
      toast({
        title: 'Erro ao carregar movimentos',
        description: error.message,
        variant: 'destructive',
      })
    } else {
      setMovements(data || [])
    }
    setLoading(false)
  }

  const fetchChartAccounts = async () => {
    const { data, error } = await supabase
      .from('chart_of_accounts')
      .select('id, account_code, account_name')
      .is('deleted_at', null)
      .order('account_code', { ascending: true })

    if (!error && data) {
      setChartAccounts(data)
    }
  }

  useEffect(() => {
    if (user) {
      fetchMovements()
      fetchChartAccounts()
    }
  }, [user])

  const handleMapAccount = async () => {
    if (!selectedMovement || !selectedAccountId) return

    const { error } = await supabase
      .from('erp_financial_movements' as any)
      .update({
        mapped_account_id: selectedAccountId,
        status: 'Mapeado',
      })
      .eq('id', selectedMovement.id)

    if (error) {
      toast({ title: 'Erro ao mapear conta', description: error.message, variant: 'destructive' })
    } else {
      toast({ title: 'Sucesso', description: 'Movimento mapeado com sucesso' })
      setMappingModalOpen(false)
      setSelectedMovement(null)
      setSelectedAccountId('')
      fetchMovements()
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este movimento?')) return

    const { error } = await supabase
      .from('erp_financial_movements' as any)
      .update({ deleted_at: new Date().toISOString(), deleted_by: user?.id })
      .eq('id', id)

    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' })
    } else {
      toast({ title: 'Sucesso', description: 'Movimento excluído com sucesso' })
      fetchMovements()
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setImporting(true)
    const reader = new FileReader()
    reader.onload = async (e) => {
      const base64 = (e.target?.result as string).split(',')[1]

      try {
        const { data, error } = await supabase.functions.invoke('import-data', {
          body: {
            type: 'ERP_FINANCIAL_MOVEMENTS',
            fileBase64: base64,
            fileName: file.name,
            allowIncomplete: true,
            mode: 'INSERT_ONLY',
          },
        })

        if (error) throw error
        if (data.error) throw new Error(data.error)

        toast({
          title: 'Sucesso',
          description: `${data.inserted} registros importados com sucesso.`,
        })
        fetchMovements()
      } catch (err: any) {
        toast({ title: 'Erro na importação', description: err.message, variant: 'destructive' })
      } finally {
        setImporting(false)
        if (fileInputRef.current) fileInputRef.current.value = ''
      }
    }
    reader.readAsDataURL(file)
  }

  const filteredMovements = movements.filter(
    (m) =>
      m.historico?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      '' ||
      m.c_custo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      '' ||
      m.nome_cli_fornec?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      '' ||
      m.conta_caixa?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      '',
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-red-600">
            Movimento Financeiro TGA
          </h1>
          <p className="text-muted-foreground">
            Importe, visualize e mapeie movimentos financeiros vindos do seu ERP.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="file"
            accept=".xlsx, .xls, .csv"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileUpload}
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="gap-2 bg-red-600 hover:bg-red-700 text-white"
          >
            {importing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            {importing ? 'Importando...' : 'Importar Planilha ERP'}
          </Button>
        </div>
      </div>

      <Card className="border-border/50 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center space-x-2 w-full max-w-md relative">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3" />
            <Input
              placeholder="Buscar por histórico, fornecedor ou C. Custo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-full bg-background border-border/50"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border/50 overflow-hidden bg-card">
            <div className="overflow-x-auto max-h-[600px] relative">
              <Table>
                <TableHeader className="bg-muted/50 sticky top-0 z-10 shadow-sm">
                  <TableRow>
                    <TableHead className="whitespace-nowrap font-semibold">Data Emissão</TableHead>
                    <TableHead className="whitespace-nowrap font-semibold">Histórico</TableHead>
                    <TableHead className="whitespace-nowrap font-semibold">
                      Fornecedor/Cliente
                    </TableHead>
                    <TableHead className="whitespace-nowrap font-semibold">Conta/Caixa</TableHead>
                    <TableHead className="whitespace-nowrap font-semibold">
                      Centro de Custo
                    </TableHead>
                    <TableHead className="whitespace-nowrap font-semibold text-right">
                      Valor (R$)
                    </TableHead>
                    <TableHead className="whitespace-nowrap font-semibold text-center">
                      Status
                    </TableHead>
                    <TableHead className="whitespace-nowrap font-semibold">
                      DE/PARA Contábil
                    </TableHead>
                    <TableHead className="whitespace-nowrap font-semibold text-right">
                      Ações
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-red-600" />
                        Carregando movimentos...
                      </TableCell>
                    </TableRow>
                  ) : filteredMovements.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
                        Nenhum movimento encontrado. Importe uma planilha para começar.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredMovements.map((m) => (
                      <TableRow key={m.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="whitespace-nowrap font-medium text-muted-foreground">
                          {m.data_emissao
                            ? format(new Date(m.data_emissao), 'dd/MM/yyyy', { locale: ptBR })
                            : '-'}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate" title={m.historico}>
                          {m.historico || '-'}
                        </TableCell>
                        <TableCell className="max-w-[150px] truncate" title={m.nome_cli_fornec}>
                          {m.nome_cli_fornec || '-'}
                        </TableCell>
                        <TableCell className="max-w-[150px] truncate" title={m.nome_caixa}>
                          {m.conta_caixa} - {m.nome_caixa}
                        </TableCell>
                        <TableCell className="max-w-[150px] truncate" title={m.descricao_c_custo}>
                          {m.c_custo} - {m.descricao_c_custo}
                        </TableCell>
                        <TableCell className="text-right font-semibold whitespace-nowrap text-foreground">
                          {m.valor?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={m.status === 'Mapeado' ? 'default' : 'secondary'}
                            className={
                              m.status === 'Mapeado'
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-emerald-200'
                                : 'bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-200'
                            }
                          >
                            {m.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {m.chart_of_accounts ? (
                            <div className="flex items-center gap-1.5 text-sm font-medium text-emerald-700">
                              <ArrowRight className="w-3.5 h-3.5" />
                              <span title={m.chart_of_accounts.account_name}>
                                {m.chart_of_accounts.account_code} -{' '}
                                {m.chart_of_accounts.account_name}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground/60 italic flex items-center gap-1.5">
                              <ArrowRight className="w-3.5 h-3.5" /> Não vinculado
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              onClick={() => {
                                setSelectedMovement(m)
                                setSelectedAccountId(m.mapped_account_id || '')
                                setMappingModalOpen(true)
                              }}
                              title="Mapear Conta Contábil"
                            >
                              <MapIcon className="w-4 h-4 mr-1.5" />
                              Mapear
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(m.id)}
                              title="Excluir"
                              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={mappingModalOpen} onOpenChange={setMappingModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Mapear Movimento (DE/PARA)</DialogTitle>
            <DialogDescription>
              Vincule este movimento do ERP a uma Conta Contábil do sistema.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedMovement && (
              <div className="bg-muted/50 p-4 rounded-lg space-y-3 text-sm border border-border/50">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">
                      Histórico
                    </span>
                    <span className="font-medium line-clamp-2" title={selectedMovement.historico}>
                      {selectedMovement.historico || '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">
                      Valor
                    </span>
                    <span className="font-medium text-red-600">
                      {selectedMovement.valor?.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">
                    Conta/Caixa ERP (DE)
                  </span>
                  <span className="font-medium">
                    {selectedMovement.conta_caixa} - {selectedMovement.nome_caixa}
                  </span>
                </div>
              </div>
            )}

            <div className="flex items-center justify-center py-2">
              <div className="bg-red-600/10 p-2 rounded-full">
                <ArrowRight className="w-5 h-5 text-red-600" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Conta Contábil (PARA)</label>
              <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                <SelectTrigger className="w-full border-border/50">
                  <SelectValue placeholder="Selecione a conta contábil..." />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {chartAccounts.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id} className="cursor-pointer">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs bg-red-600/10 text-red-600 px-1.5 py-0.5 rounded">
                          {acc.account_code}
                        </span>
                        <span className="truncate max-w-[250px] font-medium">
                          {acc.account_name}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMappingModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleMapAccount}
              disabled={!selectedAccountId}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Confirmar Vínculo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
