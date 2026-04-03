import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Loader2, Bot, User as UserIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { supabase } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

type Message = {
  role: 'user' | 'assistant' | 'system' | 'tool'
  content: string
}

const processInline = (text: string) => {
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|\[.*?\]\(.*?\))/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold">
          {part.slice(2, -2)}
        </strong>
      )
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={i}>{part.slice(1, -1)}</em>
    }
    const linkMatch = part.match(/\[(.*?)\]\((.*?)\)/)
    if (linkMatch) {
      return (
        <a
          key={i}
          href={linkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="underline text-primary hover:opacity-80"
        >
          {linkMatch[1]}
        </a>
      )
    }
    return <span key={i}>{part}</span>
  })
}

const renderMarkdown = (text: string) => {
  const lines = text.split('\n')
  return (
    <div className="flex flex-col gap-1">
      {lines.map((line, i) => {
        if (line.trim() === '') {
          return <div key={i} className="h-1"></div>
        }
        if (line.startsWith('### ')) {
          return (
            <h3 key={i} className="font-semibold text-base mt-2">
              {processInline(line.slice(4))}
            </h3>
          )
        }
        if (line.startsWith('## ')) {
          return (
            <h2 key={i} className="font-bold text-lg mt-3">
              {processInline(line.slice(3))}
            </h2>
          )
        }
        if (line.startsWith('# ')) {
          return (
            <h1 key={i} className="font-bold text-xl mt-4">
              {processInline(line.slice(2))}
            </h1>
          )
        }
        if (line.match(/^[-*]\s/)) {
          return (
            <div key={i} className="ml-2 flex gap-2">
              <span className="select-none">•</span>
              <span>{processInline(line.slice(2))}</span>
            </div>
          )
        }
        const numberedListMatch = line.match(/^(\d+\.\s)(.*)/)
        if (numberedListMatch) {
          return (
            <div key={i} className="ml-2 flex gap-2">
              <span className="select-none min-w-[1.2rem]">{numberedListMatch[1].trim()}</span>
              <span>{processInline(numberedListMatch[2])}</span>
            </div>
          )
        }

        return (
          <div key={i} className="min-h-[1rem]">
            {processInline(line)}
          </div>
        )
      })}
    </div>
  )
}

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        'Olá! Sou o assistente virtual da Molas Noma. Como posso ajudar com suas análises e conciliações hoje?',
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isOpen, isLoading])

  const handleSend = async () => {
    if (!input.trim()) return

    const userMessage: Message = { role: 'user', content: input }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const { data, error } = await supabase.functions.invoke('chat', {
        body: {
          messages: [...messages, userMessage]
            .filter((m) => m.role === 'user' || m.role === 'assistant')
            .map((m) => ({ role: m.role, content: m.content })),
        },
      })

      if (error) throw error

      if (data && data.reply) {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }])
      } else if (data && data.error) {
        setMessages((prev) => [...prev, { role: 'assistant', content: `Erro: ${data.error}` }])
      } else {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: 'Desculpe, ocorreu um erro ao processar sua solicitação.' },
        ])
      }
    } catch (error) {
      console.error('Chat error:', error)
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            'Desculpe, ocorreu um erro de conexão. Verifique se a API Key da OpenAI está configurada nos Secrets do Supabase.',
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end">
      {isOpen && (
        <Card className="w-[350px] sm:w-[400px] h-[500px] mb-4 flex flex-col shadow-2xl border-primary/20 animate-in slide-in-from-bottom-5">
          <CardHeader className="bg-primary text-primary-foreground p-4 rounded-t-lg flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5" />
              <CardTitle className="text-base font-medium">Assistente Operacional</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-primary-foreground hover:bg-primary/90 hover:text-white"
              onClick={() => setIsOpen(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent className="flex-1 p-0 overflow-hidden relative">
            <ScrollArea className="h-full p-4">
              <div className="flex flex-col gap-4 pb-4">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      'flex gap-2 max-w-[85%]',
                      msg.role === 'user' ? 'ml-auto flex-row-reverse' : '',
                    )}
                  >
                    <div
                      className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground',
                      )}
                    >
                      {msg.role === 'user' ? (
                        <UserIcon className="w-4 h-4" />
                      ) : (
                        <Bot className="w-4 h-4" />
                      )}
                    </div>
                    <div
                      className={cn(
                        'p-3 rounded-lg text-sm shadow-sm',
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground rounded-tr-none'
                          : 'bg-muted text-foreground rounded-tl-none',
                      )}
                    >
                      {msg.role === 'user' ? (
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                      ) : (
                        renderMarkdown(msg.content)
                      )}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-2 max-w-[85%]">
                    <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="p-3 rounded-lg text-sm bg-muted text-foreground rounded-tl-none flex items-center gap-2 shadow-sm">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" /> Processando
                      análise...
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          </CardContent>
          <CardFooter className="p-3 border-t bg-card">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSend()
              }}
              className="flex w-full gap-2"
            >
              <Input
                placeholder="Pergunte sobre seus dados..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isLoading}
                className="flex-1"
                autoFocus
              />
              <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </CardFooter>
        </Card>
      )}

      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center"
        >
          <MessageCircle className="w-6 h-6" />
        </Button>
      )}
    </div>
  )
}
