
import React from 'react';
import { Button, Card, Skeleton } from '../components/ui';
import { ArrowLeft, Truck, CreditCard, Info, ShoppingBag, Wallet } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { API } from '../lib/api';

const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "TBD";
    const date = new Date(dateString);
    const day = date.getDate();
    const suffix = ["th", "st", "nd", "rd"][((day % 100) > 10 && (day % 100) < 20) ? 0 : (day % 10 < 4 ? day % 10 : 0)];
    return `${day}${suffix} ${date.toLocaleString('default', { month: 'short' })}`;
};

export const PricingCyclePage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { data: settings, isLoading } = useQuery({
      queryKey: ['settings'],
      queryFn: () => API.getSettings()
  });

  if (isLoading || !settings) {
      return (
          <div className="max-w-4xl mx-auto px-6 py-20 pt-24 space-y-8">
              <Skeleton className="h-12 w-3/4 mx-auto mb-10" />
              <Skeleton className="h-32 w-full rounded-2xl" />
              <Skeleton className="h-32 w-full rounded-2xl" />
          </div>
      );
  }

  const steps = [
    {
      date: "Always Open",
      title: "Add Items Anytime",
      desc: "Our marketplace is always open. Browse and add wholesale essentials to your basket whenever you need.",
      icon: <ShoppingBag className="text-brand-600" />,
      color: "bg-brand-50 border-brand-200"
    },
    {
      date: "Flexible",
      title: "Pay Small-Small",
      desc: "Make partial payments via Mobile Money at your own pace. Your items are secured as you pay.",
      icon: <Wallet className="text-emerald-600" />,
      color: "bg-emerald-50 border-emerald-200"
    },
    {
      date: "Monthly",
      title: "Bulk Procurement",
      desc: "At the end of the cycle, SML aggregates all paid orders and purchases fresh stock directly from manufacturers.",
      icon: <Info className="text-blue-600" />,
      color: "bg-blue-50 border-blue-200"
    },
    {
      date: formatDate(settings.deliveryDate),
      title: "Delivery Day",
      desc: "Distribution centers open at Hall 7, Conti, and other designated points. Collect with your code.",
      icon: <Truck className="text-stone-700" />,
      color: "bg-stone-100 border-stone-200"
    }
  ];

  return (
    <div className="max-w-4xl mx-auto px-6 py-20 font-sans pt-24">
        <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-brand-600 font-bold uppercase tracking-widest text-xs mb-4 block">Transparency First</span>
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-stone-900 mb-6">{settings.cycleName}</h1>
            <p className="text-lg text-stone-500 font-light leading-relaxed">
                Our system runs continuously to guarantee you wholesale prices and convenient delivery.
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
                <h3 className="font-serif font-bold text-xl text-stone-900 mb-4">Service Fee ({settings.basketServiceFeePercentage}%)</h3>
                <p className="text-stone-500 mb-4 text-sm leading-relaxed">
                    A small fee added to your basket total covers transport, logistics, and handling.
                </p>
            </Card>
            <Card className="p-8">
                <h3 className="font-serif font-bold text-xl text-stone-900 mb-4">Top-Up Interest ({settings.topUpServiceFeePercentage}%)</h3>
                <p className="text-stone-500 mb-4 text-sm leading-relaxed">
                    Only applies if you use our credit facility. Helps keep the credit pool sustainable.
                </p>
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
