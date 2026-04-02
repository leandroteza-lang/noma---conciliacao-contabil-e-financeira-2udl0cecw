import { BookOpen } from 'lucide-react'

export default function Entries() {
  return (
    <div className="flex flex-col items-center justify-center py-32 text-center space-y-4 animate-in fade-in duration-500">
      <div className="bg-slate-100 p-6 rounded-full border border-slate-200">
        <BookOpen className="h-10 w-10 text-slate-400" />
      </div>
      <h2 className="text-2xl font-bold text-slate-900">Lançamentos Contábeis</h2>
      <p className="text-slate-500 max-w-md">
        Esta funcionalidade será implementada em breve. Aqui você poderá visualizar e gerenciar
        todas as movimentações e lançamentos financeiros.
      </p>
    </div>
  )
}
