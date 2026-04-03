import { useState, useRef, useEffect } from 'react'
import {
  MessageCircle,
  X,
  Send,
  Bot,
  User as UserIcon,
  Copy,
  Check,
  Download,
  Paperclip,
  FileText,
  Plus,
  Link as LinkIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { supabase } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import * as XLSX from 'xlsx'
import { renderMarkdown } from '@/lib/markdown'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'

type Message = {
  id: string
  role: 'user' | 'assistant' | 'system' | 'tool'
  content: string
  isTyping?: boolean
  attachedFileName?: string
}

const TypingEffect = ({ content, onComplete }: { content: string; onComplete?: () => void }) => {
  const [displayedContent, setDisplayedContent] = useState('')
  useEffect(() => {
    let i = 0
    const chunkSize = Math.max(1, Math.floor(content.length / 50))
    const timer = setInterval(() => {
      i += chunkSize
      if (i >= content.length) {
        setDisplayedContent(content)
        clearInterval(timer)
        if (onComplete) onComplete()
      } else {
        setDisplayedContent(content.slice(0, i))
      }
    }, 20)
    return () => clearInterval(timer)
  }, [content, onComplete])

  return (
    <div className="relative">
      {renderMarkdown(displayedContent)}
      {displayedContent.length < content.length && (
        <span className="inline-block w-1.5 h-3 ml-1 bg-primary animate-pulse align-baseline" />
      )}
    </div>
  )
}

const BotMessageActions = ({ content, prevPrompt }: { content: string; prevPrompt?: string }) => {
  const [copied, setCopied] = useState(false)
  const [shared, setShared] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(content)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } else {
        toast({
          title: 'Erro',
          description: 'Não foi possível copiar no seu navegador.',
          variant: 'destructive',
        })
      }
    } catch (err) {
      toast({ title: 'Erro', description: 'Falha ao copiar o texto.', variant: 'destructive' })
    }
  }

  const getRows = () =>
    content
      .split('\n')
      .map((line) => {
        if (line.includes('|')) {
          const cells = line.split('|').map((c) => c.trim())
          if (cells.every((c) => c === '' || c.match(/^[-:]+$/))) return null
          return cells.filter((c) => c !== '')
        }
        return [line.replace(/[*#`]/g, '').trim()]
      })
      .filter((r) => r !== null && r.length > 0 && r[0] !== '') as string[][]

  const handleDownloadExcel = () => {
    const ws = XLSX.utils.aoa_to_sheet(getRows())
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Resposta')
    XLSX.writeFile(wb, 'consulta_assistente.xlsx')
  }

  const handleDownloadCSV = () => {
    const csv = getRows()
      .map((r) => r.join(';'))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'consulta.csv'
    a.click()
  }

  const handleDownloadTXT = () => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'consulta.txt'
    a.click()
  }

  const handleDownloadPDF = () => {
    const win = window.open('', '', 'width=800,height=600')
    if (win) {
      win.document.write(
        `<html><head><title>Consulta</title><style>body{font-family:sans-serif;padding:20px;line-height:1.6;}table{border-collapse:collapse;width:100%;}td,th{border:1px solid #ddd;padding:8px;text-align:left;}</style></head><body><pre style="white-space:pre-wrap;font-family:inherit;">${content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre><script>window.onload=function(){window.print();window.close();}</script></body></html>`,
      )
      win.document.close()
    }
  }

  const handleShare = async () => {
    if (!user) {
      toast({ title: 'Erro', description: 'Usuário não autenticado.', variant: 'destructive' })
      return
    }

    try {
      const { data, error } = await supabase
        .from('shared_queries')
        .insert({
          user_id: user.id,
          prompt: (prevPrompt || 'Consulta ao Assistente').slice(0, 1000),
          content,
        })
        .select('id')
        .single()

      if (error) {
        console.error('Error generating link:', error)
        toast({ title: 'Erro', description: 'Falha ao gerar link.', variant: 'destructive' })
        return
      }

      if (data) {
        const url = `${window.location.origin}/consulta/${data.id}`
        try {
          if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(url)
            setShared(true)
            setTimeout(() => setShared(false), 2000)
            toast({
              title: 'Link copiado com sucesso!',
              description:
                'O link de compartilhamento foi gerado e copiado para sua área de transferência.',
            })
          } else {
            throw new Error('Clipboard API not available')
          }
        } catch (clipboardErr) {
          toast({
            title: 'Link Gerado!',
            description: `Copie a URL: ${url}`,
            duration: 10000,
          })
        }
      }
    } catch (err) {
      console.error('Unexpected error:', err)
      toast({
        title: 'Erro',
        description: 'Falha inesperada ao gerar link.',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="flex items-center gap-1 mt-3 pt-2 border-t border-border/40 text-muted-foreground">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6 hover:bg-background/50"
            title="Exportar"
          >
            <Download className="w-3.5 h-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="z-[110]">
          <DropdownMenuItem onClick={handleDownloadExcel}>Excel (.xlsx)</DropdownMenuItem>
          <DropdownMenuItem onClick={handleDownloadCSV}>CSV (.csv)</DropdownMenuItem>
          <DropdownMenuItem onClick={handleDownloadTXT}>Texto (.txt)</DropdownMenuItem>
          <DropdownMenuItem onClick={handleDownloadPDF}>PDF (.pdf)</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-6 w-6 hover:bg-background/50"
        onClick={handleShare}
        title="Compartilhar Link"
      >
        {shared ? (
          <Check className="w-3.5 h-3.5 text-green-500" />
        ) : (
          <LinkIcon className="w-3.5 h-3.5" />
        )}
      </Button>
      <div className="flex-1" />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-6 w-6 hover:bg-background/50"
        onClick={handleCopy}
        title="Copiar texto"
      >
        {copied ? (
          <Check className="w-3.5 h-3.5 text-green-500" />
        ) : (
          <Copy className="w-3.5 h-3.5" />
        )}
      </Button>
    </div>
  )
}

export function Chatbot() {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('chat')
  const [sessions, setSessions] = useState<any[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Olá! Sou o assistente virtual. Como posso ajudar com suas análises hoje?',
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [attachedFile, setAttachedFile] = useState<{
    name: string
    type: string
    content: string
  } | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isOpen, isLoading, activeTab])

  const fetchHistory = async () => {
    if (!user) return
    const { data } = await supabase
      .from('chat_sessions')
      .select('id, title, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (data) setSessions(data)
  }

  useEffect(() => {
    if (isOpen && activeTab === 'history') fetchHistory()
  }, [isOpen, activeTab, user])

  const startNewChat = () => {
    setCurrentSessionId(null)
    setMessages([
      {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Olá! Nova consulta iniciada. Como posso ajudar?',
      },
    ])
    setActiveTab('chat')
  }

  const loadSession = async (sessionId: string) => {
    setCurrentSessionId(sessionId)
    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
    if (data)
      setMessages(
        data.map((m) => ({
          id: m.id,
          role: m.role as any,
          content: m.content,
          attachedFileName: m.attached_file_name,
        })),
      )
    setActiveTab('chat')
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    let content = ''
    const ext = file.name.split('.').pop()?.toLowerCase() || ''
    try {
      if (ext === 'xlsx') {
        const buffer = await file.arrayBuffer()
        const ws = XLSX.read(buffer).Sheets[XLSX.read(buffer).SheetNames[0]]
        content = XLSX.utils.sheet_to_csv(ws)
        setAttachedFile({ name: file.name, type: ext, content })
      } else if (ext === 'pdf') {
        const reader = new FileReader()
        reader.onload = (ev) => {
          const res = ev.target?.result as string
          if (res) setAttachedFile({ name: file.name, type: ext, content: res.split(',')[1] })
        }
        reader.readAsDataURL(file)
        return
      } else {
        content = await file.text()
        setAttachedFile({ name: file.name, type: ext, content })
      }
    } catch (err) {
      console.error(err)
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSend = async () => {
    if (!input.trim() && !attachedFile) return
    const userContent = input.trim() || 'Arquivo em anexo.'
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userContent,
      attachedFileName: attachedFile?.name,
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    const currentFile = attachedFile
    setAttachedFile(null)

    let sId = currentSessionId
    if (!sId && user) {
      const { data: sData } = await supabase
        .from('chat_sessions')
        .insert({ user_id: user.id, title: userContent.slice(0, 35) || 'Consulta' })
        .select('id')
        .single()
      if (sData) {
        sId = sData.id
        setCurrentSessionId(sId)
      }
    }
    if (sId && user)
      await supabase.from('chat_messages').insert({
        session_id: sId,
        role: 'user',
        content: userContent,
        attached_file_name: userMessage.attachedFileName,
      })

    try {
      const { data, error } = await supabase.functions.invoke('chat', {
        body: {
          messages: [...messages, userMessage]
            .filter((m) => m.role === 'user' || m.role === 'assistant')
            .map((m) => ({ role: m.role, content: m.content })),
          file: currentFile,
        },
      })
      if (error) throw error
      const reply = data?.reply || (data?.error ? `Erro: ${data.error}` : 'Erro desconhecido.')
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), role: 'assistant', content: reply, isTyping: true },
      ])
      if (sId && user)
        await supabase
          .from('chat_messages')
          .insert({ session_id: sId, role: 'assistant', content: reply })
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: 'Erro de conexão ou API Key inválida.',
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end">
      {isOpen && (
        <Card className="w-[350px] sm:w-[400px] h-[580px] mb-4 flex flex-col shadow-2xl border-primary/20 animate-in slide-in-from-bottom-5">
          <CardHeader className="bg-primary text-primary-foreground p-3 rounded-t-lg flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5" />
              <CardTitle className="text-base font-medium">Assistente</CardTitle>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-primary-foreground hover:bg-primary/90"
                onClick={startNewChat}
                title="Nova Consulta"
              >
                <Plus className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-primary-foreground hover:bg-primary/90"
                onClick={() => setIsOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex-1 flex flex-col overflow-hidden"
          >
            <div className="px-3 pt-2 border-b bg-muted/20">
              <TabsList className="w-full grid grid-cols-2">
                <TabsTrigger value="chat">Chat</TabsTrigger>
                <TabsTrigger value="history">Histórico</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent
              value="chat"
              className="flex-1 overflow-hidden m-0 p-0 flex flex-col relative"
            >
              <ScrollArea className="flex-1 p-4">
                <div className="flex flex-col gap-5 pb-4">
                  {messages.map((msg, idx) => (
                    <div
                      key={msg.id}
                      className={cn(
                        'flex gap-2 max-w-[88%]',
                        msg.role === 'user' ? 'ml-auto flex-row-reverse' : '',
                      )}
                    >
                      <div
                        className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1',
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
                          'p-3 rounded-xl text-sm shadow-sm flex flex-col',
                          msg.role === 'user'
                            ? 'bg-primary text-primary-foreground rounded-tr-none'
                            : 'bg-muted text-foreground rounded-tl-none',
                        )}
                      >
                        {msg.role === 'user' ? (
                          <div className="whitespace-pre-wrap flex flex-col gap-1">
                            {msg.content}
                            {msg.attachedFileName && (
                              <div className="flex items-center gap-1 mt-1 text-[11px] opacity-90 bg-primary-foreground/15 px-2 py-1 rounded-md w-fit">
                                <Paperclip className="w-3 h-3" />
                                <span className="truncate max-w-[180px]">
                                  {msg.attachedFileName}
                                </span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <>
                            {msg.isTyping ? (
                              <TypingEffect
                                content={msg.content}
                                onComplete={() =>
                                  setMessages((prev) =>
                                    prev.map((m) =>
                                      m.id === msg.id ? { ...m, isTyping: false } : m,
                                    ),
                                  )
                                }
                              />
                            ) : (
                              renderMarkdown(msg.content)
                            )}
                            {!msg.isTyping && idx > 0 && (
                              <BotMessageActions
                                content={msg.content}
                                prevPrompt={messages[idx - 1]?.content}
                              />
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex gap-2 max-w-[85%]">
                      <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center shrink-0 mt-1">
                        <Bot className="w-4 h-4" />
                      </div>
                      <div className="p-3 rounded-xl text-sm bg-muted text-foreground rounded-tl-none flex items-center gap-2 shadow-sm h-10">
                        <span className="flex gap-1 items-center h-full">
                          <span className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce [animation-delay:-0.3s]" />
                          <span className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce [animation-delay:-0.15s]" />
                          <span className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce" />
                        </span>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
              <CardFooter className="p-3 border-t bg-card/50 backdrop-blur-sm shrink-0">
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    handleSend()
                  }}
                  className="flex w-full gap-2 items-end"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".txt,.csv,.xlsx,.pdf"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="shrink-0 rounded-full h-10 w-10 text-muted-foreground"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                  >
                    <Paperclip className="w-4 h-4" />
                  </Button>
                  <div className="flex-1 flex flex-col bg-background border rounded-2xl overflow-hidden focus-within:ring-1 focus-within:ring-ring">
                    {attachedFile && (
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/40 border-b text-xs">
                        <FileText className="w-3.5 h-3.5 text-primary" />
                        <span className="flex-1 truncate font-medium">{attachedFile.name}</span>
                        <button
                          type="button"
                          onClick={() => setAttachedFile(null)}
                          className="hover:text-destructive"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                    <Input
                      placeholder="Pergunte ou anexe um arquivo..."
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      disabled={isLoading}
                      className="border-0 focus-visible:ring-0 shadow-none rounded-none h-10 px-3 bg-transparent"
                      autoFocus
                    />
                  </div>
                  <Button
                    type="submit"
                    size="icon"
                    className="rounded-full shrink-0 h-10 w-10"
                    disabled={isLoading || (!input.trim() && !attachedFile)}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </CardFooter>
            </TabsContent>

            <TabsContent value="history" className="flex-1 overflow-hidden m-0 p-0">
              <ScrollArea className="h-full p-4">
                {sessions.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => loadSession(s.id)}
                    className="p-3 border rounded-lg mb-3 cursor-pointer hover:bg-muted/80 transition-colors shadow-sm"
                  >
                    <div className="font-medium text-[13px] truncate">{s.title}</div>
                    <div className="text-[11px] text-muted-foreground mt-1.5">
                      {new Date(s.created_at).toLocaleString()}
                    </div>
                  </div>
                ))}
                {sessions.length === 0 && (
                  <div className="text-center text-sm text-muted-foreground py-8">
                    Nenhum histórico encontrado.
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </Card>
      )}

      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 bg-primary text-primary-foreground flex items-center justify-center animate-in zoom-in-50"
        >
          <MessageCircle className="w-6 h-6" />
        </Button>
      )}
    </div>
  )
}
