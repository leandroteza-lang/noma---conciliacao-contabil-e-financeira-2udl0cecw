import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Lock, Ban, EyeOff } from 'lucide-react'

export default function SharedQuery() {
  const { id } = useParams()
  const [query, setQuery] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [errorType, setErrorType] = useState<'revoked' | 'consumed' | 'not_found' | null>(null)
  const [password, setPassword] = useState('')
  const [authenticated, setAuthenticated] = useState(false)
  const [authError, setAuthError] = useState(false)

  useEffect(() => {
    const fetchQuery = async () => {
      if (!id) return
      const { data, error: fetchError } = await supabase
        .from('shared_queries')
        .select('*')
        .eq('id', id)
        .maybeSingle()

      if (fetchError || !data) {
        setError('Link não encontrado ou inválido.')
        setErrorType('not_found')
        setLoading(false)
        return
      }

      if (data.is_revoked) {
        setError(
          'Acesso Revogado: Este link foi desativado pelo proprietário e não está mais disponível.',
        )
        setErrorType('revoked')
        setLoading(false)
        return
      }

      if (data.single_view && data.access_count > 0) {
        setError('Acesso Indisponível: Este link era de visualização única e já foi consumido.')
        setErrorType('consumed')
        setLoading(false)
        return
      }

      setQuery(data)
      if (!data.is_protected) {
        setAuthenticated(true)
        incrementAccess(data.id)
      }
      setLoading(false)
    }
    fetchQuery()
  }, [id])

  const incrementAccess = async (queryId: string) => {
    await supabase.rpc('increment_shared_query_access', { query_id: queryId })
  }

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === query.password) {
      setAuthenticated(true)
      setAuthError(false)
      incrementAccess(query.id)
    } else {
      setAuthError(true)
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-muted/20">Carregando...</div>
    )
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-muted/20 p-4">
        <Card className="w-full max-w-md shadow-lg border-muted animate-in fade-in zoom-in-95 duration-300">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-2">
              {errorType === 'revoked' ? (
                <Ban className="w-6 h-6 text-destructive" />
              ) : errorType === 'consumed' ? (
                <EyeOff className="w-6 h-6 text-amber-500" />
              ) : (
                <EyeOff className="w-6 h-6 text-muted-foreground" />
              )}
            </div>
            <CardTitle className="text-xl">
              {errorType === 'revoked' ? 'Acesso Revogado' : 'Acesso Indisponível'}
            </CardTitle>
            <CardDescription className="text-base">{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (query?.is_protected && !authenticated) {
    return (
      <div className="flex h-screen items-center justify-center bg-muted/20 p-4">
        <Card className="w-full max-w-md shadow-lg border-muted animate-in fade-in zoom-in-95 duration-300">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
              <Lock className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="text-xl">Conteúdo Protegido</CardTitle>
            <CardDescription>
              Este link é protegido por senha. Digite a senha para acessar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="password"
                  placeholder="Digite a senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={authError ? 'border-destructive focus-visible:ring-destructive' : ''}
                />
                {authError && (
                  <p className="text-sm text-destructive text-center animate-in slide-in-from-top-1">
                    Senha incorreta. Tente novamente.
                  </p>
                )}
              </div>
              <Button type="submit" className="w-full">
                Acessar Conteúdo
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/20 p-4 md:p-8 animate-in fade-in duration-500">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="shadow-lg border-muted">
          <CardHeader className="bg-muted/30 border-b">
            <CardDescription className="uppercase tracking-wider font-semibold text-xs text-primary mb-1">
              Consulta Compartilhada
            </CardDescription>
            <CardTitle className="text-2xl">{query.prompt}</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap font-mono text-sm leading-relaxed">
              {query.content}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
