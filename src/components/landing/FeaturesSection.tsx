
import React from 'react';
import { Card, Button } from '../ui';
import { ShoppingBag, CreditCard, Truck, ArrowRight, Wallet, Check } from 'lucide-react';

export const FeaturesSection: React.FC<{ onProceed: () => void }> = ({ onProceed }) => {
  const steps = [
      {
          icon: <ShoppingBag size={24} />,
          title: "1. Build Basket",
          desc: "Select essential items like Rice, Oil, and Canned Fish from our wholesale marketplace."
      },
      {
          icon: <Wallet size={24} />,
          title: "2. Pay Small-Small",
          desc: "No bulk cash needed. Pay GHS 5, GHS 10, or GHS 20 whenever you have spare change."
      },
      {
          icon: <Truck size={24} />,
          title: "3. Collect & Eat",
          desc: "On delivery day (28th), pick up your fully paid items from your hall representative."
      }
  ];

  return (
      <section className="py-24 bg-white">
         <div className="container-padding">
            <div className="text-center max-w-2xl mx-auto mb-16">
                <h2 className="text-3xl md:text-5xl font-serif font-bold text-stone-900 mb-4">How SML Works</h2>
                <p className="text-stone-500 text-lg">We bridge the gap between your monthly allowance and your daily hunger.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 relative">
                {/* Connecting Line (Desktop) */}
                <div className="hidden md:block absolute top-8 left-[16%] right-[16%] h-0.5 bg-stone-100 z-0"></div>

                {steps.map((step, i) => (
                    <div key={i} className="relative z-10 flex flex-col items-center text-center group">
                        <div className="w-16 h-16 bg-white border border-stone-200 rounded-2xl shadow-soft flex items-center justify-center text-stone-900 mb-6 group-hover:scale-110 group-hover:border-brand-500 group-hover:text-brand-600 transition-all duration-300">
                            {step.icon}
                        </div>
                        <h3 className="text-xl font-bold text-stone-900 mb-3">{step.title}</h3>
                        <p className="text-stone-500 leading-relaxed max-w-xs">{step.desc}</p>
                    </div>
                ))}
            </div>

            <div className="mt-20 grid md:grid-cols-2 gap-8 items-center bg-stone-50 rounded-3xl p-8 md:p-12 border border-stone-100">
                <div className="space-y-6">
                    <h3 className="text-3xl font-serif font-bold text-stone-900">Why Students Love Us?</h3>
                    <div className="space-y-4">
                        {[
                            "Wholesale prices (cheaper than campus market)",
                            "prevents 'Sapa' (mid-semester brokenness)",
                            "Zero interest on standard installments",
                            "Free delivery to major halls"
                        ].map((feat, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <div className="w-6 h-6 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center shrink-0">
                                    <Check size={14} strokeWidth={3} />
                                </div>
                                <span className="font-medium text-stone-700">{feat}</span>
                            </div>
                        ))}
                    </div>
                    <Button onClick={onProceed} className="mt-4">
                        Join the Movement <ArrowRight size={18} className="ml-2" />
                    </Button>
                </div>
                <div className="relative h-64 md:h-full min-h-[300px] bg-stone-200 rounded-2xl overflow-hidden">
                    {/* Abstract Representation of Savings */}
                    <div className="absolute inset-0 bg-gradient-to-br from-brand-900 to-brand-700 flex items-center justify-center text-white text-center p-8">
                        <div>
                            <p className="text-6xl font-serif font-bold mb-2">30%</p>
                            <p className="text-brand-200 font-medium">Average savings compared to buying retail daily.</p>
                        </div>
                    </div>
                </div>
            </div>
         </div>
      </section>
  );
};
