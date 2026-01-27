
import React from 'react';
import { Button, Card } from '../components/ui';
import { ArrowLeft, Calendar, Lock, Truck, CreditCard, Info } from 'lucide-react';

export const PricingCyclePage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const steps = [
    {
      date: "1st - 24th",
      title: "Payment Window Open",
      desc: "The marketplace is open. You can add items to your basket and pay in installments (any amount, any time).",
      icon: <CreditCard className="text-brand-600" />,
      color: "bg-brand-50 border-brand-200"
    },
    {
      date: "25th",
      title: "Cycle Lock Date",
      desc: "Baskets are locked. You cannot add or remove items after this date. Final payments must be made to secure your order.",
      icon: <Lock className="text-orange-600" />,
      color: "bg-orange-50 border-orange-200"
    },
    {
      date: "26th - 27th",
      title: "Bulk Procurement",
      desc: "SML aggregates all paid orders and purchases fresh stock directly from manufacturers.",
      icon: <Info className="text-blue-600" />,
      color: "bg-blue-50 border-blue-200"
    },
    {
      date: "28th",
      title: "Delivery Day",
      desc: "Distribution centers open at Hall 7, Conti, and other designated points. You receive a code to collect your items.",
      icon: <Truck className="text-stone-700" />,
      color: "bg-stone-100 border-stone-200"
    }
  ];

  return (
    <div className="max-w-4xl mx-auto px-6 py-20 font-sans pt-24">
        <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-brand-600 font-bold uppercase tracking-widest text-xs mb-4 block">Transparency First</span>
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-stone-900 mb-6">The Monthly Cycle</h1>
            <p className="text-lg text-stone-500 font-light leading-relaxed">
                Our system runs on a strict monthly schedule to guarantee wholesale prices and timely delivery.
            </p>
        </div>

        <div className="relative border-l-2 border-stone-100 ml-4 md:ml-10 space-y-12 mb-20">
            {steps.map((step, i) => (
                <div key={i} className="relative pl-8 md:pl-12">
                    <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 bg-white ${step.color.split(' ')[1]}`}></div>
                    <Card className={`p-6 border-2 ${step.color}`}>
                        <div className="flex flex-col md:flex-row gap-6 items-start">
                            <div className="shrink-0 p-4 bg-white rounded-xl shadow-sm">
                                {step.icon}
                            </div>
                            <div>
                                <span className="inline-block px-3 py-1 rounded-full bg-white text-stone-900 text-xs font-bold uppercase tracking-widest mb-2 shadow-sm border border-stone-100">
                                    {step.date}
                                </span>
                                <h3 className="text-xl font-bold text-stone-900 mb-2">{step.title}</h3>
                                <p className="text-stone-600 leading-relaxed">{step.desc}</p>
                            </div>
                        </div>
                    </Card>
                </div>
            ))}
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-16">
            <Card className="p-8">
                <h3 className="font-serif font-bold text-xl text-stone-900 mb-4">Service Fee (5%)</h3>
                <p className="text-stone-500 mb-4 text-sm leading-relaxed">
                    A small fee added to your basket total. This covers:
                </p>
                <ul className="space-y-2 text-sm text-stone-600 font-medium">
                    <li className="flex gap-2"><div className="w-1.5 h-1.5 rounded-full bg-stone-300 mt-2"></div> Transport & Logistics to campus</li>
                    <li className="flex gap-2"><div className="w-1.5 h-1.5 rounded-full bg-stone-300 mt-2"></div> Packaging & Handling</li>
                    <li className="flex gap-2"><div className="w-1.5 h-1.5 rounded-full bg-stone-300 mt-2"></div> Payment Processing Fees</li>
                </ul>
            </Card>
            <Card className="p-8">
                <h3 className="font-serif font-bold text-xl text-stone-900 mb-4">Top-Up Interest (5%)</h3>
                <p className="text-stone-500 mb-4 text-sm leading-relaxed">
                    Only applies if you use our credit facility.
                </p>
                <ul className="space-y-2 text-sm text-stone-600 font-medium">
                    <li className="flex gap-2"><div className="w-1.5 h-1.5 rounded-full bg-stone-300 mt-2"></div> Applied only to the amount borrowed</li>
                    <li className="flex gap-2"><div className="w-1.5 h-1.5 rounded-full bg-stone-300 mt-2"></div> Repaid in the subsequent month</li>
                    <li className="flex gap-2"><div className="w-1.5 h-1.5 rounded-full bg-stone-300 mt-2"></div> Keeps the credit pool sustainable</li>
                </ul>
            </Card>
        </div>

        <div className="text-center">
            <Button variant="outline" onClick={onBack} size="lg" className="gap-2 border-stone-300 hover:border-stone-900 text-stone-600 hover:text-stone-900">
                <ArrowLeft size={18} /> Back to Home
            </Button>
        </div>
    </div>
  );
};
