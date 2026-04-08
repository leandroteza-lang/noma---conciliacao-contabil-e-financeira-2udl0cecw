import { useState, useEffect } from 'react'
import { Copy, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  organizations: { id: string; name: string }[]
}

export function ReplicateChartAccountsModal({ isOpen, onClose, onSuccess, organizations }: Props) {
  const { toast } = useToast()
  const [sourceOrg, setSourceOrg] = useState('')
  const [destOrg, setDestOrg] = useState('')
  const [step, setStep] = useState<'select' | 'validate' | 'confirm' | 'progress' | 'success'>(
    'select',
  )
  const [validation, setValidation] = useState({
    hasPlan: false,
    hasLinks: false,
    isIdentical: false,
  })
  const [progress, setProgress] = useState({ current: 0, total: 0, step: '' })

  useEffect(() => {
    if (isOpen) {
      setSourceOrg('')
      setDestOrg('')
      setStep('select')
      setValidation({ hasPlan: false, hasLinks: false, isIdentical: false })
      setProgress({ current: 0, total: 0, step: '' })
    }
  }, [isOpen])

  const handleValidate = async () => {
    if (!sourceOrg || !destOrg) {
      toast({
        title: 'Atenção',
        description: 'Selecione a empresa de origem e destino.',
        variant: 'destructive',
      })
      return
    }
    if (sourceOrg === destOrg) {
      toast({
        title: 'Atenção',
        description: 'A empresa de origem e destino não podem ser a mesma.',
        variant: 'destructive',
      })
      return
    }

    setStep('validate')

    const fetchAllAccounts = async (orgId: string, selectFields: string) => {
      let allData: any[] = []
      let hasMore = true
      let page = 0
      const pageSize = 1000

      while (hasMore) {
        let attempt = 0
        let success = false
        let fetchedData: any = null

        while (attempt < 3 && !success) {
          try {
            const { data, error } = await supabase
              .from('chart_of_accounts')
              .select(selectFields)
              .eq('organization_id', orgId)
              .is('deleted_at', null)
              .order('id')
              .range(page * pageSize, (page + 1) * pageSize - 1)

            if (error) throw error
            fetchedData = data
            success = true
          } catch (e: any) {
            attempt++
            if (attempt >= 3) throw e
            await new Promise((r) => setTimeout(r, 1000 * attempt))
          }
        }

        if (fetchedData && fetchedData.length > 0) {
          allData = [...allData, ...fetchedData]
          page++
          if (fetchedData.length < pageSize) hasMore = false
        } else {
          hasMore = false
        }
      }
      return allData
    }

    try {
      const sourceAccs = await fetchAllAccounts(sourceOrg, 'id, account_code, classification')

      if (!sourceAccs || sourceAccs.length === 0) {
        toast({
          title: 'Atenção',
          description: 'A empresa de origem não possui plano de contas.',
          variant: 'destructive',
        })
        setStep('select')
        return
      }

      const destAccs = await fetchAllAccounts(destOrg, 'id, account_code, classification')

      const hasPlan = destAccs && destAccs.length > 0
      let hasLinks = false
      let isIdentical = false

      if (hasPlan) {
        if (sourceAccs.length === destAccs.length) {
          const srcKeys = new Set(sourceAccs.map((a) => `${a.account_code}|${a.classification}`))
          const destKeys = destAccs.map((a) => `${a.account_code}|${a.classification}`)
          isIdentical = destKeys.every((k) => srcKeys.has(k))
        }

        const destIds = destAccs.map((a) => a.id)
        const chunkSize = 100
        for (let i = 0; i < destIds.length; i += chunkSize) {
          const chunk = destIds.slice(i, i + chunkSize)
          const [{ data: m }, { data: d }, { data: c }] = await Promise.all([
            supabase.from('account_mapping').select('id').in('chart_account_id', chunk).limit(1),
            supabase.from('accounting_entries').select('id').in('debit_account_id', chunk).limit(1),
            supabase
              .from('accounting_entries')
              .select('id')
              .in('credit_account_id', chunk)
              .limit(1),
          ])

          if ((m && m.length > 0) || (d && d.length > 0) || (c && c.length > 0)) {
            hasLinks = true
            break
          }
        }
      }

      setValidation({ hasPlan, hasLinks, isIdentical })
      setStep('confirm')
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' })
      setStep('select')
    }
  }

  const handleReplicate = async () => {
    setStep('progress')
    try {
      setProgress({ current: 0, total: 100, step: 'Iniciando replicação...' })

      if (validation.hasPlan) {
        setProgress({
          current: 10,
          total: 100,
          step: 'Limpando plano de contas atual do destino...',
        })

        let attempt = 0
        let success = false
        while (attempt < 3 && !success) {
          try {
            const { error: delErr } = await supabase.rpc('delete_organization_chart_accounts', {
              p_org_id: destOrg,
            })
            if (delErr) throw delErr
            success = true
          } catch (e: any) {
            attempt++
            if (attempt >= 3) throw e
            await new Promise((r) => setTimeout(r, 2000 * attempt))
          }
        }
      }

      setProgress({ current: 30, total: 100, step: 'Buscando plano de contas da origem...' })
      let fullSourceAccounts: any[] = []
      let hasMore = true
      let page = 0
      const pageSize = 1000

      while (hasMore) {
        let attempt = 0
        let success = false
        let fetchedData: any = null

        while (attempt < 3 && !success) {
          try {
            const { data, error: fetchErr } = await supabase
              .from('chart_of_accounts')
              .select('*')
              .eq('organization_id', sourceOrg)
              .is('deleted_at', null)
              .order('id')
              .range(page * pageSize, (page + 1) * pageSize - 1)

            if (fetchErr) throw fetchErr
            fetchedData = data
            success = true
          } catch (e: any) {
            attempt++
            if (attempt >= 3) throw e
            await new Promise((r) => setTimeout(r, 1000 * attempt))
          }
        }

        if (fetchedData && fetchedData.length > 0) {
          fullSourceAccounts = [...fullSourceAccounts, ...fetchedData]
          page++
          if (fetchedData.length < pageSize) hasMore = false
        } else {
          hasMore = false
        }
      }

      const toInsert = fullSourceAccounts.map((acc) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const {
          id,
          created_at,
          updated_at,
          deleted_at,
          deleted_by,
          deletion_requested_at,
          deletion_requested_by,
          pending_deletion,
          organization,
          ...rest
        } = acc as any
        return { ...rest, organization_id: destOrg }
      })

      setProgress({ current: 50, total: 100, step: `Inserindo contas...` })

      const chunkSize = 200
      let inserted = 0
      for (let i = 0; i < toInsert.length; i += chunkSize) {
        const chunk = toInsert.slice(i, i + chunkSize)

        let attempt = 0
        let success = false
        while (attempt < 3 && !success) {
          try {
            const { error: insErr } = await supabase.from('chart_of_accounts').insert(chunk)
            if (insErr) throw insErr
            success = true
          } catch (e: any) {
            attempt++
            if (attempt >= 3) throw e
            await new Promise((r) => setTimeout(r, 1000 * attempt))
          }
        }

        inserted += chunk.length
        setProgress({
          current: 50 + (inserted / toInsert.length) * 50,
          total: 100,
          step: `Inserindo contas (${inserted}/${toInsert.length})...`,
        })

        await new Promise((r) => setTimeout(r, 100))
      }

      setStep('success')
      toast({ title: 'Sucesso', description: 'Plano de contas replicado com sucesso!' })
      onSuccess()
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' })
      setStep('select')
    }
  }

  const renderConfirmMessage = () => {
    if (validation.hasLinks) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Replicação Bloqueada</AlertTitle>
          <AlertDescription>
            A empresa de destino já possui um plano de contas e existem vínculos (lançamentos ou
            mapeamentos) associados a ele. A replicação não pode ser feita para evitar perda de
            integridade.
          </AlertDescription>
        </Alert>
      )
    }

    if (validation.hasPlan) {
      if (validation.isIdentical) {
        return (
          <Alert className="bg-amber-50 border-amber-200 text-amber-800">
            <AlertCircle className="h-4 w-4 text-amber-800" />
            <AlertTitle className="text-amber-800">Plano Idêntico Encontrado</AlertTitle>
            <AlertDescription>
              A empresa de destino já possui um plano de contas exatamente idêntico ao da origem.
              Deseja sobrepor todo o plano mesmo assim?
            </AlertDescription>
          </Alert>
        )
      } else {
        return (
          <Alert className="bg-amber-50 border-amber-200 text-amber-800">
            <AlertCircle className="h-4 w-4 text-amber-800" />
            <AlertTitle className="text-amber-800">Plano Existente</AlertTitle>
            <AlertDescription>
              A empresa de destino já possui um plano de contas. Ao prosseguir, o plano atual será{' '}
              <strong>totalmente excluído e substituído</strong> pelo plano da origem. Deseja
              sobrepor?
            </AlertDescription>
          </Alert>
        )
      }
    }

    return (
      <Alert className="bg-blue-50 border-blue-200 text-blue-800">
        <AlertCircle className="h-4 w-4 text-blue-800" />
        <AlertTitle className="text-blue-800">Pronto para Replicar</AlertTitle>
        <AlertDescription>
          A empresa de destino não possui plano de contas. O plano será copiado da empresa de
          origem. Deseja prosseguir?
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && step !== 'progress' && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5" /> Replicar Plano de Contas
          </DialogTitle>
          <DialogDescription>
            Copie a estrutura completa do plano de contas de uma empresa para outra.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {step === 'select' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Empresa de Origem (Copiar de)</label>
                <Select value={sourceOrg} onValueChange={setSourceOrg}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a empresa origem" />
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
                <label className="text-sm font-medium">Empresa de Destino (Colar em)</label>
                <Select value={destOrg} onValueChange={setDestOrg}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a empresa destino" />
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
            </div>
          )}

          {step === 'validate' && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Validando dados e vínculos...</p>
            </div>
          )}

          {step === 'confirm' && <div className="space-y-4">{renderConfirmMessage()}</div>}

          {step === 'progress' && (
            <div className="space-y-4 py-4">
              <div className="flex justify-between text-sm font-medium text-slate-700">
                <span>{progress.step}</span>
                <span>{Math.round(progress.current)}%</span>
              </div>
              <Progress value={progress.current} className="h-2 transition-all" />
            </div>
          )}

          {step === 'success' && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4 text-center">
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <p className="text-lg font-medium">Replicação Concluída!</p>
              <p className="text-sm text-muted-foreground">
                O plano de contas foi copiado com sucesso para a empresa de destino.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          {step === 'select' && (
            <>
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button onClick={handleValidate} disabled={!sourceOrg || !destOrg}>
                Validar e Continuar
              </Button>
            </>
          )}
          {step === 'confirm' && (
            <>
              <Button variant="outline" onClick={() => setStep('select')}>
                Voltar
              </Button>
              <Button
                onClick={handleReplicate}
                disabled={validation.hasLinks}
                variant={validation.hasPlan && !validation.hasLinks ? 'destructive' : 'default'}
              >
                {validation.hasPlan ? 'Sobrepor Plano' : 'Prosseguir Cópia'}
              </Button>
            </>
          )}
          {step === 'success' && (
            <Button onClick={onClose} className="w-full">
              Concluir
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
