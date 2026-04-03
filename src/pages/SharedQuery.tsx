import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Bot, User as UserIcon, ArrowLeft, Lock, Unlock } from 'lucide-react'
import { renderMarkdown } from '@/lib/markdown'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function SharedQuery() {
  const { id } = useParams()
  const [query, setQuery] = useState<{
    prompt: string
    content: string
    is_protected?: boolean
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [needsPassword, setNeedsPassword] = useState(false)
  const [passwordInput, setPasswordInput] = useState('')
  const [passwordError, setPasswordError] = useState(false)
  const [validating, setValidating] = useState(false)

  useEffect(() => {
    const fetchQuery = async () => {
      if (!id) return
      // Fetch only metadata first
      const { data, error: err } = await supabase
        .from('shared_queries')
        .select('prompt, is_protected, single_view, access_count')
        .eq('id', id)
        .maybeSingle()

      if (err || !data) {
        setError('Consulta não encontrada. O link pode estar quebrado ou a consulta foi removida.')
        setLoading(false)
        return
      }

      const queryData = data as any

      if (queryData.single_view && queryData.access_count > 0) {
        setError(
          'Este link era de visualização única e já foi acessado. O conteúdo não está mais disponível.',
        )
        setLoading(false)
        return
      }

      if (queryData.is_protected) {
        setNeedsPassword(true)
        setQuery({ prompt: queryData.prompt, content: '', is_protected: true })
        setLoading(false)
      } else {
        // Fetch content if not protected
        const { data: contentData, error: contentErr } = await supabase
          .from('shared_queries')
          .select('content')
          .eq('id', id)
          .maybeSingle()

        if (contentErr || !contentData) {
          setError('Erro ao carregar o conteúdo da consulta.')
        } else {
          setQuery({ prompt: queryData.prompt, content: contentData.content, is_protected: false })
          supabase.rpc('increment_shared_query_access', { query_id: id }).then()
        }
        setLoading(false)
      }
    }
    fetchQuery()
  }, [id])

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id || !passwordInput.trim()) return
    setValidating(true)
    setPasswordError(false)

    const { data, error } = await supabase
      .from('shared_queries')
      .select('content')
      .eq('id', id)
      .eq('password', passwordInput.trim())
      .maybeSingle()

    if (error || !data) {
      setPasswordError(true)
      setValidating(false)
    } else {
      setNeedsPassword(false)
      setQuery((prev) => (prev ? { ...prev, content: data.content } : null))
      setValidating(false)
      supabase.rpc('increment_shared_query_access', { query_id: id }).then()
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        Carregando consulta...
      </div>
    )
  }

  if (error || !query) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-muted/30 p-4">
        <Card className="max-w-md w-full text-center py-10 shadow-lg border-primary/10">
          <CardTitle className="text-xl mb-4">Acesso Indisponível</CardTitle>
          <p className="text-muted-foreground mb-6 px-4">
            {error || 'O link pode estar quebrado ou a consulta foi removida.'}
          </p>
          <Button asChild>
            <Link to="/">Ir para o Início</Link>
          </Button>
        </Card>
      </div>
    )
  }

  if (needsPassword) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-muted/30 p-4 animate-in fade-in zoom-in-95 duration-300">
        <Card className="max-w-md w-full shadow-lg border-primary/10">
          <CardHeader className="text-center pb-2">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
              <Lock className="w-6 h-6" />
            </div>
            <CardTitle className="text-xl">Consulta Protegida</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Esta consulta está protegida por senha. Digite a senha fornecida para acessar o
              conteúdo.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Input
                  type="password"
                  placeholder="Digite a senha..."
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className={
                    passwordError ? 'border-destructive focus-visible:ring-destructive' : ''
                  }
                  autoFocus
                />
                {passwordError && (
                  <p className="text-xs text-destructive">
                    Senha incorreta. Verifique e tente novamente.
                  </p>
                )}
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={validating || !passwordInput.trim()}
              >
                {validating ? 'Verificando...' : 'Acessar Conteúdo'}
                {!validating && <Unlock className="w-4 h-4 ml-2" />}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30 py-10 px-4 flex flex-col items-center">
      <div className="max-w-3xl w-full mb-4">
        <Button
          variant="ghost"
          asChild
          className="mb-4 text-muted-foreground hover:text-foreground"
        >
          <Link to="/app">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Sistema
          </Link>
        </Button>
        <Card className="shadow-lg border-primary/10 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          <CardHeader className="bg-primary text-primary-foreground p-5">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bot className="w-5 h-5" />
              Resultado da Consulta
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-8">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <UserIcon className="w-5 h-5" />
              </div>
              <div className="flex-1 bg-muted p-4 rounded-xl rounded-tl-none shadow-sm">
                <p className="text-sm font-medium leading-relaxed">{query.prompt}</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                <Bot className="w-5 h-5" />
              </div>
              <div className="flex-1 overflow-x-auto">
                <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-headings:font-bold">
                  {renderMarkdown(query.content)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
