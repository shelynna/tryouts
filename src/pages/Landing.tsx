
import React from 'react';
import { HeroSection } from '../components/landing/HeroSection';
import { SubscriptionSection } from '../components/landing/SubscriptionSection';
import { ProductMarquee } from '../components/landing/ProductMarquee';
import { StatsSection } from '../components/landing/StatsSection';
import { HowItWorksSection } from '../components/landing/HowItWorksSection';
import { TestimonialsSection } from '../components/landing/TestimonialsSection';
import { CtaSection } from '../components/landing/CtaSection';

interface LandingProps {
    onProceed: () => void;
    onHelp: () => void;
    onSubscribeIntent: () => void;
    heroImages?: string[];
}

export const LandingView: React.FC<LandingProps> = ({ onProceed, onHelp, onSubscribeIntent, heroImages }) => {
  return (
    <div className="bg-white font-sans selection:bg-brand-100 selection:text-brand-800">
      <HeroSection onProceed={onProceed} onHelp={onHelp} images={heroImages} />
      <ProductMarquee />
      <StatsSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <SubscriptionSection
        onStartFree={onProceed}
        onSubscribe={onSubscribeIntent}
      />
      <CtaSection onProceed={onProceed} onHelp={onHelp} />
    </div>
  );
};
