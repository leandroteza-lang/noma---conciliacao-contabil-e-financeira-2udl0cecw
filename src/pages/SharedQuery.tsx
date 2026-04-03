import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Bot, User as UserIcon, ArrowLeft } from 'lucide-react'
import { renderMarkdown } from '@/lib/markdown'
import { Button } from '@/components/ui/button'

export default function SharedQuery() {
  const { id } = useParams()
  const [query, setQuery] = useState<{ prompt: string; content: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const fetchQuery = async () => {
      if (!id) return
      const { data, error: err } = await supabase
        .from('shared_queries')
        .select('prompt, content')
        .eq('id', id)
        .maybeSingle()

      if (err || !data) {
        setError(true)
      } else {
        setQuery(data)
      }
      setLoading(false)
    }
    fetchQuery()
  }, [id])

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
        <Card className="max-w-md w-full text-center py-10 shadow-lg">
          <CardTitle className="text-xl mb-4">Consulta não encontrada</CardTitle>
          <p className="text-muted-foreground mb-6">
            O link pode estar quebrado ou a consulta foi removida.
          </p>
          <Button asChild>
            <Link to="/">Ir para o Início</Link>
          </Button>
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
        <Card className="shadow-lg border-primary/10 overflow-hidden">
          <CardHeader className="bg-primary text-primary-foreground p-5">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bot className="w-5 h-5" />
              Resultado da Consulta
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-8">
            {/* User Prompt */}
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <UserIcon className="w-5 h-5" />
              </div>
              <div className="flex-1 bg-muted p-4 rounded-xl rounded-tl-none">
                <p className="text-sm font-medium leading-relaxed">{query.prompt}</p>
              </div>
            </div>

            {/* Assistant Response */}
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
