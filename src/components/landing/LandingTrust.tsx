import { CheckCircle2, ShieldAlert, Lock, Database, Users, Quote, Factory } from 'lucide-react'

export function LandingTrust() {
  return (
    <div className="bg-background text-foreground">
      <section className="py-20 relative">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row-reverse items-center gap-12">
            <div className="flex-1 w-full relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent blur-3xl" />
              <div className="relative rounded-2xl border border-border bg-card p-6 shadow-2xl">
                <h4 className="text-xl font-bold mb-6 text-foreground border-b border-border pb-4">
                  Eficiência na Auditoria Industrial
                </h4>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Conferência Manual (Anterior)</span>
                      <span className="text-foreground font-bold">Dias</span>
                    </div>
                    <div className="h-3 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-gray-500 w-[90%]" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Sistema NOMA Conciliação</span>
                      <span className="text-primary font-bold">Minutos</span>
                    </div>
                    <div className="h-3 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-primary w-[15%]" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex-1 space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold">
                O Motor que Mantém a Gestão no Caminho Certo
              </h2>
              <p className="text-muted-foreground text-lg">
                Projetado para lidar com o volume e a complexidade de uma fabricante líder,
                garantindo que nenhum centavo fique sem rastreabilidade.
              </p>
              <ul className="space-y-4 pt-4">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-primary shrink-0 mt-1" />
                  <div>
                    <strong className="block text-foreground">Rastreio Preciso do ERP</strong>
                    <span className="text-muted-foreground text-sm">
                      Conexão sólida com os lançamentos originais da operação.
                    </span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-primary shrink-0 mt-1" />
                  <div>
                    <strong className="block text-foreground">
                      Análise de Múltiplos Centros de Custo
                    </strong>
                    <span className="text-muted-foreground text-sm">
                      Trata a complexidade desde a produção até a logística.
                    </span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-primary shrink-0 mt-1" />
                  <div>
                    <strong className="block text-foreground">
                      Resolução Rápida de Divergências
                    </strong>
                    <span className="text-muted-foreground text-sm">
                      Foca a atenção da equipe exatamente onde o ajuste é necessário.
                    </span>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section id="benefits" className="py-20 bg-muted/30 border-y border-border">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Feito para a Rotina da Molas Noma</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-16">
            Uma plataforma de auditoria que respeita a confidencialidade e a escala do seu negócio.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Database className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold">Base Integrada</h3>
              <p className="text-muted-foreground text-sm">
                Importação unificada dos dados gerenciais para uma única fonte da verdade.
              </p>
            </div>
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center border border-destructive/20">
                <ShieldAlert className="w-8 h-8 text-destructive" />
              </div>
              <h3 className="text-xl font-bold">Foco no Erro</h3>
              <p className="text-muted-foreground text-sm">
                Interface orientada a destacar discrepâncias antes do fechamento do mês.
              </p>
            </div>
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold">Gestão de Equipe</h3>
              <p className="text-muted-foreground text-sm">
                Níveis de acesso específicos para analistas, supervisores e diretoria.
              </p>
            </div>
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Lock className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold">Segurança Total</h3>
              <p className="text-muted-foreground text-sm">
                Ambiente fechado e protegido para a análise dos dados mais sensíveis da empresa.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 relative">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold mb-16 text-center">Impacto Interno</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: 'Gestão Contábil',
                role: 'Molas Noma',
                text: 'A etapa de detecção de divergências mudou o nosso fechamento. O que antes exigia conferência linha a linha, agora nos é entregue processado e destacado em tela.',
              },
              {
                name: 'Diretoria Financeira',
                role: 'NOMA Truck Parts',
                text: 'Ter um painel gerencial que espelha exatamente a realidade da nossa fábrica e aponta onde os números do ERP destoam do financeiro é fundamental.',
              },
              {
                name: 'Operações Internas',
                role: 'Equipe de Análise',
                text: 'O mapeamento DE/PARA simplificou a tradução de centros de custo da produção para a linguagem contábil. A precisão aumentou drasticamente.',
              },
            ].map((item, i) => (
              <div key={i} className="p-8 rounded-2xl bg-card border border-border relative">
                <Quote className="absolute top-6 right-6 w-8 h-8 text-primary/20" />
                <div className="flex items-center gap-1 mb-6">
                  <Factory className="w-5 h-5 text-primary" />
                </div>
                <p className="text-muted-foreground mb-8 relative z-10 italic">"{item.text}"</p>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary uppercase">
                    {item.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-foreground">{item.name}</p>
                    <p className="text-xs text-primary">{item.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
