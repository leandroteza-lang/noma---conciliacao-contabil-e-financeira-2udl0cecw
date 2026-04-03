import { Link } from 'react-router-dom'
import { CheckCircle2, Database, Mail } from 'lucide-react'
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
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Acesso Interno Simples para o Time
            </h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
              Invista no tempo da sua equipe com VBAs otimizados na nuvem. ROI imediato em
              eficiência contábil.
            </p>

            <div className="bg-card rounded-2xl p-8 max-w-md mx-auto border border-primary/30 shadow-2xl shadow-primary/10">
              <div className="text-sm font-bold text-primary uppercase tracking-wider mb-2">
                Plano Equipe
              </div>
              <div className="flex items-baseline justify-center gap-1 mb-6">
                <span className="text-4xl font-bold">Acesso Liberado</span>
              </div>
              <ul className="space-y-4 mb-8 text-left">
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                  <span className="text-muted-foreground">Migração de VBAs Gratuita</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                  <span className="text-muted-foreground">Automação e Conciliação IA</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                  <span className="text-muted-foreground">Dashboards em Tempo Real</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                  <span className="text-muted-foreground">Suporte Dedicado Interno</span>
                </li>
              </ul>
              <Button asChild size="lg" className="w-full font-bold h-14 text-lg">
                <Link to={user ? '/app' : '/login'}>Acessar App Interno Agora</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section id="faq" className="py-20 bg-muted/30 border-y border-border">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">
            Perguntas Frequentes do Time
          </h2>
          <Accordion type="single" collapsible className="w-full space-y-4">
            <AccordionItem
              value="item-1"
              className="border-border px-6 bg-card rounded-xl data-[state=open]:border-primary/50 transition-colors"
            >
              <AccordionTrigger className="text-left font-bold text-lg py-6 hover:no-underline">
                Vai ser difícil migrar dados e VBAs da planilha atual?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-6 text-base leading-relaxed">
                Não — oferecemos uma importação automática em 1 clique, com suporte guiado para
                adaptar seus códigos VBA para a nova arquitetura na nuvem sem dor de cabeça.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem
              value="item-2"
              className="border-border px-6 bg-card rounded-xl data-[state=open]:border-primary/50 transition-colors"
            >
              <AccordionTrigger className="text-left font-bold text-lg py-6 hover:no-underline">
                E se houver erros na automação ou integração de VBAs?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-6 text-base leading-relaxed">
                Nossas validações de IA detectam anomalias e corrigem falhas de formatação em tempo
                real. Além disso, disponibilizamos um ambiente seguro (sandbox) para homologar os
                testes.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem
              value="item-3"
              className="border-border px-6 bg-card rounded-xl data-[state=open]:border-primary/50 transition-colors"
            >
              <AccordionTrigger className="text-left font-bold text-lg py-6 hover:no-underline">
                Precisa de treinamento para utilizar os VBAs no sistema?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-6 text-base leading-relaxed">
                Não há necessidade técnica profunda. Oferecemos um onboarding ágil de 15 minutos
                para que qualquer membro da equipe contábil execute as rotinas com confiança.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem
              value="item-4"
              className="border-border px-6 bg-card rounded-xl data-[state=open]:border-primary/50 transition-colors"
            >
              <AccordionTrigger className="text-left font-bold text-lg py-6 hover:no-underline">
                É compatível com nossos sistemas atuais?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-6 text-base leading-relaxed">
                Sim! O SaaS integra nativamente com a maioria dos bancos e ERPs fiscais, preservando
                toda a lógica de regras contábeis dos seus VBAs pré-existentes.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      <footer className="py-12 bg-background border-t border-border">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <Database className="w-3 h-3 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg tracking-tight text-foreground">NOMA</span>
          </div>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Desenvolvido para eficiência contábil interna com VBAs otimizados — Seu escritório,
            automatizado e livre de erros.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm font-medium text-primary mb-8">
            <a href="#" className="hover:text-primary/80 transition-colors">
              Sobre o App e VBAs
            </a>
            <a href="#" className="hover:text-primary/80 transition-colors flex items-center gap-1">
              <Mail className="w-4 h-4" /> Suporte Interno
            </a>
            <a href="#" className="hover:text-primary/80 transition-colors">
              Política de Privacidade
            </a>
          </div>
          <p className="text-muted-foreground text-sm opacity-50">
            © 2026 Escritório Contábil NOMA - Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  )
}
