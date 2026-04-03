import { LandingHero } from '@/components/landing/LandingHero'
import { LandingFeatures } from '@/components/landing/LandingFeatures'
import { LandingTrust } from '@/components/landing/LandingTrust'
import { LandingBottom } from '@/components/landing/LandingBottom'

export default function Landing() {
  return (
    <div className="min-h-screen bg-background font-sans selection:bg-primary/30 selection:text-primary-foreground scroll-smooth">
      <LandingHero />
      <LandingFeatures />
      <LandingTrust />
      <LandingBottom />
    </div>
  )
}
