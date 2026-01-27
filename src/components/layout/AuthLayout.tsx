
import React from 'react';
import { motion } from 'framer-motion';
import { ASSETS } from '../../assets';
import { ArrowLeft, Star } from 'lucide-react';

const MotionDiv = motion.div as any;

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  onBack?: () => void;
  testimonial?: {
    quote: string;
    author: string;
    role: string;
  };
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ 
  children, 
  title, 
  subtitle, 
  onBack,
  testimonial = {
    quote: "SML has completely changed how I manage my semester budget. I never have to worry about food shortages mid-month anymore.",
    author: "Sarah Osei",
    role: "Medical Student, KNUST"
  }
}) => {
  return (
    <div className="min-h-screen flex bg-white font-sans selection:bg-brand-200 selection:text-brand-900">
      
      {/* LEFT COLUMN - Visual & Branding (Hidden on mobile) */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden flex-col justify-between p-16 text-white">
        {/* Background Image & Gradient */}
        <div className="absolute inset-0">
           <img 
             src={ASSETS.LANDING_HERO_BG} 
             className="w-full h-full object-cover" 
             alt="Background" 
           />
           <div className="absolute inset-0 bg-brand-900/95"></div>
           <div 
             className="absolute inset-0 opacity-10"
             style={{ backgroundImage: `url(${ASSETS.AUTH_BG_PATTERN})` }}
           ></div>
        </div>

        {/* Brand */}
        <div className="relative z-10">
           <div className="flex items-center gap-2 mb-6">
              <img src={ASSETS.LOGO_WHITE} alt="SML" className="h-10 w-auto" />
              <span className="font-serif font-bold text-2xl tracking-tight">SML.</span>
           </div>
        </div>

        {/* Testimonial / Value Prop */}
        <div className="relative z-10 max-w-lg">
           <div className="flex gap-1 text-amber-400 mb-6">
              {[1,2,3,4,5].map(i => <Star key={i} size={20} fill="currentColor" />)}
           </div>
           <blockquote className="text-2xl font-serif leading-relaxed mb-6 text-white/90">
             "{testimonial.quote}"
           </blockquote>
           <div>
             <p className="font-bold text-lg">{testimonial.author}</p>
             <p className="text-brand-200 font-medium">{testimonial.role}</p>
           </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-xs text-white/60 uppercase tracking-widest font-medium">
           © {new Date().getFullYear()} Smart Monthly Living
        </div>
      </div>

      {/* RIGHT COLUMN - Form Content */}
      <div className="w-full lg:w-1/2 flex flex-col relative bg-white">
        
        {/* Mobile Header / Back Button */}
        <div className="p-6 lg:p-12 flex justify-between items-center">
            {onBack ? (
                <button 
                  onClick={onBack} 
                  className="flex items-center gap-2 text-stone-500 hover:text-stone-900 transition-colors text-sm font-bold group"
                >
                    <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center group-hover:bg-stone-200 transition-colors">
                        <ArrowLeft size={14} />
                    </div>
                    Back to Home
                </button>
            ) : <div />}

            <div className="lg:hidden flex items-center gap-2">
                 <img src={ASSETS.LOGO} alt="SML" className="h-8 w-auto" />
            </div>
        </div>

        {/* Scrollable Form Area */}
        <div className="flex-1 flex items-center justify-center p-6 sm:p-12 md:px-20 overflow-y-auto">
           <MotionDiv 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.5 }}
             className="w-full max-w-md space-y-8"
           >
              <div className="text-center lg:text-left">
                  <h1 className="text-3xl md:text-4xl font-serif font-bold text-stone-900 mb-3">{title}</h1>
                  <p className="text-stone-500 text-lg">{subtitle}</p>
              </div>

              {children}
           </MotionDiv>
        </div>
      </div>
    </div>
  );
};
