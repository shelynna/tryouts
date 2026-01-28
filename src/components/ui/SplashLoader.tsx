
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ASSETS } from '../../assets';

interface SplashLoaderProps {
  isLoading: boolean;
  onComplete: () => void;
  logoUrl?: string;
}

export const SplashLoader: React.FC<SplashLoaderProps> = ({ isLoading, onComplete, logoUrl }) => {
  const [progress, setProgress] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    let interval: any;
    
    if (isLoading) {
      // Phase 1: Slow progress while loading data (up to 90%)
      interval = setInterval(() => {
        setProgress((prev) => {
          // Slow down as we get closer to 90%
          const increment = Math.max(0.5, (90 - prev) / 20);
          return prev < 90 ? prev + increment : prev;
        });
      }, 50);
    } else {
      // Phase 2: Data loaded, fast forward to 100%
      clearInterval(interval);
      setProgress(100);
    }

    return () => clearInterval(interval);
  }, [isLoading]);

  // Watch for completion
  useEffect(() => {
    if (progress >= 100) {
      const timer = setTimeout(() => {
        setIsFinished(true);
        // Add a small delay for the exit animation to play before unmounting logic triggers
        setTimeout(onComplete, 600); 
      }, 200); // Short pause at 100%
      return () => clearTimeout(timer);
    }
  }, [progress, onComplete]);

  // Use icon if no specific logo URL is provided from settings (default fallback to LOGO_ICON for cleaner look)
  const displayLogo = logoUrl || ASSETS.LOGO_ICON;

  // Fix for TypeScript errors with motion.div props
  const MotionDiv = motion.div as any;

  return (
    <AnimatePresence>
      {!isFinished && (
        <MotionDiv
          className="fixed inset-0 z-[9999] bg-[#F5F5F7] flex flex-col items-center justify-center"
          exit={{ opacity: 0, scale: 1.1, transition: { duration: 0.5, ease: "easeInOut" } }}
        >
          <div className="w-full max-w-xs px-8 flex flex-col items-center">
            
            {/* Logo Animation - Simplified without card */}
            <MotionDiv 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8 }}
              className="mb-8 relative"
            >
               <img 
                 src={displayLogo} 
                 className="w-20 h-auto object-contain drop-shadow-xl" 
                 alt="SML" 
               />
            </MotionDiv>

            {/* Progress Bar Container */}
            <div className="w-full h-1 bg-stone-200/50 rounded-full overflow-hidden relative">
              <MotionDiv 
                className="absolute top-0 left-0 bottom-0 bg-brand-600 rounded-full"
                style={{ width: `${progress}%` }}
                transition={{ ease: "linear" }}
              />
            </div>

            {/* Percentage Text */}
            <div className="mt-3 flex justify-between w-full text-[10px] font-bold uppercase tracking-widest text-stone-400 font-mono">
              <span>{progress < 100 ? 'Loading Assets' : 'Ready'}</span>
              <span>{Math.round(progress)}%</span>
            </div>
          </div>
        </MotionDiv>
      )}
    </AnimatePresence>
  );
};
