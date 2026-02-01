
import React from 'react';
import { HeroSection } from '../components/landing/HeroSection';
import { SubscriptionSection } from '../components/landing/SubscriptionSection';
import { ProductMarquee } from '../components/landing/ProductMarquee';
import { StatsSection } from '../components/landing/StatsSection';
import { HowItWorksSection } from '../components/landing/HowItWorksSection';
import { TestimonialsSection } from '../components/landing/TestimonialsSection';
import { CtaSection } from '../components/landing/CtaSection';
import { motion } from 'framer-motion';

const MotionDiv = motion.div as any;

interface LandingProps {
    onProceed: () => void;
    onHelp: () => void;
    onSubscribeIntent: () => void;
    heroImages?: string[];
}

export const LandingView: React.FC<LandingProps> = ({ onProceed, onHelp, onSubscribeIntent, heroImages }) => {
  return (
    <div className="bg-white font-sans selection:bg-brand-100 selection:text-brand-800">
      
      {/* Updated Hero Section Wrapper for SMM Branding */}
      <HeroSection 
        onProceed={onProceed} 
        onHelp={onHelp} 
        images={heroImages} 
      />
      
      <div className="bg-stone-900 text-white py-4 text-center overflow-hidden relative">
          <MotionDiv 
            className="whitespace-nowrap font-bold text-xs md:text-sm uppercase tracking-[0.2em]"
            animate={{ x: [0, -1000] }}
            transition={{ ease: "linear", duration: 20, repeat: Infinity }}
          >
              SML • Smart Monthly Living • KNUST • LEGON • UCC • SML • Smart Monthly Living • KNUST • LEGON • UCC • SML • Smart Monthly Living
          </MotionDiv>
      </div>

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
