import { Link } from 'react-router-dom'
import { PlayCircle, Database, BarChart3, Lock, Zap, ShieldCheck, Activity } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function LandingFeatures() {
  return (
    <div className="bg-[#1A1A1A] text-white">
      {/* Apresentação do Produto */}
      <section id="demo" className="py-20 relative">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              O App que Transforma Seu Fluxo Contábil com VBAs Inteligentes
            </h2>
            <p className="text-[#BDBDBD] text-lg">
              Baseado na sua planilha comprovada com VBAs, agora como SaaS: Automação IA para
              previsões de saldos, integração automática com fontes múltiplas e dashboards
              customizáveis.
            </p>
          </div>

          <div className="flex flex-col lg:flex-row items-center gap-12 bg-white/5 rounded-3xl p-8 border border-white/10">
            <div className="flex-1 w-full">
              <div className="relative rounded-xl overflow-hidden border border-white/10 shadow-2xl">
                <img
                  src="https://img.usecurling.com/p/800/500?q=spreadsheet%20automation&color=dark&dpr=2"
                  alt="Automação VBA"
                  className="w-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <Button
                    variant="outline"
                    className="rounded-full w-16 h-16 p-0 border-[#00C851] text-[#00C851] bg-[#00C851]/10"
                  >
                    <PlayCircle className="w-8 h-8" />
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex-1 space-y-8">
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-lg bg-[#0A7A8C]/20 flex items-center justify-center shrink-0">
                    <Database className="w-6 h-6 text-[#0A7A8C]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">VBAs Migrados para Nuvem</h3>
                    <p className="text-[#BDBDBD]">
                      Deixe as planilhas para trás — seus códigos VBAs agora são processados
                      instantaneamente na nuvem.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-lg bg-[#00C851]/20 flex items-center justify-center shrink-0">
                    <Zap className="w-6 h-6 text-[#00C851]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Conciliação em 1 Clique</h3>
                    <p className="text-[#BDBDBD]">
                      Integração bancária e fiscal processada em segundos usando sua lógica já
                      homologada.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-lg bg-[#FFEB3B]/20 flex items-center justify-center shrink-0">
                    <BarChart3 className="w-6 h-6 text-[#FFEB3B]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Geração de Dados sem Erros</h3>
                    <p className="text-[#BDBDBD]">
                      IA que aprende com dados internos para gerar relatórios perfeitos e garantir
                      conformidade.
                    </p>
                  </div>
                </div>
              </div>
              <Button
                asChild
                className="bg-[#0A7A8C] hover:bg-[#0A7A8C]/90 text-white font-bold px-8"
              >
                <a href="#features">Ver Demo Interna</a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Catálogo de Recursos */}
      <section id="features" className="py-20 bg-white/5 border-y border-white/10">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Tudo o Que Seu Time Precisa para Fechamentos Eficientes
            </h2>
            <p className="text-[#BDBDBD] text-lg">
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
                color: '#0A7A8C',
              },
              {
                icon: Activity,
                title: 'Integração Nativa',
                desc: 'Bancos e sistemas fiscais conectados em tempo real.',
                color: '#00C851',
              },
              {
                icon: BarChart3,
                title: 'Dashboards Customizáveis',
                desc: 'Relatórios gerenciais personalizados para cada cliente.',
                color: '#FFEB3B',
              },
              {
                icon: ShieldCheck,
                title: 'Foco Interno',
                desc: 'Sem burocracia complexa, focados em pura eficiência contábil.',
                color: '#0A7A8C',
              },
              {
                icon: Database,
                title: 'Migração de VBAs',
                desc: 'Importe seus códigos e planilhas atuais em minutos sem perda.',
                color: '#00C851',
              },
              {
                icon: Lock,
                title: 'Zero Riscos',
                desc: 'Validações automáticas e constantes para garantir total conformidade.',
                color: '#FFEB3B',
              },
            ].map((item, i) => (
              <div
                key={i}
                className="p-6 rounded-2xl bg-[#1A1A1A] border border-white/10 hover:border-[#0A7A8C]/50 transition-all group"
              >
                <div
                  className="w-12 h-12 rounded-lg mb-6 flex items-center justify-center transition-transform group-hover:scale-110"
                  style={{ backgroundColor: `${item.color}20` }}
                >
                  <item.icon className="w-6 h-6" style={{ color: item.color }} />
                </div>
                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                <p className="text-[#BDBDBD]">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
