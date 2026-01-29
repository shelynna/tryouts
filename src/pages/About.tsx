
import React from 'react';
import { Button } from '../components/ui';
import { ArrowLeft, ArrowRight, UserPlus, ShoppingCart, CreditCard, Truck, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { ASSETS } from '../assets';

const MotionDiv = motion.div as any;

interface AboutPageProps {
    onBack: () => void;
    onRegister?: () => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onBack, onRegister }) => {
    const steps = [
        {
            id: '01',
            title: "Join & Verify",
            desc: "Create your free account. We verify every student to ensure a secure community. No hidden fees, just simple access.",
            icon: <UserPlus className="w-6 h-6 text-white" />,
            color: "bg-blue-600",
            lightColor: "bg-blue-50"
        },
        {
            id: '02',
            title: "Build Your Basket",
            desc: "Browse our wholesale marketplace. Add essential items like Rice, Oil, and Provisions. Your price is locked the moment you add to cart.",
            icon: <ShoppingCart className="w-6 h-6 text-white" />,
            color: "bg-brand-600",
            lightColor: "bg-brand-50"
        },
        {
            id: '03',
            title: "Pay Small-Small",
            desc: "Don't have the full amount? No problem. Make partial payments via Mobile Money whenever you have cash. GHS 10 today, GHS 20 tomorrow.",
            icon: <CreditCard className="w-6 h-6 text-white" />,
            color: "bg-purple-600",
            lightColor: "bg-purple-50"
        },
        {
            id: '04',
            title: "Delivery Day",
            desc: "On the 28th of every month, we set up distribution points at your hall (Hall 7, Conti, etc.). Show your code, collect your goods.",
            icon: <Truck className="w-6 h-6 text-white" />,
            color: "bg-stone-800",
            lightColor: "bg-stone-100"
        }
    ];

    return (
        <div className="font-sans bg-white min-h-screen selection:bg-brand-100 pb-20">
            
            {/* HERO */}
            <div className="relative pt-32 pb-20 md:pt-40 md:pb-32 px-6 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120%] h-[500px] bg-brand-50/50 rounded-[100%] blur-3xl -z-10 -mt-20"></div>
                
                <div className="max-w-4xl mx-auto text-center">
                    <MotionDiv 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <span className="inline-block py-1 px-3 rounded-full bg-brand-100 text-brand-800 text-[10px] font-bold uppercase tracking-widest mb-6">
                            The SML Concept
                        </span>
                        <h1 className="text-4xl sm:text-5xl md:text-7xl font-heading font-extrabold text-stone-900 mb-8 leading-tight tracking-tight">
                            Smart Monthly <br className="hidden md:block"/> <span className="text-brand-600">Sustenance.</span>
                        </h1>
                        <p className="text-lg md:text-xl text-stone-500 leading-relaxed max-w-2xl mx-auto mb-10">
                            We bridge the gap between your monthly allowance and daily hunger. 
                            Secure wholesale food prices now, pay gradually, and collect on campus.
                        </p>
                        
                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                            {onRegister && (
                                <Button onClick={onRegister} size="xl" className="rounded-full px-8 shadow-xl shadow-brand-900/20">
                                    Get Started
                                </Button>
                            )}
                            <Button variant="outline" size="xl" onClick={onBack} className="rounded-full px-8 bg-white border-stone-200">
                                Back Home
                            </Button>
                        </div>
                    </MotionDiv>
                </div>
            </div>

            {/* PROCESS - ZIG ZAG */}
            <div className="max-w-5xl mx-auto px-6 py-12 space-y-24">
                {steps.map((step, i) => (
                    <MotionDiv 
                        key={i}
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.6 }}
                        className={`flex flex-col md:flex-row gap-8 md:gap-16 items-center ${i % 2 === 1 ? 'md:flex-row-reverse' : ''}`}
                    >
                        {/* Visual Side */}
                        <div className="flex-1 w-full">
                            <div className={`relative aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl ${step.lightColor} flex items-center justify-center p-8 group`}>
                                <div className={`w-20 h-20 rounded-2xl ${step.color} flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-500`}>
                                    {React.cloneElement(step.icon as React.ReactElement<any>, { className: "w-10 h-10 text-white" })}
                                </div>
                                <div className="absolute bottom-6 right-6 font-black text-9xl text-stone-900/5 select-none">
                                    {step.id}
                                </div>
                            </div>
                        </div>

                        {/* Text Side */}
                        <div className="flex-1 space-y-4 text-center md:text-left">
                            <div className={`inline-flex w-10 h-10 rounded-full items-center justify-center font-bold text-white ${step.color} mb-2 shadow-md`}>
                                {step.id}
                            </div>
                            <h3 className="text-3xl font-heading font-bold text-stone-900">{step.title}</h3>
                            <p className="text-lg text-stone-500 leading-relaxed font-medium">
                                {step.desc}
                            </p>
                        </div>
                    </MotionDiv>
                ))}
            </div>

            {/* BENEFITS GRID */}
            <div className="py-24 bg-stone-50 mt-20 border-t border-stone-100">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-serif font-bold text-stone-900 mb-4">Why 1,500+ Students Choose SML</h2>
                        <p className="text-stone-500">More than just a shop. It's a survival strategy.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {[
                            { title: "Wholesale Prices", desc: "Cheaper than the 'bush canteen' or night market. We buy direct from factories." },
                            { title: "No Food Stress", desc: "Focus on your lectures knowing your end-of-month sustenance is secured." },
                            { title: "Credit Facility", desc: "Loyal subscribers unlock Top-Ups to complete their baskets when cash is tight." },
                            { title: "Campus Delivery", desc: "No carrying heavy rice bags from town. We bring it to your hall." },
                            { title: "Flexible Payment", desc: "Pay GHS 5 or GHS 500. The system accepts any amount via Momo." },
                            { title: "Money Back", desc: "If you don't complete payment, your funds roll over. You never lose money." }
                        ].map((b, i) => (
                            <div key={i} className="bg-white p-8 rounded-2xl border border-stone-100 shadow-sm hover:shadow-md transition-shadow">
                                <CheckCircle2 className="text-brand-500 mb-4 h-8 w-8" />
                                <h4 className="font-bold text-stone-900 text-lg mb-2">{b.title}</h4>
                                <p className="text-stone-500 text-sm leading-relaxed">{b.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* FOOTER CTA */}
            <div className="max-w-3xl mx-auto px-6 pt-24 text-center">
                <h2 className="text-3xl font-heading font-bold text-stone-900 mb-6">Ready to secure your month?</h2>
                <div className="flex justify-center gap-4">
                    {onRegister && (
                        <Button onClick={onRegister} size="lg" className="px-10 h-14 text-lg bg-stone-900 text-white hover:bg-stone-800 rounded-2xl shadow-xl">
                            Join Now <ArrowRight className="ml-2 w-5 h-5"/>
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};
