import React from 'react';
import { Button } from '../components/ui';
import { HelpCircle, ArrowLeft } from 'lucide-react';
import { HelpCenter } from '../components/help/HelpCenter';

export const HelpPage: React.FC<{ onBack: () => void }> = ({ onBack }) => (
  <div className="max-w-4xl mx-auto px-6 py-20 font-sans">
    
    {/* Header Section */}
    <div className="text-center max-w-2xl mx-auto mb-16">
      <div className="inline-flex items-center justify-center w-12 h-12 bg-white rounded-2xl shadow-sm mb-6 text-brand-600 border border-stone-100">
          <HelpCircle size={24} />
      </div>
      <h1 className="text-4xl md:text-5xl font-serif font-bold text-brand-900 mb-4 tracking-tight leading-tight">Support Center</h1>
      <p className="text-lg text-stone-500 font-medium max-w-lg mx-auto leading-relaxed">
        Everything you need to know about managing your monthly essentials budget.
      </p>
    </div>

    {/* Use New HelpCenter Component */}
    <HelpCenter />
    
    {/* Footer Back Button */}
    <div className="text-center mt-20">
      <Button 
        variant="ghost" 
        onClick={onBack} 
        className="gap-2 font-bold uppercase tracking-widest text-[11px] text-stone-400 hover:text-stone-900 h-10 px-6 rounded-full border border-transparent hover:border-stone-200 transition-all"
      >
        <ArrowLeft size={16} /> Return to Home
      </Button>
    </div>
  </div>
);