import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, PhoneCall, HelpCircle, ChevronDown, Sparkles } from 'lucide-react';
import { Card, Button } from '../ui';

const MotionDiv = motion.div as any;

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  { 
    question: "What happens if I don't finish paying?", 
    answer: "Your paid balance automatically rolls over to the next month's basket. You never lose your funds! SML is designed to be flexible with your student budget." 
  },
  { 
    question: "How do Top-Ups work?", 
    answer: "If you've paid at least 70% of your basket, you can request a Top-Up loan to complete it immediately. Repayment happens automatically in the next cycle's basket." 
  },
  { 
    question: "Is registration really free?", 
    answer: "Absolutely. SML is a free utility for students. We only charge a small service fee on baskets to cover campus logistics and handling." 
  },
  { 
    question: "Where do I pick up my items?", 
    answer: "On delivery day (the 28th), we open distribution centers at Hall 7, Conti, and other designated campus points. You'll receive a secure code via SMS and on your dashboard." 
  },
  { 
    question: "Can I change items in my basket?", 
    answer: "Yes, you can add or remove items as often as you like until the 'Lock Date' (usually the 25th of each month)." 
  }
];

const FAQAccordionItem: React.FC<{ faq: FAQItem; isOpen: boolean; toggle: () => void }> = ({ faq, isOpen, toggle }) => {
  return (
    <div className="border-b border-stone-100 last:border-0">
      <button 
        onClick={toggle}
        className="w-full py-5 flex items-center justify-between text-left group transition-all"
      >
        <span className={`text-base font-bold transition-colors ${isOpen ? 'text-brand-700' : 'text-stone-900 group-hover:text-brand-600'}`}>
          {faq.question}
        </span>
        <div className={`shrink-0 ml-4 p-1 rounded-full transition-all duration-300 ${isOpen ? 'bg-brand-50 text-brand-600 rotate-180' : 'bg-stone-50 text-stone-400'}`}>
          <ChevronDown size={18} />
        </div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <MotionDiv
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="pb-6 text-stone-500 font-medium leading-relaxed">
              {faq.answer}
            </div>
          </MotionDiv>
        )}
      </AnimatePresence>
    </div>
  );
};

export const HelpCenter: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="space-y-12">
      {/* Support Channels Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="flex flex-col items-center text-center p-10 shadow-xl hover:shadow-2xl transition-all duration-300 bg-white group border border-stone-100">
          <div className="w-16 h-16 bg-brand-50 text-brand-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-inner">
            <MessageSquare size={32} />
          </div>
          <h3 className="text-xl font-serif font-bold text-stone-900 mb-2">WhatsApp Live</h3>
          <p className="text-stone-500 mb-8 font-medium">Instant support from our campus team. Available 8am - 8pm daily.</p>
          <Button variant="outline" fullWidth className="mt-auto border-stone-200 hover:border-brand-500 hover:text-brand-900 rounded-xl h-12">
            Launch Chat
          </Button>
        </Card>
        
        <Card className="flex flex-col items-center text-center p-10 shadow-xl hover:shadow-2xl transition-all duration-300 bg-white group border border-stone-100">
          <div className="w-16 h-16 bg-brand-50 text-brand-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-inner">
            <PhoneCall size={32} />
          </div>
          <h3 className="text-xl font-serif font-bold text-stone-900 mb-2">KNUST Hotline</h3>
          <p className="text-stone-500 mb-8 font-medium">Direct line for urgent collection issues and emergencies.</p>
          <Button variant="outline" fullWidth className="mt-auto border-stone-200 hover:border-brand-500 hover:text-brand-900 rounded-xl h-12">
            Call Campus Ops
          </Button>
        </Card>
      </div>

      {/* FAQ Section */}
      <Card className="p-8 md:p-12 shadow-lg bg-white border border-stone-50 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 text-brand-50 pointer-events-none opacity-50">
          <Sparkles size={120} strokeWidth={0.5} />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-brand-900 text-white rounded-xl flex items-center justify-center">
              <HelpCircle size={20} />
            </div>
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-stone-900">
              Common Questions
            </h2>
          </div>

          <div className="bg-stone-50/30 rounded-2xl p-2">
            {faqs.map((faq, i) => (
              <FAQAccordionItem 
                key={i} 
                faq={faq} 
                isOpen={openIndex === i} 
                toggle={() => setOpenIndex(openIndex === i ? null : i)}
              />
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
};