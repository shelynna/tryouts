
import React from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, Wallet, Truck } from 'lucide-react';
import { ASSETS } from '../../assets';

const MotionDiv = motion.div as any;

export const HowItWorksSection = () => {
    const steps = [
        {
            icon: <ShoppingBag />,
            title: "Build Your Basket",
            description: "Shop from a curated list of student essentials at unbeatable wholesale prices. Add everything you need for the month to your basket.",
            visual: (
                <div className="bg-stone-100 h-full w-full rounded-2xl flex items-center justify-center overflow-hidden border border-stone-200">
                    <img src={ASSETS.LANDING_UI_MARKETPLACE} alt="Marketplace UI" className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-700" />
                </div>
            )
        },
        {
            icon: <Wallet />,
            title: "Pay Small-Small",
            description: "Contribute to your basket total anytime, anywhere via Mobile Money. No need for bulk cash—pay in installments that fit your cashflow.",
            visual: (
                <div className="bg-stone-100 h-full w-full rounded-2xl flex items-center justify-center overflow-hidden border border-stone-200">
                    <img src={ASSETS.LANDING_UI_PAYMENT} alt="Payment UI" className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-700" />
                </div>
            )
        },
        {
            icon: <Truck />,
            title: "Collect On Campus",
            description: "Once your basket is fully paid before the cycle ends, you'll receive a unique pickup code. Collect your items from your designated hall point on delivery day.",
            visual: (
                <div className="bg-stone-100 h-full w-full rounded-2xl flex items-center justify-center overflow-hidden border border-stone-200">
                    <img src={ASSETS.LANDING_UI_DELIVERY} alt="Delivery UI" className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-700" />
                </div>
            )
        }
    ];

    return (
        <section className="py-32 bg-stone-50">
            <div className="container-padding space-y-24">
                <div className="text-center max-w-2xl mx-auto">
                    <h2 className="text-4xl md:text-5xl font-heading font-bold mb-4 text-stone-900">A Smarter Way to Shop</h2>
                    <p className="text-stone-600 text-lg">The entire process is designed for student life. Simple, flexible, and reliable.</p>
                </div>
                {steps.map((step, index) => (
                    <MotionDiv
                        key={index}
                        className="grid md:grid-cols-2 gap-12 items-center"
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.3 }}
                        transition={{ duration: 0.8 }}
                    >
                        <div className={`space-y-6 ${index % 2 === 1 ? 'md:order-2' : ''}`}>
                            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-brand-600 shadow-sm">
                                {React.cloneElement(step.icon, { size: 32 })}
                            </div>
                            <h3 className="text-3xl font-heading font-bold text-stone-900">{step.title}</h3>
                            <p className="text-stone-600 text-lg leading-relaxed">{step.description}</p>
                        </div>
                        <div className="aspect-square bg-white rounded-3xl shadow-soft p-4">
                            {step.visual}
                        </div>
                    </MotionDiv>
                ))}
            </div>
        </section>
    );
};
