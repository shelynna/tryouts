
import React from 'react';
import { Button } from '../ui';
import { Check, X } from 'lucide-react';

interface SubscriptionSectionProps {
    onSubscribe: () => void;
    onStartFree: () => void;
}

export const SubscriptionSection: React.FC<SubscriptionSectionProps> = ({ onSubscribe, onStartFree }) => {
  return (
      <section className="py-24 px-6 bg-[#FDFDFD] border-t border-stone-100" id="pricing">
         <div className="max-w-5xl mx-auto">
             <div className="text-center mb-16">
                <h2 className="text-3xl md:text-5xl font-serif font-bold text-stone-900 mb-4">Simple Membership</h2>
                <p className="text-stone-500 text-lg">Everyone can shop. Subscribers get extra security.</p>
             </div>

             <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                 {/* Free Tier */}
                 <div className="p-8 rounded-3xl border border-stone-200 bg-white hover:shadow-xl transition-shadow duration-300 flex flex-col">
                     <div className="mb-6">
                        <h3 className="text-xl font-bold text-stone-900">Standard User</h3>
                        <p className="text-stone-500 mt-1">Perfect for disciplined savers.</p>
                     </div>
                     <div className="mb-8">
                        <span className="text-4xl font-serif font-bold text-stone-900">Free</span>
                        <span className="text-stone-400 ml-2">/ forever</span>
                     </div>
                     <Button variant="outline" fullWidth size="lg" onClick={onStartFree} className="mb-8">Start Shopping</Button>
                     <div className="space-y-4 flex-1">
                        <div className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-2">Features</div>
                        <li className="flex gap-3 text-sm text-stone-600"><Check size={18} className="text-stone-900"/> Access wholesale prices</li>
                        <li className="flex gap-3 text-sm text-stone-600"><Check size={18} className="text-stone-900"/> Flexible installments</li>
                        <li className="flex gap-3 text-sm text-stone-600"><Check size={18} className="text-stone-900"/> Free delivery</li>
                        <li className="flex gap-3 text-sm text-stone-400 line-through decoration-stone-300"><X size={18}/> Top-up credit facility</li>
                     </div>
                 </div>

                 {/* Premium Tier */}
                 <div className="p-8 rounded-3xl border-2 border-brand-900 bg-stone-900 text-white shadow-2xl relative overflow-hidden flex flex-col transform md:-translate-y-4">
                     <div className="absolute top-0 right-0 bg-brand-500 text-white text-[10px] font-bold px-4 py-1.5 rounded-bl-xl uppercase tracking-widest">
                        Most Popular
                     </div>
                     <div className="mb-6">
                        <h3 className="text-xl font-bold text-white">SML Subscriber</h3>
                        <p className="text-stone-400 mt-1">For peace of mind.</p>
                     </div>
                     <div className="mb-8">
                        <span className="text-4xl font-serif font-bold text-white">GHS 15</span>
                        <span className="text-stone-500 ml-2">/ semester</span>
                     </div>
                     <Button variant="white" fullWidth size="lg" onClick={onSubscribe} className="mb-8">Upgrade Now</Button>
                     <div className="space-y-4 flex-1">
                        <div className="text-xs font-bold uppercase tracking-widest text-brand-700 mb-2">Everything in Free, plus:</div>
                        <li className="flex gap-3 text-sm text-stone-300"><Check size={18} className="text-brand-400"/> <strong>Credit Facility (Top-Ups)</strong></li>
                        <li className="flex gap-3 text-sm text-stone-300"><Check size={18} className="text-brand-400"/> Priority processing</li>
                        <li className="flex gap-3 text-sm text-stone-300"><Check size={18} className="text-brand-400"/> Deal drops access</li>
                     </div>
                 </div>
             </div>
         </div>
      </section>
  );
};
