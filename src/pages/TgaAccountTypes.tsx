import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Search, Plus, Download, Edit2, Trash2, ArrowUpDown } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function TgaAccountTypes() {
  const [data, setData] = useState<any[]>([])
  const [orgs, setOrgs] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState({ field: 'codigo', asc: true })
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    organization_id: '',
    codigo: '',
    nome: '',
    abreviacao: '',
    observacoes: '',
  })
  const { toast } = useToast()

  const fetchData = async () => {
    const [{ data: tga }, { data: orgData }] = await Promise.all([
      supabase.from('tipo_conta_tga').select('*, organizations(name)').is('deleted_at', null),
      supabase.from('organizations').select('id, name').is('deleted_at', null),
    ])
    if (tga) setData(tga)
    if (orgData) setOrgs(orgData)
  }

  useEffect(() => {
    fetchData()
  }, [])

  const filteredData = useMemo(() => {
    return data
      .filter(
        (i) =>
          i.nome?.toLowerCase().includes(search.toLowerCase()) ||
          i.codigo?.toLowerCase().includes(search.toLowerCase()),
      )
      .sort((a, b) => {
        const fieldA = a[sort.field] || ''
        const fieldB = b[sort.field] || ''
        return sort.asc ? fieldA.localeCompare(fieldB) : fieldB.localeCompare(fieldA)
      })
  }, [data, search, sort])

  const handleSort = (field: string) => {
    setSort((prev) => ({ field, asc: prev.field === field ? !prev.asc : true }))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload = {
      ...formData,
      organization_id: formData.organization_id || null,
    }

    const req = editingId
      ? supabase.from('tipo_conta_tga').update(payload).eq('id', editingId)
      : supabase.from('tipo_conta_tga').insert(payload)

    const { error } = await req
    if (error) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' })
    } else {
      toast({ title: 'Sucesso', description: 'Registro salvo com sucesso.' })
      setIsModalOpen(false)
      fetchData()
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este tipo de conta?')) return
    const { error } = await supabase
      .from('tipo_conta_tga')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
    if (error) {
      toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' })
    } else {
      toast({ title: 'Sucesso', description: 'Registro excluído com sucesso.' })
      fetchData()
    }
  }

  const openModal = (item?: any) => {
    if (item) {
      setEditingId(item.id)
      setFormData({
        organization_id: item.organization_id || '',
        codigo: item.codigo,
        nome: item.nome,
        abreviacao: item.abreviacao || '',
        observacoes: item.observacoes || '',
      })
    } else {
      setEditingId(null)
      setFormData({ organization_id: '', codigo: '', nome: '', abreviacao: '', observacoes: '' })
    }
    setIsModalOpen(true)
  }

  const handleExport = () => {
    const csv = ['Empresa,Código,Nome,Abreviação,Observações']
      .concat(
        data.map(
          (i) =>
            `"${i.organizations?.name || ''}","${i.codigo}","${i.nome}","${i.abreviacao || ''}","${i.observacoes || ''}"`,
        ),
      )
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'tipos_conta_tga.csv'
    link.click()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-slate-800">Tipos de Conta TGA</h1>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" className="flex-1 sm:flex-none" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" /> Exportar
          </Button>
          <Button className="flex-1 sm:flex-none" onClick={() => openModal()}>
            <Plus className="w-4 h-4 mr-2" /> Novo Tipo
          </Button>
        </div>
      </div>

      <div className="flex items-center space-x-2 bg-white p-3 rounded-lg shadow-sm border border-slate-200">
        <Search className="w-5 h-5 text-slate-400" />
        <Input
          placeholder="Buscar por código ou nome..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border-0 focus-visible:ring-0 shadow-none px-0"
        />
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                className="cursor-pointer hover:bg-slate-50"
                onClick={() => handleSort('organization_id')}
              >
                Empresa <ArrowUpDown className="inline w-3 h-3 ml-1" />
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-slate-50"
                onClick={() => handleSort('codigo')}
              >
                Código <ArrowUpDown className="inline w-3 h-3 ml-1" />
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-slate-50"
                onClick={() => handleSort('nome')}
              >
                Nome <ArrowUpDown className="inline w-3 h-3 ml-1" />
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-slate-50"
                onClick={() => handleSort('abreviacao')}
              >
                Abrev. <ArrowUpDown className="inline w-3 h-3 ml-1" />
              </TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map((item) => (
              <TableRow key={item.id} className="hover:bg-slate-50/50">
                <TableCell className="font-medium text-slate-700">
                  {item.organizations?.name || '-'}
                </TableCell>
                <TableCell>{item.codigo}</TableCell>
                <TableCell>{item.nome}</TableCell>
                <TableCell>{item.abreviacao}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openModal(item)}>
                      <Edit2 className="w-4 h-4 text-blue-600" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filteredData.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                  Nenhum registro encontrado
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar' : 'Novo'} Tipo de Conta TGA</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Empresa</Label>
              <Select
                value={formData.organization_id}
                onValueChange={(v) => setFormData({ ...formData, organization_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a empresa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Geral / Nenhuma</SelectItem>
                  {orgs.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Código</Label>
                <Input
                  required
                  value={formData.codigo}
                  onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                  placeholder="Ex: 01"
                />
              </div>
              <div className="space-y-2">
                <Label>Abreviação</Label>
                <Input
                  maxLength={1}
                  value={formData.abreviacao}
                  onChange={(e) =>
                    setFormData({ ...formData, abreviacao: e.target.value.toUpperCase() })
                  }
                  placeholder="Ex: D"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                required
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Ex: Despesas Administrativas"
              />
            </div>
            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                placeholder="Detalhes adicionais..."
                className="resize-none h-20"
              />
            </div>
            <DialogFooter className="pt-4">
              <Button type="submit" className="w-full">
                Salvar Registro
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
