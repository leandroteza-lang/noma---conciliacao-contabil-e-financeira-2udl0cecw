import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Lock, Ban, EyeOff, Printer } from 'lucide-react'

const renderMarkdownAsCards = (text: string) => {
  if (!text) return null

  const lines = text.split('\n')
  const elements: React.ReactNode[] = []

  let currentCard: { title: React.ReactNode; details: React.ReactNode[] } | null = null
  const cards: React.ReactNode[] = []

  const flushCards = () => {
    if (currentCard) {
      if (currentCard.details.length > 0) {
        cards.push(
          <Card
            key={`card-${cards.length}`}
            className="shadow-sm print:shadow-none print:border print:border-gray-300 break-inside-avoid"
          >
            <CardHeader className="py-3 px-4 bg-muted/30 border-b print:bg-transparent print:border-gray-300">
              <CardTitle className="text-base text-foreground print:text-black">
                {currentCard.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <dl className="space-y-2 text-sm">{currentCard.details}</dl>
            </CardContent>
          </Card>,
        )
      } else {
        cards.push(
          <div
            key={`simple-item-${cards.length}`}
            className="flex items-center gap-2 p-3 bg-muted/10 border rounded-md print:bg-transparent print:border-gray-300 break-inside-avoid"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-primary print:bg-black" />
            <span className="font-medium text-foreground print:text-black">
              {currentCard.title}
            </span>
          </div>,
        )
      }
      currentCard = null
    }
  }

  const flushCardsGrid = () => {
    flushCards()
    if (cards.length > 0) {
      elements.push(
        <div
          key={`cards-grid-${elements.length}`}
          className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6 print:grid-cols-2 print:gap-4"
        >
          {[...cards]}
        </div>,
      )
      cards.length = 0
    }
  }

  const processInline = (line: string) => {
    const parts = line.split(/(\*\*.*?\*\*|\[.*?\]\(.*?\))/g)
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-semibold text-foreground print:text-black">
            {part.slice(2, -2)}
          </strong>
        )
      }
      if (part.startsWith('[') && part.includes('](') && part.endsWith(')')) {
        const textMatch = part.match(/\[(.*?)\]/)
        const urlMatch = part.match(/\((.*?)\)/)
        if (textMatch && urlMatch) {
          return (
            <a
              key={i}
              href={urlMatch[1]}
              className="text-primary hover:underline font-medium break-all print:text-blue-600 print:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {textMatch[1]}
            </a>
          )
        }
      }
      return (
        <span key={i} className="print:text-black">
          {part}
        </span>
      )
    })
  }

  lines.forEach((line, index) => {
    const trimLine = line.trim()
    const leadingSpaces = line.length - line.trimStart().length

    if (trimLine.startsWith('- ') && leadingSpaces === 0) {
      flushCards()
      const titleContent = processInline(
        trimLine
          .slice(2)
          .replace(/^\*\*Nome:\*\*\s*/i, '')
          .replace(/^\*\*Código:\*\*\s*/i, ''),
      )
      currentCard = { title: titleContent, details: [] }
    } else if (trimLine.startsWith('- ') && leadingSpaces > 0 && currentCard) {
      const contentStr = trimLine.slice(2)
      const colonIndex = contentStr.indexOf(':')
      if (colonIndex > -1 && contentStr.startsWith('**')) {
        const key = contentStr.slice(0, colonIndex + 1).replace(/\*\*/g, '')
        const val = contentStr.slice(colonIndex + 1).trim()
        currentCard.details.push(
          <div
            key={index}
            className="flex flex-col sm:flex-row sm:justify-between py-1.5 border-b last:border-0 border-border/50 print:border-gray-200"
          >
            <dt className="font-medium text-muted-foreground print:text-gray-600">{key}</dt>
            <dd className="text-foreground sm:text-right font-medium print:text-black">
              {processInline(val) || '-'}
            </dd>
          </div>,
        )
      } else {
        currentCard.details.push(
          <div
            key={index}
            className="py-1.5 border-b last:border-0 border-border/50 print:border-gray-200"
          >
            <dd className="text-foreground print:text-black">{processInline(contentStr)}</dd>
          </div>,
        )
      }
    } else {
      flushCardsGrid()

      if (trimLine.startsWith('### ')) {
        elements.push(
          <h3 key={index} className="text-lg font-bold mt-6 mb-3 text-foreground print:text-black">
            {processInline(trimLine.slice(4))}
          </h3>,
        )
      } else if (trimLine.startsWith('## ')) {
        elements.push(
          <h2
            key={index}
            className="text-xl font-bold mt-8 mb-4 text-foreground border-b pb-2 border-border print:text-black print:border-black"
          >
            {processInline(trimLine.slice(3))}
          </h2>,
        )
      } else if (trimLine.startsWith('# ')) {
        elements.push(
          <h1
            key={index}
            className="text-2xl font-extrabold mt-8 mb-4 text-foreground print:text-black"
          >
            {processInline(trimLine.slice(2))}
          </h1>,
        )
      } else if (trimLine === '') {
        elements.push(<div key={index} className="h-2" />)
      } else {
        elements.push(
          <p key={index} className="mb-2 text-foreground/90 leading-relaxed print:text-black">
            {processInline(trimLine)}
          </p>,
        )
      }
    }
  })

  flushCardsGrid()

  return <div className="text-base print:text-sm">{elements}</div>
}

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
    <div className="min-h-screen bg-muted/20 p-4 md:p-8 animate-in fade-in duration-500 print:bg-white print:p-0">
      <div className="max-w-4xl mx-auto space-y-6 print:max-w-none print:w-full print:space-y-0">
        <Card className="shadow-lg border-muted print:shadow-none print:border-none print:bg-white print:rounded-none">
          <CardHeader className="bg-muted/30 border-b print:bg-transparent print:border-b-2 print:border-black print:px-0 print:pb-4 print:mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardDescription className="uppercase tracking-wider font-semibold text-xs text-primary mb-1 print:text-black">
                  Consulta Compartilhada
                </CardDescription>
                <CardTitle className="text-2xl print:text-black">{query.prompt}</CardTitle>
              </div>
              <Button onClick={() => window.print()} className="print:hidden w-full sm:w-auto">
                <Printer className="w-4 h-4 mr-2" />
                Imprimir / Exportar PDF
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6 print:p-0">
            <div className="max-w-none print:text-black">
              {renderMarkdownAsCards(query.content)}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
