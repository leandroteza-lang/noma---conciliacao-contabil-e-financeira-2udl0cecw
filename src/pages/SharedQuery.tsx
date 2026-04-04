import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Lock, Ban, EyeOff, Printer } from 'lucide-react'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const renderMarkdownAsCards = (text: string) => {
  if (!text) return null

  const lines = text.split('\n')
  const elements: React.ReactNode[] = []

  let currentList: { key: React.ReactNode; val: React.ReactNode }[] = []
  const cards: React.ReactNode[] = []

  let inTable = false
  let tableHeaders: React.ReactNode[] = []
  let tableRows: React.ReactNode[][] = []

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
          const label = textMatch[1]
          const url = urlMatch[1]
          if (url.startsWith('/')) {
            return (
              <Link
                key={i}
                to={url}
                className="inline-flex items-center justify-center gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-1.5 rounded-md no-underline font-medium transition-colors my-1.5 shadow-sm text-sm w-fit print:hidden"
              >
                {label}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="shrink-0"
                >
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </Link>
            )
          }
          return (
            <a
              key={i}
              href={url}
              className="text-primary hover:underline font-medium break-all print:text-blue-600 print:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {label}
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

  const flushCardsGrid = () => {
    flushListAsCard()
    if (cards.length > 0) {
      elements.push(
        <div
          key={`cards-grid-${elements.length}`}
          className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6 print:grid-cols-2 print:gap-4 break-inside-avoid"
        >
          {[...cards]}
        </div>,
      )
      cards.length = 0
    }
  }

  const flushListAsCard = () => {
    if (currentList.length > 0) {
      const titleItemIndex = currentList.findIndex((item) => {
        const keyStr = typeof item.key === 'string' ? item.key.toLowerCase() : ''
        const keySpanStr = item.key?.props?.children
          ? String(item.key.props.children).toLowerCase()
          : ''
        return (
          keyStr.includes('nome') ||
          keyStr.includes('código') ||
          keyStr.includes('empresa') ||
          keySpanStr.includes('nome') ||
          keySpanStr.includes('código') ||
          keySpanStr.includes('empresa')
        )
      })

      const titleIndex = titleItemIndex >= 0 ? titleItemIndex : 0
      const titleItem = currentList[titleIndex]
      const otherItems = currentList.filter((_, i) => i !== titleIndex)

      cards.push(
        <Card
          key={`card-${cards.length}`}
          className="shadow-sm print:shadow-none print:border print:border-gray-300 break-inside-avoid h-full"
        >
          <CardHeader className="py-3 px-4 bg-muted/30 border-b print:bg-transparent print:border-gray-300">
            <CardTitle className="text-base text-foreground print:text-black flex justify-between items-center gap-2">
              <span className="text-muted-foreground font-normal text-sm">{titleItem.key}</span>
              <span className="text-right truncate" title={String(titleItem.val)}>
                {titleItem.val || '-'}
              </span>
            </CardTitle>
          </CardHeader>
          {otherItems.length > 0 && (
            <CardContent className="p-4">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-3 text-sm">
                {otherItems.map((item, i) => (
                  <div
                    key={i}
                    className="flex flex-col sm:flex-row sm:justify-between border-b pb-1.5 last:border-0 border-border/50 print:border-gray-200"
                  >
                    <dt className="font-medium text-muted-foreground print:text-gray-600">
                      {item.key}
                    </dt>
                    <dd className="text-foreground sm:text-right font-medium print:text-black mt-0.5 sm:mt-0">
                      {item.val || '-'}
                    </dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          )}
        </Card>,
      )
      currentList = []
    }
  }

  const flushTable = () => {
    if (inTable) {
      if (tableHeaders.length > 0) {
        elements.push(
          <div
            key={`table-${elements.length}`}
            className="my-6 w-full overflow-x-auto rounded-md border border-border print:border-gray-300 print:overflow-visible break-inside-avoid"
          >
            <Table className="w-full text-sm">
              <TableHeader className="bg-muted/50 print:bg-transparent">
                <TableRow className="print:border-gray-400 border-border/50">
                  {tableHeaders.map((h, i) => (
                    <TableHead
                      key={i}
                      className="font-semibold text-foreground print:text-black print:border-b-2 print:border-gray-400 h-10"
                    >
                      {h}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableRows.map((row, i) => (
                  <TableRow key={i} className="print:border-gray-300 border-border/50">
                    {row.map((cell, j) => (
                      <TableCell
                        key={j}
                        className="text-foreground print:text-black print:py-2 py-2"
                      >
                        {cell}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>,
        )
      }
      inTable = false
      tableHeaders = []
      tableRows = []
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimLine = line.trim()

    if (!trimLine) {
      flushListAsCard()
      flushCardsGrid()
      elements.push(<div key={`br-${i}`} className="h-2" />)
      continue
    }

    const isTableLine = trimLine.includes('|')
    const isSeparator = isTableLine && trimLine.replace(/[|\-\s:]/g, '').length === 0

    if (isTableLine) {
      flushCardsGrid()
      let cleaned = trimLine
      if (cleaned.startsWith('|')) cleaned = cleaned.slice(1)
      if (cleaned.endsWith('|')) cleaned = cleaned.slice(0, -1)
      const cells = cleaned.split('|').map((c) => processInline(c.trim()))

      if (isSeparator) {
        inTable = true
        continue
      }

      if (!inTable) {
        const nextLine = lines[i + 1]?.trim() || ''
        const nextIsSeparator =
          nextLine.includes('|') && nextLine.replace(/[|\-\s:]/g, '').length === 0

        if (nextIsSeparator) {
          inTable = true
          tableHeaders = cells
        } else {
          elements.push(
            <p
              key={i}
              className="mb-2 text-foreground/90 leading-relaxed print:text-black break-inside-avoid"
            >
              {processInline(trimLine)}
            </p>,
          )
        }
      } else {
        tableRows.push(cells)
      }
    } else {
      flushTable()

      if (trimLine.startsWith('- ')) {
        const contentStr = trimLine.slice(2)
        const match = contentStr.match(/^\*\*(.*?)\*\*(.*)/)

        if (match) {
          let key = match[1].trim()
          if (key.endsWith(':')) key = key.slice(0, -1)

          let val = match[2].trim()
          if (val.startsWith(':')) val = val.slice(1).trim()

          currentList.push({
            key: processInline(key),
            val: processInline(val),
          })
        } else {
          flushCardsGrid()
          elements.push(
            <div key={`bullet-${i}`} className="flex items-start gap-2 mb-2 break-inside-avoid">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0 print:bg-black" />
              <div className="text-foreground/90 leading-relaxed print:text-black">
                {processInline(contentStr)}
              </div>
            </div>,
          )
        }
      } else {
        flushCardsGrid()

        if (trimLine.startsWith('### ')) {
          elements.push(
            <h3
              key={i}
              className="text-lg font-bold mt-6 mb-3 text-foreground print:text-black break-after-avoid"
            >
              {processInline(trimLine.slice(4))}
            </h3>,
          )
        } else if (trimLine.startsWith('## ')) {
          elements.push(
            <h2
              key={i}
              className="text-xl font-bold mt-8 mb-4 text-foreground border-b pb-2 border-border print:text-black print:border-gray-300 break-after-avoid"
            >
              {processInline(trimLine.slice(3))}
            </h2>,
          )
        } else if (trimLine.startsWith('# ')) {
          elements.push(
            <h1
              key={i}
              className="text-2xl font-extrabold mt-8 mb-4 text-foreground print:text-black break-after-avoid"
            >
              {processInline(trimLine.slice(2))}
            </h1>,
          )
        } else {
          elements.push(
            <p
              key={i}
              className="mb-2 text-foreground/90 leading-relaxed print:text-black break-inside-avoid"
            >
              {processInline(trimLine)}
            </p>,
          )
        }
      }
    }
  }

  flushTable()
  flushCardsGrid()

  return <div className="text-base print:text-[13px]">{elements}</div>
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
