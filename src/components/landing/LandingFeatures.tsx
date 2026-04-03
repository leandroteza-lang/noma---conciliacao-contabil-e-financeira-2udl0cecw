import {
  PlayCircle,
  Database,
  Layers,
  ShieldAlert,
  Activity,
  BarChart3,
  Settings,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export function LandingFeatures() {
  return (
    <div className="bg-background text-foreground">
      <section id="demo" className="py-20 relative">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              A Ferramenta Definitiva de Auditoria Contábil
            </h2>
            <p className="text-muted-foreground text-lg">
              Um sistema desenhado especificamente para a realidade industrial da Molas Noma.
              Integre seus dados gerenciais e elimine pontos cegos na gestão financeira.
            </p>
          </div>

          <div className="flex flex-col lg:flex-row items-center gap-12 bg-card/50 rounded-3xl p-8 border border-border">
            <div className="flex-1 w-full">
              <div className="relative rounded-xl overflow-hidden border border-border shadow-2xl">
                <img
                  src="https://img.usecurling.com/p/800/500?q=data%20analysis%20industrial&color=red&dpr=2"
                  alt="Processamento NOMA"
                  className="w-full object-cover"
                />
                <div className="absolute inset-0 bg-background/60 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <Button
                    variant="outline"
                    className="rounded-full w-16 h-16 p-0 border-primary text-primary bg-primary/10 hover:bg-primary/20 hover:text-primary"
                  >
                    <PlayCircle className="w-8 h-8" />
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex-1 space-y-8">
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Database className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">1. Extração Gerencial do ERP</h3>
                    <p className="text-muted-foreground">
                      Coleta segura e estruturada de todos os relatórios financeiros, fiscais e
                      operacionais diretamente da fonte.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Layers className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">2. Processamento e Análise</h3>
                    <p className="text-muted-foreground">
                      Cruzamento inteligente de dados em tempo real, validando saldos, contas
                      contábeis e centros de custo da fábrica.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0 border border-destructive/20">
                    <ShieldAlert className="w-6 h-6 text-destructive" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">3. Detecção de Divergências</h3>
                    <p className="text-muted-foreground">
                      Identificação imediata e destacada de inconsistências entre o ERP e os
                      registros financeiros reais.
                    </p>
                  </div>
                </div>
              </div>
              <Button asChild className="font-bold px-8">
                <a href="#features">Explorar Módulos</a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="py-20 bg-muted/30 border-y border-border">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Controle Total da Operação</h2>
            <p className="text-muted-foreground text-lg">
              Painéis e ferramentas projetados para garantir a precisão contábil na produção e
              logística da NOMA.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Activity,
                title: 'Monitoramento Contínuo',
                desc: 'Acompanhe a saúde financeira da operação em um painel sempre atualizado.',
              },
              {
                icon: Settings,
                title: 'Regras de Mapeamento (DE/PARA)',
                desc: 'Converta as complexidades do ERP em contas contábeis claras e organizadas.',
              },
              {
                icon: BarChart3,
                title: 'Painel de Auditoria',
                desc: 'Relatórios gerenciais desenhados para a diretoria industrial.',
              },
              {
                icon: ShieldAlert,
                title: 'Alertas de Discrepância',
                desc: 'Notificações visuais e imediatas sempre que uma conta não bater.',
              },
              {
                icon: Database,
                title: 'Gestão de Múltiplos Centros',
                desc: 'Organização perfeita dos custos entre os diversos setores da fábrica.',
              },
              {
                icon: Layers,
                title: 'Histórico e Rastreabilidade',
                desc: 'Mantenha o registro de todas as validações financeiras e contábeis.',
              },
            ].map((item, i) => (
              <div
                key={i}
                className="p-6 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all group"
              >
                <div className="w-12 h-12 rounded-lg mb-6 flex items-center justify-center transition-transform group-hover:scale-110 bg-primary/10">
                  <item.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                <p className="text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
