import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { Bell, Check, Copy, EyeOff } from 'lucide-react'

export function ShareQueryModal() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [content, setContent] = useState('')
  const [notifyFirstAccess, setNotifyFirstAccess] = useState(true)
  const [isProtected, setIsProtected] = useState(false)
  const [isSingleView, setIsSingleView] = useState(false)
  const [generatedId, setGeneratedId] = useState<string | null>(null)
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const { user } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    const handleOpen = (e: CustomEvent) => {
      setPrompt(e.detail?.prompt || 'Consulta Compartilhada')
      setContent(e.detail?.content || 'Conteúdo da consulta...')
      setNotifyFirstAccess(true)
      setIsProtected(false)
      setIsSingleView(false)
      setGeneratedId(null)
      setGeneratedPassword(null)
      setCopied(false)
      setOpen(true)
    }

    window.addEventListener('open-share-modal' as any, handleOpen)
    return () => window.removeEventListener('open-share-modal' as any, handleOpen)
  }, [])

  const handleGenerate = async () => {
    if (!user) return
    setLoading(true)

    const newPassword = isProtected ? Math.random().toString(36).slice(-8) : null

    const { data, error } = await supabase
      .from('shared_queries')
      .insert({
        user_id: user.id,
        prompt,
        content,
        notify_first_access: notifyFirstAccess,
        is_protected: isProtected,
        password: newPassword,
        single_view: isSingleView,
      })
      .select('id')
      .single()

    setLoading(false)

    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' })
    } else if (data) {
      setGeneratedId(data.id)
      setGeneratedPassword(newPassword)
      toast({ title: 'Sucesso', description: 'Link gerado com sucesso!' })
    }
  }

  const copyToClipboard = async () => {
    if (!generatedId) return
    const url = `${window.location.origin}/consulta/${generatedId}`

    let userName = 'UM CONSULTOR'
    if (user) {
      const { data } = await supabase
        .from('cadastro_usuarios')
        .select('name')
        .eq('user_id', user.id)
        .maybeSingle()
      if (data?.name) userName = data.name.toUpperCase()
    }

    let message = `*Gestão de Contas - Consulta Compartilhada* 🔒\n\nOlá! *${userName}* compartilhou um documento seguro com você.\n\n🔗 *Acessar agora:* ${url}`
    if (generatedPassword) {
      message += `\n🔑 *Senha de acesso:* ${generatedPassword}`
    }

    navigator.clipboard.writeText(message)
    setCopied(true)
    toast({ title: 'Copiado!', description: 'Link copiado para a área de transferência.' })
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Compartilhar Consulta</DialogTitle>
          <DialogDescription>
            Gere um link para compartilhar o resultado desta consulta com outras pessoas.
          </DialogDescription>
        </DialogHeader>

        {!generatedId ? (
          <div className="space-y-6 py-6">
            <div className="flex items-center justify-between">
              <Label htmlFor="protect-switch" className="font-medium cursor-pointer text-sm">
                Proteger com senha gerada automaticamente
              </Label>
              <Switch id="protect-switch" checked={isProtected} onCheckedChange={setIsProtected} />
            </div>

            <div className="flex items-center justify-between">
              <Label
                htmlFor="notify-switch"
                className="flex items-center gap-2 font-medium cursor-pointer text-sm"
              >
                Ativar notificações de acesso (sino)
                <Bell className="w-4 h-4 text-amber-500" />
              </Label>
              <Switch
                id="notify-switch"
                checked={notifyFirstAccess}
                onCheckedChange={setNotifyFirstAccess}
              />
            </div>

            <div className="flex items-center justify-between bg-primary/5 p-4 rounded-xl border-2 border-primary/20 relative overflow-hidden transition-all duration-300 hover:bg-primary/10">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500"></div>
              <Label
                htmlFor="single-view-switch"
                className="flex flex-col gap-1.5 font-medium cursor-pointer text-sm pl-2"
              >
                <span className="flex items-center gap-2">
                  Visualização Única
                  <EyeOff className="w-4 h-4 text-blue-500" />
                  <span className="bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded-sm uppercase tracking-wider font-bold animate-pulse">
                    Novo
                  </span>
                </span>
                <span className="text-xs text-muted-foreground font-normal">
                  O link expirará automaticamente após ser acessado pela primeira vez. Ideal para
                  dados sensíveis.
                </span>
              </Label>
              <Switch
                id="single-view-switch"
                checked={isSingleView}
                onCheckedChange={setIsSingleView}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-6 flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-300">
            <div className="w-12 h-12 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mb-2">
              <Check className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-medium">Link Gerado com Sucesso!</h3>

            {generatedPassword && (
              <div className="bg-amber-500/10 text-amber-600 px-4 py-2 rounded-md font-medium text-sm mb-2 w-full text-center">
                Senha gerada: <span className="font-bold tracking-wider">{generatedPassword}</span>
              </div>
            )}

            <p className="text-sm text-muted-foreground mb-4">
              Seu link está pronto e configurado.
            </p>
            <div className="flex w-full items-center space-x-2">
              <Input
                readOnly
                value={`${window.location.origin}/consulta/${generatedId}`}
                className="bg-muted font-mono text-xs"
              />
              <Button
                type="button"
                size="icon"
                onClick={copyToClipboard}
                className={copied ? 'bg-green-500 hover:bg-green-600' : ''}
              >
                {copied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        )}

        <DialogFooter className="sm:justify-end gap-2">
          {!generatedId ? (
            <>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleGenerate} disabled={loading} variant="destructive">
                {loading ? 'Gerando...' : 'Gerar Link'}
              </Button>
            </>
          ) : (
            <Button onClick={() => setOpen(false)} className="w-full" variant="outline">
              Fechar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
