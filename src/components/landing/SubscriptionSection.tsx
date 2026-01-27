
import React from 'react';
import { Button } from '../ui';
import { Check } from 'lucide-react';

interface SubscriptionSectionProps {
    onSubscribe: () => void;
    onStartFree: () => void;
}

export const SubscriptionSection: React.FC<SubscriptionSectionProps> = ({ onSubscribe, onStartFree }) => {
  return (
      <section className="py-24 px-6 bg-stone-50 text-stone-900 border-y border-stone-200" id="pricing">
         <div className="max-w-6xl mx-auto">
             <div className="text-center mb-16">
                <h2 className="text-3xl md:text-5xl font-heading font-bold mb-4">Simple, Fair Pricing</h2>
                <p className="text-stone-600 text-lg">Everyone can shop. Subscribers get extra security.</p>
             </div>

             <div className="flex flex-col md:flex-row justify-center items-center gap-8">
                 {/* Standard Tier */}
                 <div className="p-10 rounded-3xl bg-white border border-stone-200 w-full md:w-[380px] shadow-soft relative">
                     <div className="mb-6">
                        <h3 className="text-2xl font-bold text-stone-900">Standard User</h3>
                        <p className="text-stone-500 mt-2 text-sm">Perfect for disciplined savers.</p>
                     </div>
                     <div className="mb-8">
                        <span className="text-5xl font-heading font-bold text-stone-900">Free</span>
                        <span className="text-stone-500 ml-2">/ forever</span>
                     </div>
                     <Button variant="outline" fullWidth size="lg" onClick={onStartFree} className="mb-8 font-bold text-stone-800 border-stone-300 hover:bg-stone-100">Start Shopping</Button>
                     <ul className="space-y-4">
                        <li className="flex gap-3 text-sm text-stone-600"><Check size={18} className="text-brand-500 shrink-0"/> Access wholesale prices</li>
                        <li className="flex gap-3 text-sm text-stone-600"><Check size={18} className="text-brand-500 shrink-0"/> Flexible installments</li>
                        <li className="flex gap-3 text-sm text-stone-600"><Check size={18} className="text-brand-500 shrink-0"/> Free delivery to campus halls</li>
                     </ul>
                 </div>

                 {/* Subscriber Tier */}
                 <div className="p-10 rounded-3xl bg-white border-2 border-brand-500 w-full md:w-[380px] shadow-xl relative md:scale-105">
                     <div className="absolute top-0 right-8 bg-brand-500 text-white text-[10px] font-bold px-4 py-1.5 rounded-b-lg uppercase tracking-widest shadow-lg">
                        Recommended
                     </div>
                     <div className="mb-6">
                        <h3 className="text-2xl font-bold text-stone-900">SML Subscriber</h3>
                        <p className="text-stone-500 mt-2 text-sm">For total peace of mind.</p>
                     </div>
                     <div className="mb-8">
                        <span className="text-5xl font-heading font-bold text-stone-900">GHS 15</span>
                        <span className="text-stone-500 ml-2">/ semester</span>
                     </div>
                     <Button variant="primary" fullWidth size="lg" onClick={onSubscribe} className="mb-8 font-bold shadow-xl shadow-brand-900/20">Upgrade Now</Button>
                     <ul className="space-y-4">
                        <li className="text-xs font-bold uppercase tracking-widest text-stone-500">Everything in Standard, plus:</li>
                        <li className="flex gap-3 text-sm text-stone-800"><Check size={18} className="text-brand-500 shrink-0"/> <strong>Credit Facility (Top-Ups)</strong></li>
                        <li className="flex gap-3 text-sm text-stone-800"><Check size={18} className="text-brand-500 shrink-0"/> Priority processing & support</li>
                        <li className="flex gap-3 text-sm text-stone-800"><Check size={18} className="text-brand-500 shrink-0"/> Exclusive deal drops access</li>
                     </ul>
                 </div>
             </div>
         </div>
      </section>
  );
};
