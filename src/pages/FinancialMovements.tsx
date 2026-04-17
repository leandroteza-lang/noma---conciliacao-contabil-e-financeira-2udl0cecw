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
import { ImportErpFinancialModal } from '@/components/ImportErpFinancialModal'

const erpColumns = [
  { key: 'data_emissao', label: 'Data Emissão', type: 'date' },
  { key: 'historico', label: 'Histórico' },
  { key: 'nome_cli_fornec', label: 'Nome Cli/Fornec' },
  { key: 'conta_caixa', label: 'Conta/Caixa' },
  { key: 'nome_caixa', label: 'Nome Caixa' },
  { key: 'c_custo', label: 'C.Custo' },
  { key: 'descricao_c_custo', label: 'Descrição C.Custo' },
  { key: 'valor', label: 'Valor', type: 'currency' },
  { key: 'valor_liquido', label: 'Valor Líquido', type: 'currency' },
  { key: 'compensado', label: 'Compensado' },
  { key: 'tipo_operacao', label: 'Tipo Operação' },
  { key: 'dt_compens', label: 'Dt Compens.', type: 'date' },
  { key: 'conta_caixa_destino', label: 'Conta/Caixa Destino' },
  { key: 'forma_pagto', label: 'Forma Pagto' },
  { key: 'n_documento', label: 'Nº Documento' },
  { key: 'fp', label: 'FP' },
  { key: 'n_cheque', label: 'Nº Cheque' },
  { key: 'data_vencto', label: 'Data Vencto', type: 'date' },
  { key: 'nominal_a', label: 'Nominal a' },
  { key: 'emitente_cheque', label: 'Emitente Cheque' },
  { key: 'cnpj_cpf', label: 'CNPJ/CPF' },
  { key: 'n_extrato', label: 'Nº Extrato' },
  { key: 'filial', label: 'Filial' },
  { key: 'data_canc', label: 'Data Canc.', type: 'date' },
  { key: 'data_estorno', label: 'Data Estorno', type: 'date' },
  { key: 'banco', label: 'Banco' },
  { key: 'c_corrente', label: 'C.Corrente' },
  { key: 'cod_cli_for', label: 'Cód.Cli/For' },
  { key: 'departamento', label: 'Departamento' },
]

export default function FinancialMovements() {
  const [movements, setMovements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [chartAccounts, setChartAccounts] = useState<any[]>([])
  const [mappingModalOpen, setMappingModalOpen] = useState(false)
  const [selectedMovement, setSelectedMovement] = useState<any>(null)
  const [selectedAccountId, setSelectedAccountId] = useState('')
  const [importModalOpen, setImportModalOpen] = useState(false)

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

  const filteredMovements = movements.filter(
    (m) =>
      m.historico?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.c_custo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.nome_cli_fornec?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.conta_caixa?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="space-y-6 animate-fade-in">
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
          <Button
            onClick={() => setImportModalOpen(true)}
            className="gap-2 bg-red-600 hover:bg-red-700 text-white"
          >
            <Upload className="w-4 h-4" />
            Importar Planilha ERP
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
                <TableHeader className="bg-muted/50 sticky top-0 z-20 shadow-sm">
                  <TableRow>
                    {erpColumns.map((col) => (
                      <TableHead key={col.key} className="whitespace-nowrap font-semibold">
                        {col.label}
                      </TableHead>
                    ))}
                    <TableHead className="whitespace-nowrap font-semibold text-center">
                      Status
                    </TableHead>
                    <TableHead className="whitespace-nowrap font-semibold">
                      DE/PARA Contábil
                    </TableHead>
                    <TableHead className="whitespace-nowrap font-semibold text-right sticky right-0 bg-muted/50 z-30 shadow-[-4px_0_10px_-4px_rgba(0,0,0,0.1)]">
                      Ações
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell
                        colSpan={erpColumns.length + 3}
                        className="h-32 text-center text-muted-foreground"
                      >
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-red-600" />
                        Carregando movimentos...
                      </TableCell>
                    </TableRow>
                  ) : filteredMovements.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={erpColumns.length + 3}
                        className="h-32 text-center text-muted-foreground"
                      >
                        Nenhum movimento encontrado. Importe uma planilha para começar.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredMovements.map((m) => (
                      <TableRow key={m.id} className="hover:bg-muted/30 transition-colors group">
                        {erpColumns.map((col) => (
                          <TableCell
                            key={col.key}
                            className="whitespace-nowrap max-w-[200px] truncate"
                            title={String(m[col.key] || '')}
                          >
                            {col.type === 'date'
                              ? m[col.key]
                                ? format(new Date(m[col.key]), 'dd/MM/yyyy', { locale: ptBR })
                                : '-'
                              : col.type === 'currency'
                                ? m[col.key]?.toLocaleString('pt-BR', {
                                    style: 'currency',
                                    currency: 'BRL',
                                  }) || '-'
                                : m[col.key] || '-'}
                          </TableCell>
                        ))}
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
                        <TableCell className="text-right sticky right-0 bg-card group-hover:bg-muted/30 transition-colors z-10 shadow-[-4px_0_10px_-4px_rgba(0,0,0,0.05)]">
                          <div className="flex justify-end gap-1 bg-inherit">
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

      <ImportErpFinancialModal
        open={importModalOpen}
        onOpenChange={setImportModalOpen}
        onImportSuccess={fetchMovements}
      />
    </div>
  )
}
