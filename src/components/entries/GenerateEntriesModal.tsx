import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { Wand2 } from 'lucide-react'

export default function GenerateEntriesModal({
  costCenters,
  accounts,
  onSuccess,
}: {
  costCenters: any[]
  accounts: any[]
  onSuccess: () => void
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    type: 'expense',
    baseDate: '',
    installments: '1',
    amount: '',
    description: '',
    costCenterId: '',
    counterpartAccountId: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const amt = parseFloat(form.amount)
    if (
      !form.baseDate ||
      isNaN(amt) ||
      amt <= 0 ||
      !form.description ||
      !form.costCenterId ||
      !form.counterpartAccountId
    ) {
      return toast.error('Preencha todos os campos corretamente')
    }

    setLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('generate-entries', {
        body: {
          type: form.type,
          baseDate: form.baseDate,
          installments: parseInt(form.installments) || 1,
          amount: amt,
          description: form.description,
          costCenterId: form.costCenterId,
          counterpartAccountId: form.counterpartAccountId,
        },
      })

      if (error) throw new Error(error.message || 'Erro na função')
      if (data.error) throw new Error(data.error)

      if (data.generated > 0) {
        toast.success(`${data.generated} lançamentos gerados com sucesso!`)
      }
      if (data.errors && data.errors.length > 0) {
        data.errors.forEach((err: string) => toast.error(err))
      }

      if (data.generated > 0) {
        setOpen(false)
        onSuccess()
      }
    } catch (err: any) {
      toast.error(err.message || 'Erro ao gerar lançamentos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
          <Wand2 className="w-4 h-4" />
          Gerar Lançamentos
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Gerar Lançamentos Automáticos</DialogTitle>
            <DialogDescription>
              Crie lançamentos em lote baseados em regras e no mapeamento DE/PARA. O sistema
              validará automaticamente o saldo zero para as contas contábeis.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="expense">Despesa</SelectItem>
                    <SelectItem value="revenue">Receita</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Centro de Custo</Label>
                <Select
                  value={form.costCenterId}
                  onValueChange={(v) => setForm({ ...form, costCenterId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {costCenters.map((cc) => (
                      <SelectItem key={cc.id} value={cc.id}>
                        {cc.code} - {cc.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Conta Contrapartida</Label>
              <Select
                value={form.counterpartAccountId}
                onValueChange={(v) => setForm({ ...form, counterpartAccountId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a conta para fechar o saldo..." />
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data Base</Label>
                <Input
                  type="date"
                  required
                  value={form.baseDate}
                  onChange={(e) => setForm({ ...form, baseDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Recorrência (Meses)</Label>
                <Input
                  type="number"
                  min="1"
                  max="60"
                  required
                  value={form.installments}
                  onChange={(e) => setForm({ ...form, installments: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Valor (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Input
                  required
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Ex: Aluguel"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Gerando...' : 'Gerar e Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
