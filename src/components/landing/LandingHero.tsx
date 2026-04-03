import { Link } from 'react-router-dom'
import { ArrowRight, CheckCircle2, Zap, Clock, Shield, Star, Database } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'

export function LandingHero() {
  const { user } = useAuth()

  return (
    <div className="bg-[#1A1A1A]">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#1A1A1A]/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0A7A8C] to-[#00C851] flex items-center justify-center">
              <Database className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight text-white">NOMA</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-[#BDBDBD]">
            <a href="#features" className="hover:text-white transition-colors">
              Recursos
            </a>
            <a href="#benefits" className="hover:text-white transition-colors">
              Benefícios
            </a>
            <a href="#faq" className="hover:text-white transition-colors">
              FAQ
            </a>
          </nav>
          <div>
            {user ? (
              <Button asChild className="bg-[#00C851] hover:bg-[#00C851]/90 text-black font-bold">
                <Link to="/app">Acessar App Interno</Link>
              </Button>
            ) : (
              <Button asChild className="bg-[#00C851] hover:bg-[#00C851]/90 text-black font-bold">
                <Link to="/login">Entrar</Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      <section className="relative pt-20 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0A7A8C]/20 to-transparent pointer-events-none" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1 space-y-8 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0A7A8C]/20 text-[#00C851] text-sm font-medium border border-[#0A7A8C]/30 animate-fade-in-up">
                <Zap className="w-4 h-4" />
                <span>Novo SaaS Interno</span>
              </div>
              <h1
                className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-white animate-fade-in-up"
                style={{ animationDelay: '100ms' }}
              >
                Automatize Fechamentos Contábeis em{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00C851] to-[#0A7A8C]">
                  Minutos
                </span>
              </h1>
              <p
                className="text-lg md:text-xl text-[#BDBDBD] max-w-2xl mx-auto lg:mx-0 animate-fade-in-up"
                style={{ animationDelay: '200ms' }}
              >
                Seus VBAs Comprovados Agora em SaaS Interno. Concilie dados automaticamente, gere
                relatórios em tempo real e foque no que importa: análises estratégicas.
              </p>
              <div
                className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start animate-fade-in-up"
                style={{ animationDelay: '300ms' }}
              >
                <Button
                  asChild
                  size="lg"
                  className="w-full sm:w-auto bg-[#00C851] hover:bg-[#00C851]/90 text-black font-bold h-14 px-8 text-lg"
                >
                  <Link to={user ? '/app' : '/login'}>
                    Acessar App Interno Agora
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto border-[#0A7A8C] text-[#0A7A8C] hover:bg-[#0A7A8C]/10 h-14 px-8 text-lg"
                >
                  <a href="#demo">Ver Demo Interna</a>
                </Button>
              </div>
              <div
                className="flex items-center gap-4 justify-center lg:justify-start text-sm text-[#BDBDBD] animate-fade-in-up"
                style={{ animationDelay: '400ms' }}
              >
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-[#00C851]" /> VBAs Migrados
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-[#00C851]" /> Integração Nativa
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-[#00C851]" /> Dashboards Customizáveis
                </span>
              </div>
            </div>
            <div className="flex-1 w-full max-w-2xl lg:max-w-none animate-fade-in">
              <div className="relative rounded-2xl border border-white/10 bg-[#1A1A1A] p-2 shadow-2xl shadow-[#0A7A8C]/20 overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#00C851] to-[#0A7A8C]" />
                <img
                  src="https://img.usecurling.com/p/800/600?q=financial%20dashboard&color=dark&dpr=2"
                  alt="Dashboard Contábil"
                  className="w-full rounded-xl opacity-80 group-hover:opacity-100 transition-opacity duration-500"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 border-y border-white/5 bg-white/5 relative z-10">
        <div className="container mx-auto px-4">
          <p className="text-center text-sm font-medium text-[#BDBDBD] mb-8 uppercase tracking-wider">
            Aprovado pelo Nosso Time Contábil
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-[#1A1A1A] border border-white/10 hover:border-[#0A7A8C]/50 transition-colors">
              <div className="w-12 h-12 rounded-full bg-[#0A7A8C]/20 flex items-center justify-center">
                <Clock className="w-6 h-6 text-[#0A7A8C]" />
              </div>
              <div>
                <p className="font-bold text-white">80% Mais Rápido</p>
                <p className="text-sm text-[#BDBDBD]">Tempo de fechamento</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-xl bg-[#1A1A1A] border border-white/10 hover:border-[#00C851]/50 transition-colors">
              <div className="w-12 h-12 rounded-full bg-[#00C851]/20 flex items-center justify-center">
                <Shield className="w-6 h-6 text-[#00C851]" />
              </div>
              <div>
                <p className="font-bold text-white">Zero Erros</p>
                <p className="text-sm text-[#BDBDBD]">Em conciliações</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-xl bg-[#1A1A1A] border border-white/10 hover:border-[#FFEB3B]/50 transition-colors">
              <div className="w-12 h-12 rounded-full bg-[#FFEB3B]/20 flex items-center justify-center">
                <Star className="w-6 h-6 text-[#FFEB3B]" />
              </div>
              <div>
                <p className="font-bold text-white">100% Aprovado</p>
                <p className="text-sm text-[#BDBDBD]">Uso diário pela equipe</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
