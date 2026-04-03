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
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { Bell, Lock, Link as LinkIcon, Check, Copy } from 'lucide-react'

export function ShareQueryModal() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [content, setContent] = useState('')
  const [notifyFirstAccess, setNotifyFirstAccess] = useState(true)
  const [isProtected, setIsProtected] = useState(false)
  const [password, setPassword] = useState('')
  const [generatedId, setGeneratedId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const { user } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    const handleOpen = (e: CustomEvent) => {
      setPrompt(e.detail?.prompt || '')
      setContent(e.detail?.content || '')
      setNotifyFirstAccess(true)
      setIsProtected(false)
      setPassword('')
      setGeneratedId(null)
      setCopied(false)
      setOpen(true)
    }

    window.addEventListener('open-share-modal' as any, handleOpen)
    return () => window.removeEventListener('open-share-modal' as any, handleOpen)
  }, [])

  const handleGenerate = async () => {
    if (!user) return
    if (!prompt || !content) {
      toast({
        title: 'Aviso',
        description: 'A consulta não pode estar vazia.',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    const { data, error } = await supabase
      .from('shared_queries')
      .insert({
        user_id: user.id,
        prompt,
        content,
        notify_first_access: notifyFirstAccess,
        is_protected: isProtected,
        password: isProtected ? password : null,
      })
      .select('id')
      .single()

    setLoading(false)

    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' })
    } else if (data) {
      setGeneratedId(data.id)
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

    const message = `*Gestão de Contas - Consulta Compartilhada* 🔒\n\nOlá! *${userName}* compartilhou um documento seguro com você.\n\n📄 *Assunto:* ${prompt}\n🔗 *Acessar agora:* ${url}\n\n_Aviso: Este é um link de acesso restrito._`

    navigator.clipboard.writeText(message)
    setCopied(true)
    toast({ title: 'Copiado!', description: 'Link copiado para a área de transferência.' })
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LinkIcon className="w-5 h-5 text-primary" />
            Gerar Link de Compartilhamento
          </DialogTitle>
          <DialogDescription>
            Configure as opções de segurança e notificação antes de gerar o link.
          </DialogDescription>
        </DialogHeader>

        {!generatedId ? (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Título / Prompt da Consulta</Label>
              <Input
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ex: Relatório de Receitas..."
              />
            </div>

            <div className="space-y-2">
              <Label>Conteúdo</Label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="h-24 resize-none"
                placeholder="Insira o conteúdo a ser compartilhado..."
              />
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2 cursor-pointer" htmlFor="notify-switch">
                  <Bell className="w-4 h-4 text-amber-500" />
                  Sino de Alerta (Notificações)
                </Label>
                <p className="text-xs text-muted-foreground">
                  Ativar notificações em tempo real no primeiro acesso.
                </p>
              </div>
              <Switch
                id="notify-switch"
                checked={notifyFirstAccess}
                onCheckedChange={setNotifyFirstAccess}
              />
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2 cursor-pointer" htmlFor="protect-switch">
                  <Lock className="w-4 h-4 text-primary" />
                  Proteger com Senha
                </Label>
                <p className="text-xs text-muted-foreground">
                  Exija uma senha para visualizar o conteúdo.
                </p>
              </div>
              <Switch id="protect-switch" checked={isProtected} onCheckedChange={setIsProtected} />
            </div>

            {isProtected && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                <Label>Senha de Acesso</Label>
                <Input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite uma senha forte..."
                />
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4 py-6 flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-300">
            <div className="w-12 h-12 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mb-2">
              <Check className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-medium">Link Gerado com Sucesso!</h3>
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

        <DialogFooter>
          {!generatedId ? (
            <>
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleGenerate} disabled={loading || !prompt || !content}>
                {loading ? 'Gerando...' : 'Gerar Link Seguro'}
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
