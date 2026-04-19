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
import { Import, Search, Trash2, RefreshCcw, Download } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { ImportTgaModal } from '@/components/ImportTgaModal'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export default function TgaAccountTypes() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [importOpen, setImportOpen] = useState(false)
  const [exporting, setExporting] = useState(false)
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

  const handleExport = async (format: 'pdf' | 'excel' | 'browser') => {
    try {
      setExporting(true)
      const exportData = filtered.map((i) => ({
        id: i.id,
        codigo: i.codigo,
        nome: i.nome,
        abreviacao: i.abreviacao,
        empresa: i.organizations?.name || 'Geral',
      }))

      const res = await supabase.functions.invoke('export-tga-accounts', {
        body: { format, data: exportData },
      })

      if (res.error) throw res.error

      if (format === 'browser') {
        const newWindow = window.open('', '_blank')
        if (newWindow) {
          newWindow.document.write(res.data.html)
          newWindow.document.close()
        }
      } else if (format === 'pdf') {
        const link = document.createElement('a')
        link.href = res.data.pdf
        link.download = `tga_accounts_${new Date().toISOString().split('T')[0]}.pdf`
        link.click()
      } else if (format === 'excel') {
        const byteCharacters = atob(res.data.excel)
        const byteNumbers = new Array(byteCharacters.length)
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i)
        }
        const byteArray = new Uint8Array(byteNumbers)
        const blob = new Blob([byteArray], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        })
        const link = document.createElement('a')
        link.href = window.URL.createObjectURL(blob)
        link.download = `tga_accounts_${new Date().toISOString().split('T')[0]}.xlsx`
        link.click()
      }
    } catch (error: any) {
      toast({ title: 'Erro na exportação', description: error.message, variant: 'destructive' })
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Tipos de Conta TGA</h1>
          <p className="text-slate-500">Gerencie os tipos de conta TGA do sistema.</p>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={exporting}>
                <Download className="h-4 w-4 mr-2" />
                {exporting ? 'Exportando...' : 'Exportar'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport('browser')}>
                Visualizar no Navegador
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('pdf')}>Baixar PDF</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('excel')}>
                Baixar Excel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

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

        <div className="rounded-md overflow-hidden" style={{ border: '2px solid #800000' }}>
          <Table className="[&_tr]:border-b-0">
            <TableHeader className="bg-slate-50 dark:bg-slate-800">
              <TableRow className="hover:bg-transparent border-b border-slate-200 dark:border-slate-700">
                <TableHead className="py-2 px-3 h-auto text-black dark:text-white font-bold text-[15px]">
                  Código
                </TableHead>
                <TableHead className="py-2 px-3 h-auto text-black dark:text-white font-bold text-[15px]">
                  Nome
                </TableHead>
                <TableHead className="py-2 px-3 h-auto text-black dark:text-white font-bold text-[15px]">
                  Abreviação
                </TableHead>
                <TableHead className="py-2 px-3 h-auto text-black dark:text-white font-bold text-[15px]">
                  Empresa
                </TableHead>
                <TableHead className="w-[100px] text-center py-2 px-3 h-auto text-black dark:text-white font-bold text-[15px]">
                  Ações
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-4 text-slate-500 border-t border-slate-200 dark:border-slate-700"
                  >
                    Nenhum registro encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((row, index) => {
                  const isEven = index % 2 === 1
                  return (
                    <TableRow
                      key={row.id}
                      className={cn(
                        'hover:bg-transparent',
                        isEven
                          ? 'bg-[#800000] text-white font-bold hover:bg-[#800000]'
                          : 'bg-white text-slate-600 hover:bg-white dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-900',
                      )}
                    >
                      <TableCell
                        className={cn(
                          'py-1 px-3',
                          isEven ? 'text-white' : 'font-medium text-slate-900 dark:text-white',
                        )}
                      >
                        {row.codigo}
                      </TableCell>
                      <TableCell className="py-1 px-3">{row.nome}</TableCell>
                      <TableCell className="py-1 px-3">{row.abreviacao || '-'}</TableCell>
                      <TableCell className="py-1 px-3">
                        {row.organizations?.name || 'Geral'}
                      </TableCell>
                      <TableCell className="text-center py-1 px-3">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(row.id)}
                          className={cn(
                            'h-6 w-6',
                            isEven
                              ? 'text-white hover:text-white hover:bg-white/20'
                              : 'text-red-500 hover:text-red-700 hover:bg-red-50',
                          )}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <ImportTgaModal open={importOpen} onOpenChange={setImportOpen} onImportSuccess={loadData} />
    </div>
  )
}
