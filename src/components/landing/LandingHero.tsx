import { Link } from 'react-router-dom'
import {
  ArrowRight,
  CheckCircle2,
  Factory,
  Layers,
  ShieldAlert,
  Activity,
  Database,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'

export function LandingHero() {
  const { user } = useAuth()

  return (
    <div className="bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <Factory className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl tracking-tight text-foreground">
              NOMA Truck Parts
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">
              Processamento
            </a>
            <a href="#benefits" className="hover:text-foreground transition-colors">
              Auditoria
            </a>
            <a href="#faq" className="hover:text-foreground transition-colors">
              Dúvidas
            </a>
          </nav>
          <div>
            {user ? (
              <Button asChild className="font-bold">
                <Link to="/app">Acessar Painel</Link>
              </Button>
            ) : (
              <Button asChild className="font-bold">
                <Link to="/login">Entrar</Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      <section className="relative pt-20 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1 space-y-8 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20 animate-fade-in-up">
                <Activity className="w-4 h-4" />
                <span>Auditoria & Conciliação Interna</span>
              </div>
              <h1
                className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-foreground animate-fade-in-up"
                style={{ animationDelay: '100ms' }}
              >
                Integração ERP e Gestão Financeira da{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">
                  Molas Noma
                </span>
              </h1>
              <p
                className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto lg:mx-0 animate-fade-in-up"
                style={{ animationDelay: '200ms' }}
              >
                O motor de inteligência contábil da sua operação. Extraia dados gerenciais do ERP,
                processe conciliações de alta complexidade e detecte divergências financeiras
                instantaneamente.
              </p>
              <div
                className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start animate-fade-in-up"
                style={{ animationDelay: '300ms' }}
              >
                <Button asChild size="lg" className="w-full sm:w-auto font-bold h-14 px-8 text-lg">
                  <Link to={user ? '/app' : '/login'}>
                    Acessar App Interno
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto h-14 px-8 text-lg border-primary/50 text-primary hover:bg-primary/10"
                >
                  <a href="#features">Entender o Fluxo</a>
                </Button>
              </div>
              <div
                className="flex items-center gap-4 justify-center lg:justify-start text-sm text-muted-foreground animate-fade-in-up"
                style={{ animationDelay: '400ms' }}
              >
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-primary" /> Extração ERP
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-primary" /> Processamento
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-primary" /> Auditoria
                </span>
              </div>
            </div>
            <div className="flex-1 w-full max-w-2xl lg:max-w-none animate-fade-in">
              <div className="relative rounded-2xl border border-border bg-card p-2 shadow-2xl shadow-primary/10 overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-primary/50" />
                <img
                  src="https://img.usecurling.com/p/800/600?q=industrial%20dashboard&color=red&dpr=2"
                  alt="Dashboard Auditoria NOMA"
                  className="w-full rounded-xl opacity-80 group-hover:opacity-100 transition-opacity duration-500"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 border-y border-border bg-muted/30 relative z-10">
        <div className="container mx-auto px-4">
          <p className="text-center text-sm font-medium text-muted-foreground mb-8 uppercase tracking-wider">
            Pilares da Operação Integrada
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Database className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-bold text-foreground">Extração Gerencial</p>
                <p className="text-sm text-muted-foreground">Sincronia direta com o ERP</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Layers className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-bold text-foreground">Processamento Analítico</p>
                <p className="text-sm text-muted-foreground">Cruzamento contábil inteligente</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <ShieldAlert className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-bold text-foreground">Detecção de Divergências</p>
                <p className="text-sm text-muted-foreground">Alertas visuais de anomalias</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
