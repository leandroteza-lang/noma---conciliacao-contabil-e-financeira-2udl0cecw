import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { AccountList } from '@/components/AccountList'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function Index() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [accounts, setAccounts] = useState<any[]>([])
  const [organizations, setOrganizations] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [newAccount, setNewAccount] = useState({
    organization_id: '',
    account_code: '',
    description: '',
    bank_code: '',
    agency: '',
    account_number: '',
    classification: '',
  })

  const fetchData = async () => {
    setLoading(true)
    const [{ data: orgs }, { data: accs }] = await Promise.all([
      supabase.from('organizations').select('*').is('deleted_at', null),
      supabase.from('bank_accounts').select('*').is('deleted_at', null),
    ])
    if (orgs) setOrganizations(orgs)
    if (accs) {
      const mapped = accs.map((a) => ({
        id: a.id,
        organization_id: a.organization_id,
        contaContabil: a.account_code,
        descricao: a.description,
        banco: a.bank_code,
        agencia: a.agency,
        numeroConta: a.account_number,
        classificacao: a.classification,
      }))
      setAccounts(mapped)
    }
    setLoading(false)
  }

  useEffect(() => {
    if (user) fetchData()
  }, [user])

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir esta conta?')) return
    const { error } = await supabase
      .from('bank_accounts')
      .update({ pending_deletion: true })
      .eq('id', id)
    if (error) toast({ title: 'Erro', description: error.message, variant: 'destructive' })
    else {
      toast({ title: 'Sucesso', description: 'Conta enviada para lixeira.' })
      fetchData()
    }
  }

  const handleSave = async () => {
    if (!newAccount.organization_id || !newAccount.account_code) {
      toast({
        title: 'Aviso',
        description: 'Empresa e Conta Contábil são obrigatórios.',
        variant: 'destructive',
      })
      return
    }
    const { error } = await supabase.from('bank_accounts').insert([newAccount])
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' })
    } else {
      toast({ title: 'Sucesso', description: 'Conta cadastrada com sucesso.' })
      setIsAddOpen(false)
      setNewAccount({
        organization_id: '',
        account_code: '',
        description: '',
        bank_code: '',
        agency: '',
        account_number: '',
        classification: '',
      })
      fetchData()
    }
  }

  const filteredData = accounts.filter(
    (a) =>
      (a.descricao?.toLowerCase() || '').includes(search.toLowerCase()) ||
      (a.contaContabil?.toLowerCase() || '').includes(search.toLowerCase()),
  )

  return (
    <div className="container mx-auto max-w-6xl py-8 space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Listagem de Contas</h1>
          <p className="text-muted-foreground">Gerencie as contas bancárias e contas correntes.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link to="/import">Importar Planilha</Link>
          </Button>
          <Button onClick={() => setIsAddOpen(true)}>
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
              <CardDescription>Visualize e filtre suas contas cadastradas.</CardDescription>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar por descrição, código..."
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : (
            <AccountList
              accounts={filteredData}
              organizations={organizations}
              onDelete={handleDelete}
              onUpdateInline={async (id, field, val) => {
                const dbField =
                  field === 'contaContabil'
                    ? 'account_code'
                    : field === 'descricao'
                      ? 'description'
                      : field === 'banco'
                        ? 'bank_code'
                        : field === 'agencia'
                          ? 'agency'
                          : field === 'numeroConta'
                            ? 'account_number'
                            : field === 'classificacao'
                              ? 'classification'
                              : field
                const { error } = await supabase
                  .from('bank_accounts')
                  .update({ [dbField]: val })
                  .eq('id', id)
                if (!error) {
                  setAccounts((prev) => prev.map((a) => (a.id === id ? { ...a, [field]: val } : a)))
                  return true
                }
                return false
              }}
            />
          )}
        </CardContent>
      </Card>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Conta Bancária</DialogTitle>
            <DialogDescription>Preencha os dados para adicionar uma nova conta.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Empresa *</Label>
              <Select
                value={newAccount.organization_id}
                onValueChange={(v) => setNewAccount({ ...newAccount, organization_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {organizations.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Conta Contábil *</Label>
              <Input
                value={newAccount.account_code}
                onChange={(e) => setNewAccount({ ...newAccount, account_code: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input
                value={newAccount.description}
                onChange={(e) => setNewAccount({ ...newAccount, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Banco</Label>
                <Input
                  value={newAccount.bank_code}
                  onChange={(e) => setNewAccount({ ...newAccount, bank_code: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Agência</Label>
                <Input
                  value={newAccount.agency}
                  onChange={(e) => setNewAccount({ ...newAccount, agency: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Número da Conta</Label>
              <Input
                value={newAccount.account_number}
                onChange={(e) => setNewAccount({ ...newAccount, account_number: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
