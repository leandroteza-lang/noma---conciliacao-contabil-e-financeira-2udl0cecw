import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import {
  ArrowRight,
  BarChart3,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Building2,
  Users2,
  LineChart,
} from 'lucide-react'

export default function Landing() {
  const { session } = useAuth()

  return (
    <div className="min-h-screen bg-background font-sans selection:bg-primary/30 selection:text-primary-foreground overflow-x-hidden">
      {/* Header */}
      <header className="fixed top-0 w-full border-b bg-background/80 backdrop-blur-md z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-sm">
              <BarChart3 className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight">NOMA</span>
          </div>
          <nav className="flex items-center gap-4">
            {session ? (
              <Button asChild className="shadow-sm">
                <Link to="/app">Acessar Sistema</Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" asChild className="hidden sm:inline-flex">
                  <Link to="/login">Entrar</Link>
                </Button>
                <Button asChild className="shadow-sm">
                  <Link to="/signup">Cadastrar</Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-20 md:pt-40 md:pb-32 px-4 relative">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background"></div>
        <div className="container mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8 animate-fade-in-up">
            <Zap className="w-4 h-4" />
            <span className="tracking-tight">Otimize sua gestão financeira</span>
          </div>
          <h1
            className="text-5xl md:text-7xl font-extrabold tracking-tight max-w-4xl mx-auto mb-8 animate-fade-in-up"
            style={{ animationDelay: '100ms' }}
          >
            Controle Contábil e Financeiro <span className="text-primary">Simplificado</span>
          </h1>
          <p
            className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-in-up"
            style={{ animationDelay: '200ms' }}
          >
            Concilie suas contas bancárias, gerencie centros de custo e acompanhe movimentações
            financeiras com precisão, segurança e automação.
          </p>
          <div
            className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up"
            style={{ animationDelay: '300ms' }}
          >
            <Button
              size="lg"
              className="h-12 px-8 text-lg w-full sm:w-auto shadow-elevation"
              asChild
            >
              <Link to={session ? '/app' : '/signup'}>
                Começar Agora <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-muted/30 border-y px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
              Tudo que você precisa em um só lugar
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Uma plataforma completa para escalar a gestão da sua empresa sem complicações.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            <FeatureCard
              icon={<Building2 />}
              title="Múltiplas Empresas"
              description="Gerencie diferentes filiais ou empresas dentro da mesma plataforma de forma centralizada."
            />
            <FeatureCard
              icon={<LineChart />}
              title="Análises em Tempo Real"
              description="Dashboards interativos e relatórios contábeis atualizados instantaneamente."
            />
            <FeatureCard
              icon={<ShieldCheck />}
              title="Controle de Acessos"
              description="Defina permissões por departamento e garanta a segurança dos seus dados financeiros."
            />
            <FeatureCard
              icon={<Users2 />}
              title="Assistente Inteligente"
              description="Tire dúvidas e cruze dados financeiros usando nossa IA integrada ao seu banco de dados."
            />
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="py-24 px-4">
        <div className="container mx-auto max-w-5xl text-center">
          <h2 className="text-3xl font-bold mb-12 tracking-tight">Por que escolher o Noma?</h2>
          <div className="grid sm:grid-cols-3 gap-8">
            <div className="flex flex-col items-center">
              <CheckCircle2 className="w-10 h-10 text-primary mb-4" />
              <h4 className="text-lg font-bold mb-2">Importação Rápida</h4>
              <p className="text-muted-foreground text-sm">
                Integre planilhas Excel ou CSV com mapeamento inteligente de colunas.
              </p>
            </div>
            <div className="flex flex-col items-center">
              <CheckCircle2 className="w-10 h-10 text-primary mb-4" />
              <h4 className="text-lg font-bold mb-2">Conciliação Precisa</h4>
              <p className="text-muted-foreground text-sm">
                Mapeamento De/Para entre centros de custo e contas contábeis simplificado.
              </p>
            </div>
            <div className="flex flex-col items-center">
              <CheckCircle2 className="w-10 h-10 text-primary mb-4" />
              <h4 className="text-lg font-bold mb-2">Exportação Dinâmica</h4>
              <p className="text-muted-foreground text-sm">
                Gere PDFs e relatórios formatados com links compartilháveis e seguros.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 bg-muted/20">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-6 h-6 bg-primary/20 rounded flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-primary" />
            </div>
            <span className="font-bold tracking-tight text-foreground">NOMA</span>
          </div>
          <p className="text-sm">
            © {new Date().getFullYear()} Noma. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="bg-card p-6 rounded-2xl border shadow-sm hover:shadow-md transition-all group">
      <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-5 text-primary group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-lg font-bold mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
    </div>
  )
}
