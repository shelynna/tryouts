
import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '../ui';
import { ArrowRight, Star, ShieldCheck, Clock } from 'lucide-react';
import { ASSETS } from '../../assets';

interface HeroSectionProps {
    onProceed: () => void;
    onHelp: () => void;
    images?: string[];
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onProceed, images }) => {
  const heroImage = images && images.length > 0 ? images[0] : ASSETS.LANDING_HERO_BG;

  return (
      <section className="relative pt-32 pb-16 md:pt-40 md:pb-24 overflow-hidden bg-stone-50">
        <div className="container-padding relative z-10">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                
                {/* Left: Copy */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6 }}
                    className="max-w-2xl"
                >
                    <div className="inline-flex items-center gap-2 py-1.5 px-3 rounded-full bg-brand-100/50 border border-brand-100 text-brand-700 text-xs font-bold uppercase tracking-widest mb-6">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
                        </span>
                        Cycle Closing Soon
                    </div>
                    
                    <h1 className="text-5xl sm:text-6xl md:text-7xl font-serif font-bold text-stone-900 leading-[1.05] tracking-tight mb-6">
                       Monthly Groceries.<br/>
                       <span className="text-brand-600">Micro Payments.</span>
                    </h1>
                    
                    <p className="text-lg md:text-xl text-stone-500 mb-8 leading-relaxed font-light max-w-lg">
                        Stock your hostel pantry with premium rice, oil, and essentials. Pay small-small (GHS 5+) throughout the month.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-4 mb-10">
                        <Button size="xl" onClick={onProceed} className="rounded-full px-10 h-16 text-lg shadow-xl shadow-brand-900/20 group">
                            Start Shopping <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                        <button onClick={onProceed} className="flex items-center justify-center gap-2 px-6 h-16 rounded-full font-bold text-stone-600 hover:text-stone-900 transition-colors">
                             View Bundle Deals
                        </button>
                    </div>

                    <div className="flex items-center gap-8 text-sm font-medium text-stone-500">
                        <div className="flex items-center gap-2">
                            <div className="flex -space-x-2">
                                {[1,2,3,4].map(i => (
                                    <div key={i} className="w-8 h-8 rounded-full bg-stone-200 border-2 border-white flex items-center justify-center text-[10px] font-bold text-stone-500">
                                        {['','','', '+500'][i-1]}
                                    </div>
                                ))}
                            </div>
                            <span className="ml-1">Trusted Students</span>
                        </div>
                        <div className="w-px h-8 bg-stone-200 hidden sm:block"></div>
                        <div className="flex items-center gap-1 text-emerald-600">
                            <Star size={16} fill="currentColor" />
                            <span className="text-stone-700"><strong>4.9/5</strong> Rating</span>
                        </div>
                    </div>
                </motion.div>

                {/* Right: Visual */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="relative"
                >
                    <div className="relative aspect-[4/5] md:aspect-[3/4] rounded-[32px] overflow-hidden shadow-2xl border-4 border-white">
                         <img 
                            src={heroImage} 
                            className="w-full h-full object-cover"
                            alt="Student Shopping"
                        />
                        {/* Overlay Gradient */}
                        <div className="absolute inset-0 bg-gradient-to-t from-stone-900/60 via-transparent to-transparent"></div>

                        {/* Floating Cards */}
                        <div className="absolute bottom-8 left-8 right-8 p-6 bg-white/95 backdrop-blur-md rounded-2xl shadow-lg border border-white/20">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2 text-brand-700 font-bold uppercase text-xs tracking-wider">
                                    <Clock size={14} /> Next Delivery
                                </div>
                                <span className="text-stone-900 font-mono font-bold">28th Oct</span>
                            </div>
                            <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-brand-500 w-[75%] h-full rounded-full"></div>
                            </div>
                            <p className="text-[10px] text-stone-400 mt-2 text-right">Cycle 75% Full</p>
                        </div>

                        <div className="absolute -top-6 -right-6 bg-accent-500 text-white p-4 rounded-2xl shadow-lg transform rotate-6 hidden md:block">
                            <p className="text-xs font-bold uppercase tracking-widest mb-1 opacity-90">Special Offer</p>
                            <p className="text-2xl font-serif font-bold">Free Delivery</p>
                            <p className="text-xs opacity-90">To Hall 7 & Conti</p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
      </section>
  );
};
