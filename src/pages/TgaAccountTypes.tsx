import { useState, useEffect } from 'react'
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
import { Import, Search, Trash2, RefreshCcw } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { ImportTgaModal } from '@/components/ImportTgaModal'

export default function TgaAccountTypes() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [importOpen, setImportOpen] = useState(false)
  const { toast } = useToast()

  const loadData = async () => {
    setLoading(true)
    const { data: tgas, error } = await supabase
      .from('tipo_conta_tga')
      .select('*, organizations(name)')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (!error && tgas) {
      setData(tgas)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir?')) return
    const { error } = await supabase
      .from('tipo_conta_tga')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' })
    } else {
      toast({ title: 'Sucesso', description: 'Registro excluído.' })
      loadData()
    }
  }

  const filtered = data.filter(
    (i) =>
      (i.nome || '').toLowerCase().includes(search.toLowerCase()) ||
      (i.codigo || '').toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Tipos de Conta TGA</h1>
          <p className="text-slate-500">Gerencie os tipos de conta TGA do sistema.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            <Import className="h-4 w-4 mr-2" />
            Importar Planilha
          </Button>
          <Button onClick={loadData} variant="outline" size="icon">
            <RefreshCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border shadow-sm space-y-4">
        <div className="flex relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            className="pl-9"
            placeholder="Buscar por nome ou código..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50 dark:bg-slate-800">
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Abreviação</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead className="w-[100px] text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                    Nenhum registro encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.codigo}</TableCell>
                    <TableCell>{row.nome}</TableCell>
                    <TableCell>{row.abreviacao || '-'}</TableCell>
                    <TableCell>{row.organizations?.name || 'Geral'}</TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(row.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <ImportTgaModal open={importOpen} onOpenChange={setImportOpen} onImportSuccess={loadData} />
    </div>
  )
}
