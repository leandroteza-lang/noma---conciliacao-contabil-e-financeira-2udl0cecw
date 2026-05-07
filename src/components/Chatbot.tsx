import { useState, useRef, useEffect } from 'react'
import {
  MessageCircle,
  X,
  Send,
  Loader2,
  FileText,
  FileSpreadsheet,
  Printer,
  History,
  ArrowLeft,
  Trash2,
  Edit3,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { Link } from 'react-router-dom'

const parseInline = (text: string) => {
  const parts = text.split(/\[([^\]]+)\]\(([^)]+)\)/g)
  if (parts.length > 1) {
    return parts.map((part, j) => {
      if (j % 3 === 0) {
        const boldParts = part.split(/\*\*([^*]+)\*\*/g)
        return boldParts.map((bp, k) =>
          k % 2 === 1 ? (
            <strong key={`bold-${j}-${k}`}>{bp}</strong>
          ) : (
            <span key={`text-${j}-${k}`}>{bp}</span>
          ),
        )
      }
      if (j % 3 === 1) {
        const url = parts[j + 1]
        if (url.startsWith('http')) {
          return (
            <a
              key={`link-${j}`}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-2 mb-1 px-3 py-1.5 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 rounded-md font-medium text-sm transition-colors cursor-pointer shadow-sm"
              onClick={(e) => e.stopPropagation()}
            >
              {part}
            </a>
          )
        }
        return (
          <Link
            key={`link-${j}`}
            to={url}
            className="inline-block mt-2 mb-1 px-3 py-1.5 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 rounded-md font-medium text-sm transition-colors cursor-pointer shadow-sm"
            onClick={(e) => e.stopPropagation()}
          >
            {part}
          </Link>
        )
      }
      return null
    })
  }
  const boldParts = text.split(/\*\*([^*]+)\*\*/g)
  return boldParts.map((bp, k) =>
    k % 2 === 1 ? <strong key={`bold-${k}`}>{bp}</strong> : <span key={`text-${k}`}>{bp}</span>,
  )
}

const parseMarkdown = (text: string) => {
  if (!text) return null

  if (text.includes('|---') || text.includes('| ---')) {
    const lines = text.split('\n')
    const result: React.ReactNode[] = []
    let inTable = false
    let tableHeaders: string[] = []
    let tableRows: string[][] = []
    let currentText = ''

    const flushText = () => {
      if (currentText.trim()) {
        result.push(
          <div key={`text-${result.length}`} className="whitespace-pre-wrap mb-3">
            {currentText.split('\n').map((line, i) => (
              <span key={i}>
                {parseInline(line)}
                <br />
              </span>
            ))}
          </div>,
        )
      }
      currentText = ''
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      if (line.startsWith('|') && line.endsWith('|')) {
        flushText()
        if (!inTable) {
          inTable = true
          tableHeaders = line
            .split('|')
            .map((c) => c.trim())
            .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1)
        } else {
          if (line.replace(/[|\-\s:]/g, '').length === 0) {
            continue
          }
          tableRows.push(
            line
              .split('|')
              .map((c) => c.trim())
              .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1),
          )
        }
      } else {
        if (inTable) {
          result.push(
            <div
              key={`table-${result.length}`}
              className="w-full overflow-x-auto mb-3 border rounded-md border-slate-200"
            >
              <table className="w-full text-xs text-left whitespace-nowrap">
                <thead className="bg-slate-100 border-b border-slate-200">
                  <tr>
                    {tableHeaders.map((h, idx) => (
                      <th key={idx} className="p-2 font-semibold text-slate-700">
                        {parseInline(h)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {tableRows.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-slate-50 transition-colors">
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className="p-2 text-slate-600">
                          {parseInline(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>,
          )
          inTable = false
          tableHeaders = []
          tableRows = []
        }
        currentText += lines[i] + '\n'
      }
    }

    flushText()
    if (inTable) {
      result.push(
        <div
          key={`table-${result.length}`}
          className="w-full overflow-x-auto mb-3 border rounded-md border-slate-200"
        >
          <table className="w-full text-xs text-left whitespace-nowrap">
            <thead className="bg-slate-100 border-b border-slate-200">
              <tr>
                {tableHeaders.map((h, idx) => (
                  <th key={idx} className="p-2 font-semibold text-slate-700">
                    {parseInline(h)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {tableRows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-slate-50 transition-colors">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="p-2 text-slate-600">
                      {parseInline(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      )
    }

    return <div className="space-y-1">{result}</div>
  }

  return (
    <div className="whitespace-pre-wrap">
      {text.split('\n').map((line, i) => (
        <span key={i}>
          {parseInline(line)}
          <br />
        </span>
      ))}
    </div>
  )
}

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [view, setView] = useState<'chat' | 'history'>('chat')
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([])
  const [sessions, setSessions] = useState<any[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)

  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const dragStart = useRef({ x: 0, y: 0 })

  useEffect(() => {
    if (scrollRef.current && view === 'chat') {
      const el = scrollRef.current
      setTimeout(() => {
        el.scrollTop = el.scrollHeight
      }, 100)
    }
  }, [messages, loading, isOpen, view])

  useEffect(() => {
    if (isOpen) {
      setPosition({ x: 0, y: 0 })
      fetchSessions()
    }
  }, [isOpen])

  const fetchSessions = async () => {
    const { data: sessionData } = await supabase.auth.getSession()
    if (!sessionData.session?.user) return
    const { data } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('user_id', sessionData.session.user.id)
      .order('updated_at', { ascending: false })
    if (data) setSessions(data)
  }

  const loadSession = async (id: string) => {
    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', id)
      .order('created_at', { ascending: true })
    if (data) {
      setMessages(data.map((m) => ({ role: m.role, content: m.content })))
      setCurrentSessionId(id)
      setView('chat')
    }
  }

  const createSession = async (firstMessage: string) => {
    const { data: sessionData } = await supabase.auth.getSession()
    if (!sessionData.session?.user) return null
    const title = firstMessage.substring(0, 30) + (firstMessage.length > 30 ? '...' : '')
    const { data } = await supabase
      .from('chat_sessions')
      .insert({ user_id: sessionData.session.user.id, title })
      .select()
      .single()
    return data?.id
  }

  const saveMessage = async (sessionId: string, role: string, content: string) => {
    await supabase.from('chat_messages').insert({ session_id: sessionId, role, content })
    await supabase
      .from('chat_sessions')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', sessionId)
  }

  const startNewChat = () => {
    setCurrentSessionId(null)
    setMessages([])
    setView('chat')
  }

  const deleteSession = async (id: string) => {
    await supabase.from('chat_sessions').delete().eq('id', id)
    setSessions((prev) => prev.filter((s) => s.id !== id))
    if (currentSessionId === id) {
      startNewChat()
    }
    toast({ title: 'Sucesso', description: 'Histórico removido.' })
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('.no-drag')) return
    setIsDragging(true)
    dragStart.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    }
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return
    setPosition({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y,
    })
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(false)
    ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)
  }

  const exportData = async (format: 'pdf' | 'excel' | 'txt') => {
    setExporting(true)
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session?.access_token

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/export-chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ format, messages }),
        },
      )

      if (!response.ok) throw new Error('Erro ao exportar chat')

      const data = await response.json()

      if (format === 'pdf') {
        const a = document.createElement('a')
        a.href = data.pdf
        a.download = `chat-noma-${new Date().getTime()}.pdf`
        a.click()
      } else if (format === 'excel') {
        const bytes = new Uint8Array(
          atob(data.excel)
            .split('')
            .map((c) => c.charCodeAt(0)),
        )
        const blob = new Blob([bytes], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `chat-noma-${new Date().getTime()}.xlsx`
        a.click()
        URL.revokeObjectURL(url)
      } else if (format === 'txt') {
        const blob = new Blob([data.txt], { type: 'text/plain;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `chat-noma-${new Date().getTime()}.txt`
        a.click()
        URL.revokeObjectURL(url)
      }
      toast({ title: 'Sucesso', description: 'Exportação concluída!' })
    } catch (error: any) {
      toast({ title: 'Erro na exportação', description: error.message, variant: 'destructive' })
    } finally {
      setExporting(false)
    }
  }

  const handleSend = async () => {
    if (!input.trim()) return

    const userMessage = input
    setInput('')
    setLoading(true)

    let sessionId = currentSessionId
    if (!sessionId) {
      sessionId = await createSession(userMessage)
      setCurrentSessionId(sessionId)
      if (sessionId) {
        setSessions((prev) => [
          {
            id: sessionId,
            title: userMessage.substring(0, 30),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          ...prev,
        ])
      }
    }

    const newMessages = [...messages, { role: 'user', content: userMessage }]
    setMessages(newMessages)

    if (sessionId) {
      await saveMessage(sessionId, 'user', userMessage)
    }

    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session?.access_token

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ messages: newMessages }),
      })

      if (!response.ok) throw new Error('Erro ao enviar mensagem')

      const data = await response.json()
      const reply = data.reply || data.error || 'Erro desconhecido'

      setMessages((prev) => [...prev, { role: 'assistant', content: reply }])

      if (sessionId) {
        await saveMessage(sessionId, 'assistant', reply)
      }
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' })
      const errorMsg = 'Desculpe, ocorreu um erro ao processar sua mensagem.'
      setMessages((prev) => [...prev, { role: 'assistant', content: errorMsg }])
      if (sessionId) {
        await saveMessage(sessionId, 'assistant', errorMsg)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 z-50 bg-indigo-950 hover:bg-indigo-900"
        >
          <MessageCircle className="h-6 w-6 text-white" />
        </Button>
      )}

      {isOpen && (
        <Card
          style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
          className="fixed bottom-6 right-6 w-[360px] sm:w-[500px] h-[550px] md:h-[650px] shadow-2xl flex flex-col z-50 border-indigo-100 animate-in slide-in-from-bottom-10 fade-in duration-300"
        >
          <CardHeader
            className="bg-indigo-950 text-white rounded-t-xl py-3 px-4 flex flex-row items-center justify-between space-y-0 cursor-grab active:cursor-grabbing touch-none select-none"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            <CardTitle className="text-sm font-medium flex items-center gap-2 pointer-events-none">
              <MessageCircle className="h-4 w-4" /> Assistente Virtual NOMA
            </CardTitle>
            <div className="flex items-center gap-1 no-drag">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-indigo-200 hover:bg-indigo-900 hover:text-white"
                onClick={() => startNewChat()}
                title="Nova Conversa"
              >
                <Edit3 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-indigo-200 hover:bg-indigo-900 hover:text-white"
                onClick={() => {
                  setView('history')
                  fetchSessions()
                }}
                title="Histórico"
              >
                <History className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-white hover:bg-indigo-900 hover:text-white"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent
            className="flex-1 p-4 overflow-y-auto bg-slate-50/50 min-h-0"
            ref={scrollRef}
          >
            {view === 'history' ? (
              <div className="space-y-3">
                <div className="flex items-center mb-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setView('chat')}
                    className="h-8 px-2 mr-2"
                  >
                    <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
                  </Button>
                  <h3 className="font-semibold text-slate-700">Histórico de Conversas</h3>
                </div>
                {sessions.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-4">
                    Nenhum histórico encontrado.
                  </p>
                ) : (
                  sessions.map((s) => (
                    <div
                      key={s.id}
                      onClick={() => loadSession(s.id)}
                      className="p-3 bg-white border border-slate-200 rounded-lg shadow-sm hover:border-indigo-300 cursor-pointer transition-colors group relative"
                    >
                      <h4 className="font-medium text-sm text-slate-800 line-clamp-1 pr-6">
                        {s.title}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1">
                        {new Date(s.updated_at).toLocaleDateString('pt-BR')}
                      </p>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteSession(s.id)
                        }}
                        className="absolute right-2 top-2 h-6 w-6 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-600 transition-opacity"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            ) : messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-3 mt-10">
                <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
                  <MessageCircle className="h-6 w-6 text-indigo-950" />
                </div>
                <p className="text-sm text-center max-w-[250px]">
                  Olá! Sou o assistente NOMA. Como posso ajudar você hoje?
                </p>
              </div>
            ) : (
              <div className="space-y-4 pb-4">
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={cn(
                      'flex w-full',
                      msg.role === 'user' ? 'justify-end' : 'justify-start',
                    )}
                  >
                    <div
                      className={cn(
                        'max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm',
                        msg.role === 'user'
                          ? 'bg-indigo-600 text-white rounded-tr-sm'
                          : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm',
                      )}
                    >
                      {msg.role === 'user' ? (
                        <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                      ) : (
                        <div className="prose-sm max-w-full overflow-hidden break-words text-slate-800">
                          {parseMarkdown(msg.content)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex w-full justify-start">
                    <div className="bg-white border border-slate-200 text-slate-500 rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm flex items-center gap-2 shadow-sm">
                      <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
                      <span>Processando...</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
          <CardFooter className="p-3 border-t bg-white rounded-b-xl flex flex-col gap-3">
            {messages.length > 0 && view === 'chat' && (
              <div className="flex w-full justify-between items-center px-1">
                <span className="text-xs text-slate-400 font-medium">Exportar histórico:</span>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => exportData('excel')}
                    disabled={exporting}
                    title="Exportar Excel (.xlsx)"
                    className="h-8 w-8 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50"
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => exportData('pdf')}
                    disabled={exporting}
                    title="Exportar PDF"
                    className="h-8 w-8 text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                  >
                    <Printer className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => exportData('txt')}
                    disabled={exporting}
                    title="Exportar TXT"
                    className="h-8 w-8 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50"
                  >
                    <FileText className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSend()
              }}
              className="flex w-full items-center gap-2"
            >
              <Input
                placeholder="Pergunte sobre os dados..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 border-slate-200 focus-visible:ring-indigo-600 h-10 shadow-sm"
                disabled={loading || view === 'history'}
              />
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim() || loading || view === 'history'}
                className="h-10 w-10 bg-indigo-600 hover:bg-indigo-700 text-white shrink-0 shadow-sm transition-all active:scale-95"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </CardFooter>
        </Card>
      )}
    </>
  )
}
