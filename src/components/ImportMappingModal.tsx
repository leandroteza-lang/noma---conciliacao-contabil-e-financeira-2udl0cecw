import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Loader2, UploadCloud, FileSpreadsheet } from 'lucide-react'

interface ImportMappingModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  orgId: string | null
}

export function ImportMappingModal({ open, onOpenChange, orgId }: ImportMappingModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<{
    inserted?: number
    rejected?: number
    errors?: any[]
  } | null>(null)

  const handleUpload = async () => {
    if (!file || !orgId) return
    setLoading(true)
    setResults(null)
    try {
      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          const result = e.target?.result as string
          if (!result) throw new Error('Falha ao ler o arquivo')
          const base64 = result.split(',')[1]

          const { data, error } = await supabase.functions.invoke('import-data', {
            body: {
              type: 'MAPPINGS',
              fileName: file.name,
              fileBase64: base64,
              organizationId: orgId,
            },
          })

          if (error) throw error
          if (data.error) throw new Error(data.error)

          setResults(data)
          if (data.inserted > 0) {
            toast.success(`${data.inserted} mapeamentos importados com sucesso!`)
            if (data.rejected === 0) {
              setTimeout(() => onOpenChange(false), 2000)
            }
          }
        } catch (err: any) {
          toast.error('Erro na importação: ' + err.message)
        } finally {
          setLoading(false)
        }
      }
      reader.readAsDataURL(file)
    } catch (err: any) {
      toast.error('Erro ao ler arquivo: ' + err.message)
      setLoading(false)
    }
  }

  const reset = () => {
    setResults(null)
    setFile(null)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        if (!val) reset()
        onOpenChange(val)
      }}
    >
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Importar Mapeamento DE/PARA</DialogTitle>
          <DialogDescription>
            Faça upload de uma planilha (Excel ou CSV) para vincular Centros de Custo às Contas
            Contábeis automaticamente.
          </DialogDescription>
        </DialogHeader>

        {!results ? (
          <div className="space-y-4 py-4">
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="file">Arquivo da Planilha</Label>
              <Input
                id="file"
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </div>

            <div className="bg-slate-50 p-4 rounded-md border text-sm text-slate-600">
              <p className="font-medium mb-2 flex items-center gap-2 text-slate-800">
                <FileSpreadsheet className="h-4 w-4 text-emerald-600" /> Colunas Obrigatórias:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  <strong>CENTROCUSTO:</strong> Código exato do Centro de Custo TGA.
                </li>
                <li>
                  <strong>CONTACONTABIL:</strong> Código Reduzido da Conta Contábil.
                </li>
              </ul>
              <p className="mt-3 text-xs opacity-80">
                Outras colunas serão ignoradas. Linhas sem correspondência exata no banco serão
                marcadas como rejeitadas.
              </p>
            </div>

            <Button className="w-full" onClick={handleUpload} disabled={!file || loading}>
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <UploadCloud className="mr-2 h-4 w-4" />
              )}
              {loading ? 'Processando...' : 'Importar Planilha'}
            </Button>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="flex justify-around text-center p-4 bg-slate-50 rounded-lg border">
              <div>
                <p className="text-3xl font-bold text-emerald-600">{results.inserted || 0}</p>
                <p className="text-xs text-slate-500 uppercase font-semibold mt-1">Mapeados</p>
              </div>
              <div className="w-px bg-slate-200"></div>
              <div>
                <p className="text-3xl font-bold text-red-500">{results.rejected || 0}</p>
                <p className="text-xs text-slate-500 uppercase font-semibold mt-1">Rejeitados</p>
              </div>
            </div>

            {results.errors && results.errors.length > 0 && (
              <div className="max-h-[200px] overflow-y-auto rounded-md border border-red-100 bg-red-50 p-3 text-sm">
                <p className="font-semibold text-red-800 mb-2">Divergências encontradas:</p>
                <ul className="space-y-2">
                  {results.errors.map((e: any, i: number) => (
                    <li key={i} className="text-red-700 flex gap-2">
                      <span className="font-medium whitespace-nowrap">Linha {e.row}:</span>
                      <span>{e.error}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <Button className="w-full" variant="outline" onClick={reset}>
              Fazer nova importação
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
