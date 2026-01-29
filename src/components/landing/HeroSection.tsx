
import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '../ui';
import { ArrowRight, PlayCircle } from 'lucide-react';
import { ASSETS } from '../../assets';

const MotionDiv = motion.div as any;

interface HeroSectionProps {
    onProceed: () => void;
    onHelp: () => void;
    images?: string[];
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onProceed, onHelp, images }) => {
  // Use provided images prop or fallback to default asset
  const bgImage = (images && images.length > 0) ? images[0] : ASSETS.LANDING_HERO_BG;

  return (
      <section className="relative pt-40 pb-24 md:pt-48 md:pb-32 overflow-hidden bg-white text-stone-900">
        
        {/* Background Image Layer */}
        <div className="absolute inset-0 z-0">
            <img 
                src={bgImage} 
                alt="Background" 
                className="w-full h-full object-cover"
            />
            {/* White Overlay gradient to ensure text readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/95 via-white/80 to-white/100"></div>
        </div>

        <div className="container-padding relative z-10 flex flex-col items-center text-center">
            <MotionDiv
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="max-w-4xl mx-auto"
            >
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-heading font-extrabold leading-[1.1] tracking-tight mb-6 text-balance">
                   End the month as strong as you started.
                </h1>
                
                <p className="text-lg md:text-xl text-stone-600 mb-10 leading-relaxed font-light max-w-2xl mx-auto text-balance">
                    Secure your monthly groceries with small, easy payments throughout the semester. No more mid-month panic.
                </p>
                
                <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-16">
                    <Button size="xl" onClick={onProceed} className="rounded-full px-8 shadow-2xl shadow-brand-900/20 group text-lg">
                        Start Shopping <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                    <Button variant="ghost" size="xl" onClick={onHelp} className="rounded-full px-8 text-lg text-stone-600 hover:text-stone-900 hover:bg-white/50 backdrop-blur-sm">
                        <PlayCircle className="mr-2 w-5 h-5"/> How it works
                    </Button>
                </div>

                <div className="text-center">
                    <p className="text-sm font-bold text-stone-500 uppercase tracking-widest mb-6">Live on campus at</p>
                    <div className="flex justify-center items-center gap-8 md:gap-16 opacity-40 grayscale">
                        <span className="text-xl md:text-2xl font-black tracking-tighter">KNUST</span>
                        <span className="text-xl md:text-2xl font-black tracking-tighter">UCC</span>
                        <span className="text-xl md:text-2xl font-black tracking-tighter">LEGON</span>
                    </div>
                </div>
            </MotionDiv>
        </div>
      </section>
  );
};
