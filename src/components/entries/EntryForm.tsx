import { useState } from 'react'
import { format } from 'date-fns'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'

type Props = {
  orgId: string
  accounts: any[]
  costCenters: any[]
  mappings: any[]
  onSuccess: () => void
}

export default function EntryForm({ orgId, accounts, costCenters, mappings, onSuccess }: Props) {
  const [form, setForm] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    desc: '',
    amount: '',
    cc: 'none',
    movementType: 'expense',
    deb: '',
    cred: '',
    status: 'Pendente',
  })
  const [loading, setLoading] = useState(false)

  const updateMapping = (cc: string, type: string) => {
    let deb = form.deb
    let cred = form.cred

    if (cc !== 'none') {
      const map = mappings.find((m) => m.cost_center_id === cc)
      if (map) {
        if (type === 'expense') {
          deb = map.chart_account_id
          if (cred === map.chart_account_id) cred = ''
        } else {
          cred = map.chart_account_id
          if (deb === map.chart_account_id) deb = ''
        }
      }
    }
    setForm((prev) => ({ ...prev, cc, movementType: type, deb, cred }))
  }

  const handleCcChange = (cc: string) => {
    updateMapping(cc, form.movementType)
  }

  const handleTypeChange = (type: string) => {
    updateMapping(form.cc, type)
  }

  const handleSubmit = async () => {
    if (!form.date || !form.desc || !form.amount || !form.deb || !form.cred) {
      return toast.error('Preencha todos os campos obrigatórios.')
    }
    if (form.deb === form.cred) {
      return toast.error(
        'Conta de débito e crédito devem ser diferentes (Validação de saldo zero).',
      )
    }
    const val = parseFloat(form.amount)
    if (isNaN(val) || val <= 0) return toast.error('Valor inválido.')

    setLoading(true)

    // 1. Salvar na tabela de accounting_entries
    const { error: err1 } = await supabase.from('accounting_entries').insert({
      organization_id: orgId,
      entry_date: form.date,
      description: form.desc,
      amount: val,
      debit_account_id: form.deb,
      credit_account_id: form.cred,
      cost_center_id: form.cc === 'none' ? null : form.cc,
      status: form.status,
    } as any)

    if (err1) {
      setLoading(false)
      return toast.error('Erro contábil: ' + err1.message)
    }

    // 2. Salvar na tabela de financial_movements
    await supabase.from('financial_movements').insert({
      organization_id: orgId,
      movement_date: form.date,
      description: form.desc,
      amount: val,
      cost_center_id: form.cc === 'none' ? null : form.cc,
      status: form.status,
    })

    toast.success('Lançamento adicionado com sucesso!')
    setForm({
      date: format(new Date(), 'yyyy-MM-dd'),
      desc: '',
      amount: '',
      cc: 'none',
      movementType: 'expense',
      deb: '',
      cred: '',
      status: 'Pendente',
    })
    setLoading(false)
    onSuccess()
  }

  return (
    <Card className="shadow-sm border-slate-200">
      <CardHeader className="bg-slate-50/50 border-b pb-4">
        <CardTitle className="text-lg">Novo Lançamento</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-8 gap-4 items-end">
          <div className="space-y-2 lg:col-span-1">
            <Label>Data *</Label>
            <Input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </div>
          <div className="space-y-2 lg:col-span-2">
            <Label>Descrição *</Label>
            <Input
              placeholder="Ex: Pagamento Fornecedor"
              value={form.desc}
              onChange={(e) => setForm({ ...form, desc: e.target.value })}
            />
          </div>
          <div className="space-y-2 lg:col-span-1">
            <Label>Valor (R$) *</Label>
            <Input
              type="number"
              step="0.01"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
            />
          </div>
          <div className="space-y-2 lg:col-span-1">
            <Label>Tipo de Mov.</Label>
            <Select value={form.movementType} onValueChange={handleTypeChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="expense">Despesa</SelectItem>
                <SelectItem value="revenue">Receita</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 lg:col-span-2">
            <Label>Centro de Custo</Label>
            <Select value={form.cc} onValueChange={handleCcChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum</SelectItem>
                {costCenters.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.code} - {c.description}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 lg:col-span-1">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Pendente">Pendente</SelectItem>
                <SelectItem value="Concluído">Concluído</SelectItem>
                <SelectItem value="Cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              Conta Débito *
              {form.cc !== 'none' && form.movementType === 'expense' && (
                <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">
                  Via Mapeamento DE/PARA
                </span>
              )}
            </Label>
            <Select value={form.deb} onValueChange={(v) => setForm({ ...form, deb: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a conta..." />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.account_code} - {a.account_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              Conta Crédito *
              {form.cc !== 'none' && form.movementType === 'revenue' && (
                <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">
                  Via Mapeamento DE/PARA
                </span>
              )}
            </Label>
            <Select value={form.cred} onValueChange={(v) => setForm({ ...form, cred: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a conta..." />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.account_code} - {a.account_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="mt-6 flex justify-end pt-4 border-t">
          <Button onClick={handleSubmit} disabled={loading}>
            <Plus className="w-4 h-4 mr-2" /> Adicionar Lançamento
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
