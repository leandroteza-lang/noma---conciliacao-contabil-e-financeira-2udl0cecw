import { LandingHero } from '@/components/landing/LandingHero'
import { LandingFeatures } from '@/components/landing/LandingFeatures'
import { LandingTrust } from '@/components/landing/LandingTrust'
import { LandingBottom } from '@/components/landing/LandingBottom'

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#1A1A1A] font-sans selection:bg-[#0A7A8C] selection:text-white scroll-smooth">
      <LandingHero />
      <LandingFeatures />
      <LandingTrust />
      <LandingBottom />
    </div>
  )
}
