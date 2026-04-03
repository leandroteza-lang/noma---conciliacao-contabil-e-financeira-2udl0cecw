import { useState, useRef, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Bot, User as UserIcon, Send, Loader2, Share2, Sparkles } from 'lucide-react'
import { renderMarkdown } from '@/lib/markdown'
import { useToast } from '@/hooks/use-toast'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export default function Index() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        'Olá! Sou a inteligência artificial da Molas Noma. Como posso ajudar na gestão financeira e contábil hoje?',
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || loading) return

    const userMsg: Message = { role: 'user', content: input.trim() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const { data, error } = await supabase.functions.invoke('chat', {
        body: { messages: newMessages },
      })

      if (error) throw error

      if (data?.reply) {
        setMessages([...newMessages, { role: 'assistant', content: data.reply }])
      } else {
        throw new Error('Resposta inválida do servidor')
      }
    } catch (err: any) {
      toast({
        title: 'Erro ao comunicar com o assistente',
        description: err.message,
        variant: 'destructive',
      })
      setMessages(newMessages)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const openShareModal = (content: string, index: number) => {
    let prompt = 'Consulta Gerada'
    for (let i = index - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        prompt = messages[i].content
        break
      }
    }
    const event = new CustomEvent('open-share-modal', { detail: { prompt, content } })
    window.dispatchEvent(event)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-5xl mx-auto bg-background/50">
      <div className="p-6 pb-4 border-b bg-card flex items-center gap-4 shadow-sm z-10 relative">
        <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
          <Sparkles className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Assistente Noma</h1>
          <p className="text-sm text-muted-foreground font-medium">
            Inteligência Contábil e Financeira
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-8 scroll-smooth">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-in fade-in slide-in-from-bottom-4 duration-500`}
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-primary/10 text-primary border border-primary/20'
              }`}
            >
              {msg.role === 'user' ? <UserIcon className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
            </div>

            <div
              className={`relative flex flex-col max-w-[90%] md:max-w-[75%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`p-4 md:p-5 rounded-2xl shadow-sm ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-tr-none'
                    : 'bg-card border border-primary/10 rounded-tl-none'
                }`}
              >
                {msg.role === 'user' ? (
                  <p className="whitespace-pre-wrap leading-relaxed text-sm md:text-base font-medium">
                    {msg.content}
                  </p>
                ) : (
                  <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none prose-p:leading-relaxed prose-headings:font-bold">
                    {renderMarkdown(msg.content)}
                  </div>
                )}
              </div>

              {msg.role === 'assistant' && idx > 0 && (
                <div className="mt-3 flex">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 text-xs font-medium text-muted-foreground hover:text-primary hover:bg-primary/5 hover:border-primary/20 transition-all gap-2 bg-background shadow-sm rounded-lg"
                    onClick={() => openShareModal(msg.content, idx)}
                  >
                    <Share2 className="w-4 h-4" />
                    Compartilhar Resultado
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-4 animate-in fade-in zoom-in-95 duration-300">
            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
              <Bot className="w-5 h-5" />
            </div>
            <div className="bg-card border border-primary/10 shadow-sm p-4 rounded-2xl rounded-tl-none flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <span className="text-sm font-medium text-muted-foreground">
                Analisando dados e estruturando resposta...
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} className="h-4" />
      </div>

      <div className="p-4 md:p-6 bg-card border-t shadow-[0_-4px_24px_rgba(0,0,0,0.02)] z-10 relative">
        <div className="relative flex items-end gap-3 max-w-4xl mx-auto">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Faça uma pergunta sobre seus dados, centro de custo ou movimentações..."
            className="min-h-[64px] max-h-[200px] resize-none pr-16 py-4 rounded-2xl shadow-sm bg-background border-primary/20 focus-visible:ring-primary text-base font-medium leading-relaxed"
          />
          <Button
            size="icon"
            className="absolute right-3 bottom-3 w-10 h-10 rounded-xl shadow-md transition-transform hover:scale-105 active:scale-95"
            disabled={!input.trim() || loading}
            onClick={handleSend}
          >
            <Send className="w-4 h-4 ml-0.5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
