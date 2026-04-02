import { Outlet } from 'react-router-dom'
import { Wallet } from 'lucide-react'

export default function Layout() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col">
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-30">
        <div className="container mx-auto px-4 h-16 flex items-center gap-3 max-w-7xl">
          <div className="bg-blue-600 p-2 rounded-lg text-white shadow-sm flex items-center justify-center">
            <Wallet className="h-5 w-5" />
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-800 tracking-tight truncate">
            Gestão de Contas Bancárias e Caixa
          </h1>
        </div>
      </header>
      <main className="flex-1 container mx-auto py-6 px-4 sm:px-6 lg:px-8 max-w-7xl animate-fade-in">
        <Outlet />
      </main>
    </div>
  )
}
