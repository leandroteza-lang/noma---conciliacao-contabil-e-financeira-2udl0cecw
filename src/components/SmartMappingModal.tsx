import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Checkbox } from '@/components/ui/checkbox'
import { Building2, ArrowRight } from 'lucide-react'

function getTokens(text: string) {
  if (!text) return []
  const stops = ['ltda', 'cia', 'inc', 's/a', 'sa', 'epp', 'me']
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stops.includes(w))
}

export function SmartMappingModal({ isOpen, onClose, onApply, accounts, companies }: any) {
  const [items, setItems] = useState<any[]>([])

  useEffect(() => {
    if (isOpen) {
      const result = []
      for (const acc of accounts) {
        const descTokens = getTokens(acc.description)
        const descLower = (acc.description || '').toLowerCase()

        let bestCompanyId = null
        let maxScore = 0

        for (const comp of companies) {
          let score = 0
          const compNameLower = comp.name.toLowerCase()
          const compTokens = getTokens(comp.name)

          if (
            descLower &&
            compNameLower &&
            (descLower.includes(compNameLower) || compNameLower.includes(descLower))
          ) {
            score += 1000
          }

          const matchedTokens = compTokens.filter((ct) => descTokens.includes(ct))
          score += matchedTokens.length * 10

          if (matchedTokens.includes('noma') && compNameLower.includes('noma parts')) {
            score += 5
          }

          if (score > 0 && score > maxScore) {
            maxScore = score
            bestCompanyId = comp.id
          }
        }

        if (bestCompanyId && bestCompanyId !== acc.organization_id) {
          result.push({
            accountId: acc.id,
            description: acc.description,
            currentCompany: acc.organizations?.name || 'Sem empresa vinculada',
            selectedCompanyId: bestCompanyId,
            apply: true,
          })
        }
      }
      setItems(result)
    } else {
      setItems([])
    }
  }, [isOpen, accounts, companies])

  const toggleApply = (accountId: string) => {
    setItems((prev) => prev.map((i) => (i.accountId === accountId ? { ...i, apply: !i.apply } : i)))
  }

  const changeCompany = (accountId: string, companyId: string) => {
    setItems((prev) =>
      prev.map((i) => (i.accountId === accountId ? { ...i, selectedCompanyId: companyId } : i)),
    )
  }

  const handleApply = () => {
    const payload = items
      .filter((i) => i.apply && i.selectedCompanyId)
      .map((i) => ({
        id: i.accountId,
        organization_id: i.selectedCompanyId,
      }))
    onApply(payload)
  }

  const appliedCount = items.filter((i) => i.apply).length

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Mapeamento Inteligente</DialogTitle>
          <DialogDescription>
            Encontramos palavras em comum entre a descrição das contas e os nomes das empresas
            cadastradas. Selecione as contas que deseja vincular automaticamente.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 flex flex-col mt-2">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground h-40 bg-muted/30 rounded-lg border border-dashed">
              <Building2 className="w-8 h-8 mb-4 opacity-50" />
              <p>Nenhuma nova sugestão de mapeamento encontrada para as contas atuais.</p>
            </div>
          ) : (
            <ScrollArea className="h-full pr-4 -mr-4">
              <div className="space-y-3 pb-4">
                {items.map((item) => (
                  <div
                    key={item.accountId}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 border rounded-lg bg-card gap-3 sm:gap-4 transition-colors hover:bg-accent/10"
                  >
                    <div className="flex items-center gap-3 flex-1 overflow-hidden w-full">
                      <Checkbox
                        checked={item.apply}
                        onCheckedChange={() => toggleApply(item.accountId)}
                        id={`check-${item.accountId}`}
                      />
                      <div className="flex flex-col overflow-hidden">
                        <label
                          htmlFor={`check-${item.accountId}`}
                          className="font-medium truncate cursor-pointer text-sm"
                          title={item.description}
                        >
                          {item.description || 'Conta sem descrição'}
                        </label>
                        <span className="text-xs text-muted-foreground">
                          Atual: {item.currentCompany}
                        </span>
                      </div>
                    </div>

                    <div className="hidden sm:flex">
                      <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
                    </div>

                    <div className="w-full sm:w-[260px] shrink-0 pl-7 sm:pl-0">
                      <Select
                        value={item.selectedCompanyId}
                        onValueChange={(val) => changeCompany(item.accountId, val)}
                        disabled={!item.apply}
                      >
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue placeholder="Selecione a empresa" />
                        </SelectTrigger>
                        <SelectContent>
                          {companies.map((comp: any) => (
                            <SelectItem key={comp.id} value={comp.id}>
                              {comp.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        <DialogFooter className="mt-4 border-t pt-4">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleApply} disabled={appliedCount === 0}>
            Aplicar Selecionados ({appliedCount})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
