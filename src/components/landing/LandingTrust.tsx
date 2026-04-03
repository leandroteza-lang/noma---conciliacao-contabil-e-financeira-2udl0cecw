import { CheckCircle2, Shield, Lock, FileCode, Users, Quote, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'

export function LandingTrust() {
  return (
    <div className="bg-[#1A1A1A] text-white">
      {/* Demonstrações e Diferenciais */}
      <section className="py-20 relative">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row-reverse items-center gap-12">
            <div className="flex-1 w-full relative">
              <div className="absolute inset-0 bg-gradient-to-r from-[#00C851]/20 to-transparent blur-3xl" />
              <div className="relative rounded-2xl border border-white/10 bg-[#1A1A1A] p-6 shadow-2xl">
                <h4 className="text-xl font-bold mb-6 text-white border-b border-white/10 pb-4">
                  Comparativo de Eficiência
                </h4>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-[#BDBDBD]">Antes: Planilhas Manuais</span>
                      <span className="text-white font-bold">12 Horas</span>
                    </div>
                    <div className="h-3 rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full bg-red-500/80 w-full" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-[#BDBDBD]">Depois: App com VBAs IA</span>
                      <span className="text-[#00C851] font-bold">15 Minutos</span>
                    </div>
                    <div className="h-3 rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full bg-[#00C851] w-[5%]" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex-1 space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold">
                De Planilhas Manuais para Automação VBA Inteligente
              </h2>
              <p className="text-[#BDBDBD] text-lg">
                Imagine seu time fechando o mês sem noites em claro — VBAs migrados para ação
                instantânea com integrações seguras.
              </p>
              <ul className="space-y-4 pt-4">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-[#0A7A8C] shrink-0 mt-1" />
                  <div>
                    <strong className="block text-white">
                      VBAs Testados com IA para Previsões
                    </strong>
                    <span className="text-[#BDBDBD] text-sm">
                      Seus scripts evoluídos com aprendizado de máquina contínuo.
                    </span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-[#0A7A8C] shrink-0 mt-1" />
                  <div>
                    <strong className="block text-white">
                      Integrações Seguras sem API Complexa
                    </strong>
                    <span className="text-[#BDBDBD] text-sm">
                      Conecte bancos e sistemas fiscais com poucos cliques.
                    </span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-[#0A7A8C] shrink-0 mt-1" />
                  <div>
                    <strong className="block text-white">
                      Customização para Relatórios Gerenciais
                    </strong>
                    <span className="text-[#BDBDBD] text-sm">
                      Dashboard desenhado para as necessidades exatas da diretoria.
                    </span>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Segurança e Confiança */}
      <section id="benefits" className="py-20 bg-white/5 border-y border-white/10">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Seguro e Simples para Seu Escritório
          </h2>
          <p className="text-[#BDBDBD] text-lg max-w-2xl mx-auto mb-16">
            Sem interrupções no seu fluxo — testamos VBAs para o seu escritório e garantimos total
            conformidade fiscal.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#0A7A8C]/20 flex items-center justify-center">
                <FileCode className="w-8 h-8 text-[#0A7A8C]" />
              </div>
              <h3 className="text-xl font-bold">Migração Fácil</h3>
              <p className="text-[#BDBDBD] text-sm">
                Importe códigos da planilha atual em 1 clique, sem perda de inteligência.
              </p>
            </div>
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#00C851]/20 flex items-center justify-center">
                <Shield className="w-8 h-8 text-[#00C851]" />
              </div>
              <h3 className="text-xl font-bold">Zero Erros Garantidos</h3>
              <p className="text-[#BDBDBD] text-sm">
                Validações IA nos VBAs e backups automáticos para segurança total.
              </p>
            </div>
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#FFEB3B]/20 flex items-center justify-center">
                <Users className="w-8 h-8 text-[#FFEB3B]" />
              </div>
              <h3 className="text-xl font-bold">Suporte Interno</h3>
              <p className="text-[#BDBDBD] text-sm">
                Treinamento rápido de 15 minutos para o time, totalmente compatível.
              </p>
            </div>
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#0A7A8C]/20 flex items-center justify-center">
                <Lock className="w-8 h-8 text-[#0A7A8C]" />
              </div>
              <h3 className="text-xl font-bold">Conformidade Total</h3>
              <p className="text-[#BDBDBD] text-sm">
                Atualizações fiscais automáticas mantendo os scripts otimizados.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Depoimentos Internos */}
      <section className="py-20 relative">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold mb-16 text-center">O Que Nosso Time Diz</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: 'João Carlos',
                role: 'Contador Sênior',
                text: 'Migrei meus VBAs de conciliação em 10 minutos e eliminei os erros manuais. Agora meu foco é 100% na análise estratégica dos clientes.',
              },
              {
                name: 'Maria Fernanda',
                role: 'Analista Financeira',
                text: 'Os dashboards gerados em tempo real a partir das nossas antigas macros mudaram completamente a forma como tomamos decisões.',
              },
              {
                name: 'Equipe de Fechamento',
                role: 'Operações Internas',
                text: 'As integrações automáticas nos salvaram dezenas de horas todo mês. O fechamento que levava dias agora é resolvido em poucos cliques.',
              },
            ].map((item, i) => (
              <div key={i} className="p-8 rounded-2xl bg-white/5 border border-white/10 relative">
                <Quote className="absolute top-6 right-6 w-8 h-8 text-[#0A7A8C]/30" />
                <div className="flex items-center gap-1 mb-6">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="w-4 h-4 text-[#00C851] fill-[#00C851]" />
                  ))}
                </div>
                <p className="text-[#BDBDBD] mb-8 relative z-10 italic">"{item.text}"</p>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#0A7A8C] flex items-center justify-center font-bold text-white uppercase">
                    {item.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-white">{item.name}</p>
                    <p className="text-xs text-[#0A7A8C]">{item.role}</p>
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
