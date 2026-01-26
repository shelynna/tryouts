
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, CreditCard, Truck, ArrowRight, Check, X } from 'lucide-react';
import { Button } from '../ui';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  pickupPoint: string;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onClose, onComplete, pickupPoint }) => {
  const [step, setStep] = useState(0);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  const steps = [
    {
      icon: <ShoppingBag size={48} className="text-brand-500" />,
      title: "Build Your Basket",
      desc: "Browse the marketplace and add essentials like Rice, Oil, and Canned goods to your monthly basket. Prices are locked the moment you add them.",
      color: "bg-brand-50"
    },
    {
      icon: <CreditCard size={48} className="text-accent-500" />,
      title: "Pay Small-Small",
      desc: "No bulk cash? No problem. Make payments of any amount (e.g., GHS 10, GHS 50) via Mobile Money whenever you have cash flow.",
      color: "bg-accent-50"
    },
    {
      icon: <Truck size={48} className="text-stone-700" />,
      title: "Delivery Day",
      desc: `On the 28th of the month, verify your order and collect your physical items at ${pickupPoint}. Only paid items are delivered.`,
      color: "bg-stone-100"
    }
  ];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-[998] flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
          className="bg-white rounded-[32px] shadow-2xl max-w-md w-full overflow-hidden relative z-[999] flex flex-col"
        >
          {/* Progress Bar Header */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-stone-100">
            <motion.div 
              className="h-full bg-brand-500"
              initial={{ width: "33%" }}
              animate={{ width: `${((step + 1) / steps.length) * 100}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>

          <button 
            onClick={onClose} 
            className="absolute top-5 right-5 p-2 text-stone-300 hover:text-stone-500 hover:bg-stone-100 rounded-full transition-colors z-10"
          >
            <X size={20} />
          </button>

          <div className="p-8 pt-12 text-center flex-1 flex flex-col items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center"
              >
                <div className={`w-28 h-28 rounded-full flex items-center justify-center mb-8 ${steps[step].color} shadow-inner`}>
                  {steps[step].icon}
                </div>
                
                <h2 className="text-3xl font-serif font-bold text-stone-900 mb-4 tracking-tight">
                  {steps[step].title}
                </h2>
                
                <p className="text-stone-500 leading-relaxed mb-10 text-lg max-w-[300px]">
                  {steps[step].desc}
                </p>
              </motion.div>
            </AnimatePresence>

            <div className="flex gap-2 justify-center mb-8">
              {steps.map((_, i) => (
                <div 
                  key={i} 
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${i === step ? 'bg-brand-900 w-6' : 'bg-stone-200'}`}
                />
              ))}
            </div>

            <Button size="xl" fullWidth onClick={handleNext} className="shadow-xl shadow-brand-900/20 text-lg rounded-2xl">
              {step === steps.length - 1 ? (
                <span className="flex items-center gap-2">Start Shopping <Check size={20} /></span>
              ) : (
                <span className="flex items-center gap-2">Next Step <ArrowRight size={20} /></span>
              )}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
