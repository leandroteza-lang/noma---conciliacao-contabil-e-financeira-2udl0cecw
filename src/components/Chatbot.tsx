import { useState, useRef, useEffect } from 'react'
import {
  MessageCircle,
  X,
  Send,
  Loader2,
  Download,
  FileText,
  FileSpreadsheet,
  Printer,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { Link } from 'react-router-dom'

const parseMarkdown = (text: string) => {
  if (!text) return null

  if (text.includes('|---')) {
    const lines = text.split('\n')
    const result: React.ReactNode[] = []
    let inTable = false
    let tableHeaders: string[] = []
    let tableRows: string[][] = []
    let currentText = ''

    const flushText = () => {
      if (currentText) {
        result.push(
          <p key={result.length} className="whitespace-pre-wrap mb-2">
            {currentText.trim()}
          </p>,
        )
        currentText = ''
      }
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      if (line.trim().startsWith('|')) {
        flushText()
        if (!inTable) {
          inTable = true
          tableHeaders = line
            .split('|')
            .filter((c) => c.trim())
            .map((c) => c.trim())
          i++
        } else {
          tableRows.push(
            line
              .split('|')
              .filter((c) => c.trim())
              .map((c) => c.trim()),
          )
        }
      } else {
        if (inTable) {
          result.push(
            <div
              key={result.length}
              className="w-full overflow-x-auto mb-2 border rounded-md border-slate-200"
            >
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 border-b border-slate-200">
                  <tr>
                    {tableHeaders.map((h, idx) => (
                      <th key={idx} className="p-2 font-semibold text-slate-700">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {tableRows.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-slate-50 transition-colors">
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className="p-2 text-slate-600">
                          {cell}
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

        currentText += line + '\n'
      }
    }

    flushText()

    if (inTable) {
      result.push(
        <div
          key={result.length}
          className="w-full overflow-x-auto mb-2 border rounded-md border-slate-200"
        >
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100 border-b border-slate-200">
              <tr>
                {tableHeaders.map((h, idx) => (
                  <th key={idx} className="p-2 font-semibold text-slate-700">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {tableRows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-slate-50 transition-colors">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="p-2 text-slate-600">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      )
    }

    return (
      <div className="space-y-2">
        {result.map((node, i) => (
          <div key={i}>{node}</div>
        ))}
      </div>
    )
  }

  return (
    <div className="whitespace-pre-wrap">
      {text.split('\n').map((line, i) => {
        const parts = line.split(/\[([^\]]+)\]\(([^)]+)\)/g)
        if (parts.length > 1) {
          return (
            <span key={i}>
              {parts.map((part, j) => {
                if (j % 3 === 0) {
                  const boldParts = part.split(/\*\*([^*]+)\*\*/g)
                  return boldParts.map((bp, k) =>
                    k % 2 === 1 ? <strong key={k}>{bp}</strong> : <span key={k}>{bp}</span>,
                  )
                }
                if (j % 3 === 1)
                  return (
                    <Link
                      key={j}
                      to={parts[j + 1]}
                      className="text-indigo-600 font-medium hover:underline"
                    >
                      {part}
                    </Link>
                  )
                return null
              })}
              <br />
            </span>
          )
        }
        const boldParts = line.split(/\*\*([^*]+)\*\*/g)
        return (
          <span key={i}>
            {boldParts.map((bp, k) =>
              k % 2 === 1 ? <strong key={k}>{bp}</strong> : <span key={k}>{bp}</span>,
            )}
            <br />
          </span>
        )
      })}
    </div>
  )
}

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const dragStart = useRef({ x: 0, y: 0 })

  useEffect(() => {
    if (scrollRef.current) {
      const el = scrollRef.current
      setTimeout(() => {
        el.scrollTop = el.scrollHeight
      }, 100)
    }
  }, [messages, loading, isOpen])

  useEffect(() => {
    if (isOpen) {
      setPosition({ x: 0, y: 0 })
    }
  }, [isOpen])

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

  const exportToTxt = () => {
    const content = messages
      .map((m) => `[${m.role === 'user' ? 'Você' : 'NOMA'}]: ${m.content}`)
      .join('\n\n')
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'chat-noma.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportToCsv = () => {
    let csvContent = 'Remetente;Mensagem\n'
    messages.forEach((m) => {
      const sender = m.role === 'user' ? 'Você' : 'NOMA'
      const text = m.content.replace(/"/g, '""')
      csvContent += `"${sender}";"${text}"\n`
    })
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'chat-noma.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportToPdf = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Chat NOMA</title>
          <style>
            body { font-family: sans-serif; padding: 20px; color: #333; }
            .msg { margin-bottom: 15px; padding: 15px; border-radius: 8px; max-width: 100%; }
            .user { background-color: #4f46e5; color: white; margin-left: 20%; }
            .assistant { background-color: #f1f5f9; border: 1px solid #e2e8f0; margin-right: 20%; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 1px solid #ccc; padding-bottom: 10px; }
            pre { white-space: pre-wrap; word-wrap: break-word; margin: 10px 0 0 0; font-family: inherit; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>Histórico de Conversa - Assistente NOMA</h2>
            <p>Gerado em ${new Date().toLocaleString('pt-BR')}</p>
          </div>
          ${messages
            .map(
              (m) => `
            <div class="msg ${m.role}">
              <strong>${m.role === 'user' ? 'Você' : 'Assistente NOMA'}</strong>
              <pre>${m.content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
            </div>
          `,
            )
            .join('')}
          <script>
            window.onload = () => {
              window.print();
            }
          </script>
        </body>
      </html>
    `
    printWindow.document.open()
    printWindow.document.write(htmlContent)
    printWindow.document.close()
  }

  const handleSend = async () => {
    if (!input.trim()) return

    const newMessages = [...messages, { role: 'user', content: input }]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

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

      setMessages([
        ...newMessages,
        { role: 'assistant', content: data.reply || data.error || 'Erro desconhecido' },
      ])
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' })
      setMessages([
        ...newMessages,
        { role: 'assistant', content: 'Desculpe, ocorreu um erro ao processar sua mensagem.' },
      ])
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
          className="fixed bottom-6 right-6 w-[340px] sm:w-[450px] h-[550px] md:h-[650px] shadow-2xl flex flex-col z-50 border-indigo-100 animate-in slide-in-from-bottom-10 fade-in duration-300"
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
              {messages.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-white hover:bg-indigo-900 hover:text-white"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={exportToTxt}>
                      <FileText className="h-4 w-4 mr-2" /> Exportar TXT
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={exportToCsv}>
                      <FileSpreadsheet className="h-4 w-4 mr-2" /> Exportar Excel (CSV)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={exportToPdf}>
                      <Printer className="h-4 w-4 mr-2" /> Exportar PDF / Imprimir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-white hover:bg-indigo-900 hover:text-white"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent
            className="flex-1 p-4 overflow-y-auto bg-slate-50/50 min-h-0"
            ref={scrollRef}
          >
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-3 mt-10">
                <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
                  <MessageCircle className="h-6 w-6 text-indigo-950" />
                </div>
                <p className="text-sm text-center max-w-[200px]">
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
          <CardFooter className="p-3 border-t bg-white rounded-b-xl">
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
                disabled={loading}
              />
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim() || loading}
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
