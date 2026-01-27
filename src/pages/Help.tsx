
import React from 'react';
import { Card, Button } from '../components/ui';
import { MessageSquare, PhoneCall, HelpCircle, ArrowLeft } from 'lucide-react';

export const HelpPage: React.FC<{ onBack: () => void }> = ({ onBack }) => (
  <div className="max-w-4xl mx-auto px-6 py-20 font-sans">
    
    {/* Anchored Header */}
    <div className="text-center max-w-2xl mx-auto mb-16">
      <div className="inline-flex items-center justify-center w-12 h-12 bg-white rounded-2xl shadow-sm mb-6 text-brand-600">
          <HelpCircle size={24} />
      </div>
      <h1 className="text-4xl md:text-5xl font-serif text-brand-900 mb-4 tracking-tight leading-tight">Support Center</h1>
      <p className="text-lg text-stone-500 font-medium max-w-lg mx-auto">Get assistance with your monthly essentials budget. We are here to help.</p>
    </div>

    {/* Anchored Cards with stronger shadow/border for separation from background */}
    <div className="grid md:grid-cols-2 gap-6 mb-12">
      <Card className="flex flex-col items-center text-center p-10 shadow-xl hover:shadow-2xl transition-all duration-300 bg-white group">
        <div className="w-16 h-16 bg-brand-50 text-brand-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
            <MessageSquare size={32} />
        </div>
        <h3 className="text-xl font-serif font-bold text-stone-900 mb-2">WhatsApp Live</h3>
        <p className="text-stone-500 mb-8 font-medium">Instant support from our campus team.</p>
        <Button variant="outline" fullWidth className="mt-auto border-stone-300 hover:border-brand-500 hover:text-brand-900">Launch Chat</Button>
      </Card>
      
      <Card className="flex flex-col items-center text-center p-10 shadow-xl hover:shadow-2xl transition-all duration-300 bg-white group">
        <div className="w-16 h-16 bg-brand-50 text-brand-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
            <PhoneCall size={32} />
        </div>
        <h3 className="text-xl font-serif font-bold text-stone-900 mb-2">KNUST Hotline</h3>
        <p className="text-stone-500 mb-8 font-medium">Direct line for urgent collection issues.</p>
        <Button variant="outline" fullWidth className="mt-auto border-stone-300 hover:border-brand-500 hover:text-brand-900">Call Campus Ops</Button>
      </Card>
    </div>

    {/* FAQ Section Anchored */}
    <Card className="p-8 md:p-12 shadow-lg bg-white">
      <h2 className="text-2xl font-serif text-brand-900 mb-8 flex items-center gap-3">
          Frequently Asked Questions
      </h2>
      <div className="space-y-8">
        {[
          { q: "What happens if I don't finish paying?", a: "Your paid balance automatically rolls over to the next month's basket. You never lose your funds!" },
          { q: "How do Top-Ups work?", a: "If you've paid at least 70% of your basket, you can request a Top-Up loan to complete it immediately. Repayment happens in the next cycle." },
          { q: "Is registration free?", a: "Absolutely. SML is a free utility for students to manage their essentials budget." }
        ].map((faq, i) => (
          <div key={i} className="group">
            <h4 className="text-lg font-bold text-stone-900 mb-2 tracking-tight group-hover:text-brand-700 transition-colors">{faq.q}</h4>
            <p className="text-base text-stone-500 font-medium leading-relaxed opacity-90">{faq.a}</p>
          </div>
        ))}
      </div>
    </Card>
    
    <div className="text-center mt-12">
      <Button variant="ghost" onClick={onBack} className="gap-2 font-bold uppercase tracking-widest text-xs text-stone-400 hover:text-stone-800">
        <ArrowLeft size={16} /> Return to Home
      </Button>
    </div>
  </div>
);