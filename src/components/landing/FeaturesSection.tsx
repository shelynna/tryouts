
import React from 'react';
import { ShoppingBag, CreditCard, Truck } from 'lucide-react';

export const FeaturesSection: React.FC = () => {
  const steps = [
      {
          icon: <ShoppingBag size={28} />,
          title: "1. Build Basket",
          desc: "Select essential items like Rice, Oil, and Canned Fish from our wholesale marketplace."
      },
      {
          icon: <CreditCard size={28} />,
          title: "2. Pay Small-Small",
          desc: "No bulk cash needed. Pay GHS 20 whenever you have spare change."
      },
      {
          icon: <Truck size={28} />,
          title: "3. Collect & Enjoy",
          desc: "On delivery day, pick up your fully paid items from your hall representative."
      }
  ];

  return (
      <section className="py-24 bg-white">
         <div className="container-padding">
            <div className="text-center max-w-2xl mx-auto mb-16">
                <h2 className="text-3xl md:text-4xl font-heading font-bold text-stone-900 mb-4">How SML Works</h2>
                <p className="text-stone-500 text-lg">We bridge the gap between your monthly allowance and your daily hunger.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
                {steps.map((step, i) => (
                    <div key={i} className="bg-white p-8 rounded-3xl shadow-soft border border-stone-100 hover:-translate-y-2 transition-transform duration-300">
                        <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center text-brand-600 mb-6">
                            {step.icon}
                        </div>
                        <h3 className="text-xl font-bold text-stone-900 mb-3">{step.title}</h3>
                        <p className="text-stone-500 leading-relaxed">{step.desc}</p>
                    </div>
                ))}
            </div>
         </div>
      </section>
  );
};
