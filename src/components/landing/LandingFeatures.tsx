import { PlayCircle, Database, BarChart3, Lock, Zap, ShieldCheck, Activity } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function LandingFeatures() {
  return (
    <div className="bg-background text-foreground">
      <section id="demo" className="py-20 relative">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              O App que Transforma Seu Fluxo Contábil com VBAs Inteligentes
            </h2>
            <p className="text-muted-foreground text-lg">
              Baseado na sua planilha comprovada com VBAs, agora como SaaS: Automação IA para
              previsões de saldos, integração automática com fontes múltiplas e dashboards
              customizáveis.
            </p>
          </div>

          <div className="flex flex-col lg:flex-row items-center gap-12 bg-card/50 rounded-3xl p-8 border border-border">
            <div className="flex-1 w-full">
              <div className="relative rounded-xl overflow-hidden border border-border shadow-2xl">
                <img
                  src="https://img.usecurling.com/p/800/500?q=spreadsheet%20automation&color=cyan&dpr=2"
                  alt="Automação VBA"
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
                    <h3 className="text-xl font-bold mb-2">VBAs Migrados para Nuvem</h3>
                    <p className="text-muted-foreground">
                      Deixe as planilhas para trás — seus códigos VBAs agora são processados
                      instantaneamente na nuvem.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Zap className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Conciliação em 1 Clique</h3>
                    <p className="text-muted-foreground">
                      Integração bancária e fiscal processada em segundos usando sua lógica já
                      homologada.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <BarChart3 className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Geração de Dados sem Erros</h3>
                    <p className="text-muted-foreground">
                      IA que aprende com dados internos para gerar relatórios perfeitos e garantir
                      conformidade.
                    </p>
                  </div>
                </div>
              </div>
              <Button asChild className="font-bold px-8">
                <a href="#features">Ver Demo Interna</a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="py-20 bg-muted/30 border-y border-border">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Tudo o Que Seu Time Precisa para Fechamentos Eficientes
            </h2>
            <p className="text-muted-foreground text-lg">
              Funcionalidades desenvolvidas especificamente para as necessidades do nosso
              escritório.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Zap,
                title: 'Automação Total com IA e VBAs',
                desc: 'Previsões e alertas automáticos com herança comprovada.',
              },
              {
                icon: Activity,
                title: 'Integração Nativa',
                desc: 'Bancos e sistemas fiscais conectados em tempo real.',
              },
              {
                icon: BarChart3,
                title: 'Dashboards Customizáveis',
                desc: 'Relatórios gerenciais personalizados para cada cliente.',
              },
              {
                icon: ShieldCheck,
                title: 'Foco Interno',
                desc: 'Sem burocracia complexa, focados em pura eficiência contábil.',
              },
              {
                icon: Database,
                title: 'Migração de VBAs',
                desc: 'Importe seus códigos e planilhas atuais em minutos sem perda.',
              },
              {
                icon: Lock,
                title: 'Zero Riscos',
                desc: 'Validações automáticas e constantes para garantir total conformidade.',
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
