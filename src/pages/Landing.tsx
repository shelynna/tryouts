
import React from 'react';
import { HeroSection } from '../components/landing/HeroSection';
import { SubscriptionSection } from '../components/landing/SubscriptionSection';
import { FeaturesSection } from '../components/landing/FeaturesSection';
import { Button, Card } from '../components/ui';
import { ArrowRight, Star, ShoppingBag, Plus } from 'lucide-react';
import { ASSETS } from '../assets';
import { formatCurrency } from '../lib/utils';
import { motion } from 'framer-motion';

interface LandingProps {
    onProceed: () => void;
    onHelp: () => void;
    onSubscribeIntent: () => void;
    heroImages?: string[];
}

export const LandingView: React.FC<LandingProps> = ({ onProceed, onHelp, onSubscribeIntent, heroImages }) => {
  
  // Mock Data for "Shop Preview" - In real app, could be fetched from API
  const featuredProducts = [
      { id: '1', name: 'Perfumed Rice', size: '5kg Bag', price: 120.00, image: ASSETS.PRODUCT_RICE },
      { id: '2', name: 'Vegetable Oil', size: '1L Bottle', price: 45.00, image: ASSETS.PRODUCT_OIL },
      { id: '3', name: 'Sardines (Club)', size: 'Pack of 5', price: 65.00, image: ASSETS.PRODUCT_CANNED },
      { id: '4', name: 'Indomie Pack', size: 'Box of 12', price: 55.00, image: ASSETS.PRODUCT_NOODLES },
  ];

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-brand-200 selection:text-brand-900">
      
      <HeroSection onProceed={onProceed} onHelp={onHelp} images={heroImages} />
      
      {/* Brand Strip */}
      <div className="border-y border-stone-100 py-6 bg-white overflow-hidden">
        <div className="container-padding flex justify-between items-center opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
            <span className="text-xs font-bold uppercase tracking-widest text-stone-400 hidden md:block">Serving students at:</span>
            <div className="flex gap-8 md:gap-16 font-serif font-bold text-xl text-stone-800 w-full md:w-auto justify-around md:justify-end">
                <span>KNUST</span>
                <span>UCC</span>
                <span>LEGON</span>
            </div>
        </div>
      </div>

      <FeaturesSection onProceed={onProceed} />
      
      {/* --- NEW: E-COMMERCE SHOP PREVIEW --- */}
      <section className="py-24 bg-[#F9FAFB]">
          <div className="container-padding">
              <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
                  <div>
                      <h2 className="text-3xl md:text-5xl font-serif font-bold text-stone-900 mb-2">Shop Essentials</h2>
                      <p className="text-stone-500">Best-selling items for this month's cycle.</p>
                  </div>
                  <Button variant="outline" onClick={onProceed} className="group">
                      View Full Market <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform"/>
                  </Button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {featuredProducts.map((p) => (
                      <div key={p.id} className="group bg-white rounded-2xl p-3 shadow-sm border border-stone-100 hover:shadow-xl hover:border-brand-200 transition-all cursor-pointer" onClick={onProceed}>
                          <div className="aspect-[4/5] bg-stone-50 rounded-xl mb-4 relative overflow-hidden flex items-center justify-center">
                              <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                              <button className="absolute bottom-3 right-3 w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center text-stone-900 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                                  <Plus size={20} />
                              </button>
                          </div>
                          <div className="px-1">
                              <h3 className="font-bold text-stone-900 text-lg leading-tight">{p.name}</h3>
                              <p className="text-stone-500 text-xs uppercase font-bold tracking-wider mb-2">{p.size}</p>
                              <div className="font-serif font-bold text-brand-700">{formatCurrency(p.price)}</div>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      </section>

      {/* --- NEW: TESTIMONIALS --- */}
      <section className="py-24 bg-white border-t border-stone-100">
          <div className="container-padding">
              <h2 className="text-3xl font-serif font-bold text-center mb-16">Student Stories</h2>
              <div className="grid md:grid-cols-3 gap-8">
                  {[
                      { name: "Kofi A.", school: "KNUST, 3rd Year", quote: "I used to go broke by the 15th. SML helps me lock down my rice and oil immediately school reopens." },
                      { name: "Sarah M.", school: "Legon, 2nd Year", quote: "The installment payment is a lifesaver. I pay GHS 10 whenever I sell a wig or get pocket money." },
                      { name: "Emmanuel O.", school: "UCC, Final Year", quote: "Delivery to the hall is key. No more carrying heavy bags from market to shuttle." }
                  ].map((t, i) => (
                      <Card key={i} className="bg-stone-50 border-none p-8">
                          <div className="flex gap-1 text-amber-400 mb-4">
                              <Star size={16} fill="currentColor"/>
                              <Star size={16} fill="currentColor"/>
                              <Star size={16} fill="currentColor"/>
                              <Star size={16} fill="currentColor"/>
                              <Star size={16} fill="currentColor"/>
                          </div>
                          <p className="text-stone-700 font-medium mb-6 leading-relaxed">"{t.quote}"</p>
                          <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-brand-200 flex items-center justify-center text-brand-800 font-bold font-serif">
                                  {t.name.charAt(0)}
                              </div>
                              <div>
                                  <p className="text-sm font-bold text-stone-900">{t.name}</p>
                                  <p className="text-xs text-stone-500 uppercase tracking-wider">{t.school}</p>
                              </div>
                          </div>
                      </Card>
                  ))}
              </div>
          </div>
      </section>

      <SubscriptionSection 
        onStartFree={onProceed}
        onSubscribe={onSubscribeIntent}
      />

      {/* CTA Footer - Large Impact */}
      <section className="py-32 bg-stone-900 text-white text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
          <div className="container-padding relative z-10">
              <h2 className="text-5xl md:text-8xl font-serif mb-8 text-white tracking-tighter">
                  Eat Smart. <span className="text-brand-500">Live Well.</span>
              </h2>
              <p className="text-stone-400 max-w-xl mx-auto mb-12 text-xl font-light">
                  Join 1,000+ students securing their monthly sustenance today.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <Button 
                    variant="white" 
                    size="xl" 
                    onClick={onProceed}
                    className="rounded-full px-12 h-16 text-lg font-bold"
                  >
                      Get Started Now <ArrowRight className="ml-2" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="xl" 
                    onClick={onHelp}
                    className="rounded-full px-12 h-16 text-lg border-stone-700 text-stone-300 hover:text-white hover:border-white"
                  >
                      Contact Support
                  </Button>
              </div>
          </div>
      </section>
    </div>
  );
};
