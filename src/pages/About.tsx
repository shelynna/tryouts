import React from 'react';
import { Button } from '../components/ui';
import { ArrowLeft, ShieldCheck, Package, Truck, Users, CheckCircle, ArrowRight, Wallet, ShoppingCart } from 'lucide-react';
import { motion } from 'framer-motion';

const MotionDiv = motion.div as any;

interface AboutPageProps {
    onBack: () => void;
    onRegister?: () => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onBack, onRegister }) => (
  <div className="font-sans selection:bg-brand-100 bg-[#FDFDFD] min-h-screen pb-20">
    
    {/* Hero Section: What is SML? */}
    <section className="relative pt-24 pb-16 px-6 max-w-5xl mx-auto text-center">
        <MotionDiv 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
        >
            <span className="text-brand-600 font-bold uppercase tracking-widest text-xs mb-4 block">What is SML?</span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-stone-900 mb-6 tracking-tight leading-tight">
                Secure all your essential foodstuffs for the month at wholesale prices.
            </h1>
            <p className="text-lg md:text-xl text-stone-500 font-light leading-relaxed max-w-3xl mx-auto">
                Smart Monthly Living (SML) helps students and households secure all their essential foodstuffs for the month at wholesale prices, pay in flexible installments (“small-small”), and enjoy free delivery.
            </p>
        </MotionDiv>
    </section>

    {/* How It Works – Step by Step */}
    <section className="py-20 bg-stone-50 border-y border-stone-100">
        <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
                <h2 className="text-3xl font-serif font-bold text-brand-900">How It Works – Step by Step</h2>
            </div>

            <div className="grid md:grid-cols-5 gap-8 relative">
                {/* Connecting Line (Desktop) */}
                <div className="hidden md:block absolute top-12 left-[10%] right-[10%] h-0.5 bg-stone-200 z-0"></div>

                {[
                    { 
                        step: "1", 
                        title: "Choose Your SML Package", 
                        desc: "Select a package that fits your lifestyle and budget. Each package includes monthly food essentials, wholesale pricing, free or subsidized delivery, and access to member-only benefits.", 
                        icon: <Package size={24} /> 
                    },
                    { 
                        step: "2", 
                        title: "Pay Small-Small (Flexible Payments)", 
                        desc: "You can pay weekly, bi-weekly, or monthly as long as payment is completed before delivery day.", 
                        icon: <Wallet size={24} /> 
                    },
                    { 
                        step: "3", 
                        title: "We Buy in Bulk (You Save Money)", 
                        desc: "SML buys directly from producers and distributors in bulk, allowing us to offer lower prices while maintaining quality.", 
                        icon: <ShoppingCart size={24} /> 
                    },
                    { 
                        step: "4", 
                        title: "We Deliver to You", 
                        desc: "Once payments are completed, your food items are packed and delivered to your hostel or pickup point.", 
                        icon: <Truck size={24} /> 
                    },
                    { 
                        step: "5", 
                        title: "Enjoy Member-Only Benefits", 
                        desc: "Active members get access to discount deal drops, emergency food support, reward challenges, referral bonuses, and special campus offers.", 
                        icon: <Users size={24} /> 
                    }
                ].map((item, i) => (
                    <div key={i} className="relative z-10 flex flex-col items-center text-center group">
                        <div className="w-24 h-24 bg-white border-4 border-stone-100 rounded-full flex flex-col items-center justify-center mb-6 shadow-sm group-hover:border-brand-500 group-hover:scale-110 transition-all duration-300">
                            <div className="text-brand-600 mb-1">{item.icon}</div>
                            <span className="text-xs font-bold text-stone-300 group-hover:text-brand-300">0{item.step}</span>
                        </div>
                        <h3 className="font-bold text-stone-900 text-lg mb-2 leading-tight">{item.title}</h3>
                        <p className="text-sm text-stone-500 leading-relaxed px-2">{item.desc}</p>
                    </div>
                ))}
            </div>
        </div>
    </section>

    {/* Why Choose SML & Safety */}
    <section className="py-24 px-6 max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-stretch">
            
            {/* Why Choose */}
            <div className="flex flex-col justify-center">
                <h2 className="text-3xl font-serif font-bold text-stone-900 mb-8">Why Students Choose SML</h2>
                <div className="space-y-4">
                    {[
                        "Saves money",
                        "Reduces food stress",
                        "Helps with budgeting",
                        "Prevents mid-month hunger"
                    ].map((point, i) => (
                        <div key={i} className="flex items-center gap-4 p-5 bg-white border border-stone-100 rounded-2xl shadow-sm hover:border-brand-200 hover:shadow-md transition-all">
                            <div className="w-8 h-8 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
                                <CheckCircle size={16} />
                            </div>
                            <span className="font-medium text-stone-700 text-lg">{point}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Safety & Legitimacy */}
            <div className="bg-brand-900 text-white p-10 md:p-12 rounded-[2rem] relative overflow-hidden shadow-2xl flex flex-col justify-between">
                <div className="absolute top-0 right-0 p-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 p-24 bg-accent-500/20 rounded-full blur-3xl -ml-12 -mb-12 pointer-events-none"></div>
                
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-2 bg-white/10 rounded-lg backdrop-blur-md">
                            <ShieldCheck size={28} className="text-accent-500" />
                        </div>
                        <h3 className="text-2xl font-serif font-bold">Is SML Safe & Legit?</h3>
                    </div>
                    
                    <div className="space-y-8">
                        <div>
                            <p className="text-4xl sm:text-5xl font-bold text-white mb-4 tracking-tight">Yes.</p>
                            <p className="text-brand-100 text-xl leading-relaxed font-light border-l-2 border-accent-500 pl-4">
                                You pay for food and receive food. <br/>
                                <strong className="text-white font-medium">Simple and transparent.</strong>
                            </p>
                        </div>
                        
                        <div className="pt-8 border-t border-white/10">
                            <p className="text-xs text-brand-300 uppercase tracking-widest font-bold mb-4">Who Can Join?</p>
                            <ul className="space-y-3 text-brand-50">
                                <li className="flex gap-3 items-start"><div className="w-1.5 h-1.5 bg-accent-500 rounded-full mt-2 shrink-0"></div> <span className="flex-1">Students managing tight budgets.</span></li>
                                <li className="flex gap-3 items-start"><div className="w-1.5 h-1.5 bg-accent-500 rounded-full mt-2 shrink-0"></div> <span className="flex-1">Workers tired of salary to salary stress.</span></li>
                                <li className="flex gap-3 items-start"><div className="w-1.5 h-1.5 bg-accent-500 rounded-full mt-2 shrink-0"></div> <span className="flex-1">Families who want structure.</span></li>
                                <li className="flex gap-3 items-start"><div className="w-1.5 h-1.5 bg-accent-500 rounded-full mt-2 shrink-0"></div> <span className="flex-1">Anyone who wants affordable, predictable monthly shopping.</span></li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    </section>

    {/* CTA */}
    <div className="text-center pb-16 pt-8 px-6">
        <h2 className="text-2xl md:text-3xl font-serif font-bold text-stone-900 mb-8">Ready for affordable, predictable monthly shopping?</h2>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
            {onRegister && (
                <Button onClick={onRegister} size="lg" className="shadow-xl shadow-brand-900/20 px-8">
                    Join SML Now <ArrowRight size={18} className="ml-2" />
                </Button>
            )}
            <Button variant="outline" onClick={onBack} size="lg" className="gap-2 border-stone-300 hover:border-stone-900 text-stone-600 hover:text-stone-900">
                <ArrowLeft size={18} /> Back to Home
            </Button>
        </div>
    </div>
  </div>
);