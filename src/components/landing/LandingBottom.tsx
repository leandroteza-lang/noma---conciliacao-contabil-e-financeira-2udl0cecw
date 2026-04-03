import { Link } from 'react-router-dom'
import { CheckCircle2, Factory, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { useAuth } from '@/hooks/use-auth'

export function LandingBottom() {
  const { user } = useAuth()

  return (
    <div className="bg-background text-foreground">
      <section className="py-20 relative">
        <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent pointer-events-none" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto bg-card/50 border border-border rounded-3xl p-8 md:p-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Auditoria Restrita e Segura</h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
              Acesso exclusivo para os colaboradores do departamento financeiro e contábil da Molas
              Noma.
            </p>

            <div className="bg-card rounded-2xl p-8 max-w-md mx-auto border border-primary/30 shadow-2xl shadow-primary/10">
              <div className="text-sm font-bold text-primary uppercase tracking-wider mb-2">
                Painel Institucional
              </div>
              <div className="flex items-baseline justify-center gap-1 mb-6">
                <span className="text-4xl font-bold">Acesso Interno</span>
              </div>
              <ul className="space-y-4 mb-8 text-left">
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                  <span className="text-muted-foreground">Extração Gerencial Contínua</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                  <span className="text-muted-foreground">Processamento Analítico</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                  <span className="text-muted-foreground">Detecção de Divergências</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                  <span className="text-muted-foreground">Relatórios de Alta Direção</span>
                </li>
              </ul>
              <Button asChild size="lg" className="w-full font-bold h-14 text-lg">
                <Link to={user ? '/app' : '/login'}>Acessar Painel</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section id="faq" className="py-20 bg-muted/30 border-y border-border">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">
            Dúvidas da Equipe Operacional
          </h2>
          <Accordion type="single" collapsible className="w-full space-y-4">
            <AccordionItem
              value="item-1"
              className="border-border px-6 bg-card rounded-xl data-[state=open]:border-primary/50 transition-colors"
            >
              <AccordionTrigger className="text-left font-bold text-lg py-6 hover:no-underline">
                Como o sistema lida com a Extração Gerencial do ERP?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-6 text-base leading-relaxed">
                O aplicativo permite a importação de lotes de lançamentos financeiros e contábeis
                provenientes do nosso ERP industrial. Ele normaliza os dados com base nas regras
                estabelecidas de DE/PARA dos centros de custo.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem
              value="item-2"
              className="border-border px-6 bg-card rounded-xl data-[state=open]:border-primary/50 transition-colors"
            >
              <AccordionTrigger className="text-left font-bold text-lg py-6 hover:no-underline">
                O que acontece na etapa de Detecção de Divergências?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-6 text-base leading-relaxed">
                Durante o processamento analítico, o sistema cruza os saldos extraídos do ERP com as
                movimentações bancárias e financeiras inseridas. Qualquer valor que não concilie
                perfeitamente é imediatamente destacado no Painel de Auditoria em vermelho, exigindo
                a revisão da equipe.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem
              value="item-3"
              className="border-border px-6 bg-card rounded-xl data-[state=open]:border-primary/50 transition-colors"
            >
              <AccordionTrigger className="text-left font-bold text-lg py-6 hover:no-underline">
                A estruturação visual ajuda na análise diária?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-6 text-base leading-relaxed">
                Sim. A interface adota o padrão gráfico da Molas Noma, priorizando o contraste (modo
                escuro/grafite) para visualização prolongada de dados e reservando o vermelho apenas
                para ações críticas e divergências, reduzindo o cansaço visual.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem
              value="item-4"
              className="border-border px-6 bg-card rounded-xl data-[state=open]:border-primary/50 transition-colors"
            >
              <AccordionTrigger className="text-left font-bold text-lg py-6 hover:no-underline">
                Como novos colaboradores ganham acesso?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-6 text-base leading-relaxed">
                A aprovação de acesso é gerenciada internamente. Após o cadastro, um administrador
                ou supervisor da área financeira precisa revisar e liberar o perfil do novo
                funcionário na aba de "Aprovações".
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      <footer className="py-12 bg-background border-t border-border">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <Factory className="w-3 h-3 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg tracking-tight text-foreground">
              NOMA Truck Parts
            </span>
          </div>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Sistema de Auditoria e Conciliação ERP. Ferramenta exclusiva da operação administrativa.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm font-medium text-primary mb-8">
            <a
              href="https://www.molasnoma.com.br/"
              target="_blank"
              rel="noreferrer"
              className="hover:text-primary/80 transition-colors"
            >
              Site Oficial Molas Noma
            </a>
            <a href="#" className="hover:text-primary/80 transition-colors flex items-center gap-1">
              <Mail className="w-4 h-4" /> TI / Suporte Interno
            </a>
          </div>
          <p className="text-muted-foreground text-sm opacity-50">
            © 2026 Molas Noma - Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  )
}
