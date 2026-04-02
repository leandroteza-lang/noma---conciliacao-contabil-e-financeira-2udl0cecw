import { ArrowRightLeft } from 'lucide-react'

export default function Mapping() {
  return (
    <div className="flex flex-col items-center justify-center py-32 text-center space-y-4 animate-in fade-in duration-500">
      <div className="bg-slate-100 p-6 rounded-full border border-slate-200">
        <ArrowRightLeft className="h-10 w-10 text-slate-400" />
      </div>
      <h2 className="text-2xl font-bold text-slate-900">Mapeamento DE/PARA</h2>
      <p className="text-slate-500 max-w-md">
        Esta funcionalidade será implementada em breve. Aqui você poderá vincular contas contábeis
        aos centros de custo da sua organização.
      </p>
    </div>
  )
}
