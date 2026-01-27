import React from 'react';
import { Button, Card } from '../components/ui';
import { ArrowLeft, Briefcase, Users, Truck, Store, ArrowRight, Mail } from 'lucide-react';

export const PartnerPage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  return (
    <div className="max-w-6xl mx-auto px-6 py-20 font-sans pt-24">
        <div className="text-center max-w-3xl mx-auto mb-20">
            <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-brand-600">
                <Briefcase size={32} />
            </div>
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-stone-900 mb-6">Grow with SML</h1>
            <p className="text-lg text-stone-500 font-light leading-relaxed">
                We are building the largest student food network in Ghana. Whether you are a supplier, a logistics pro, or a student leader, there is a place for you.
            </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-20">
            {/* Suppliers */}
            <Card className="p-8 hover:-translate-y-2 transition-transform duration-300 group">
                <div className="w-12 h-12 bg-stone-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-stone-900 group-hover:text-white transition-colors">
                    <Store size={24} />
                </div>
                <h3 className="font-bold text-xl text-stone-900 mb-3">For Suppliers</h3>
                <p className="text-stone-500 text-sm leading-relaxed mb-6">
                    Directly access thousands of student customers without marketing costs. We buy in bulk, upfront.
                </p>
                <ul className="space-y-3 mb-8">
                    <li className="flex gap-2 text-sm font-medium text-stone-700"><div className="w-1.5 h-1.5 bg-brand-500 rounded-full mt-1.5"></div> Guaranteed bulk orders</li>
                    <li className="flex gap-2 text-sm font-medium text-stone-700"><div className="w-1.5 h-1.5 bg-brand-500 rounded-full mt-1.5"></div> Immediate payment</li>
                    <li className="flex gap-2 text-sm font-medium text-stone-700"><div className="w-1.5 h-1.5 bg-brand-500 rounded-full mt-1.5"></div> Brand visibility on campus</li>
                </ul>
            </Card>

            {/* Logistics */}
            <Card className="p-8 hover:-translate-y-2 transition-transform duration-300 group">
                <div className="w-12 h-12 bg-stone-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-stone-900 group-hover:text-white transition-colors">
                    <Truck size={24} />
                </div>
                <h3 className="font-bold text-xl text-stone-900 mb-3">For Logistics</h3>
                <p className="text-stone-500 text-sm leading-relaxed mb-6">
                    Partner with us for our monthly "Delivery Day". High volume distribution in a single day.
                </p>
                <ul className="space-y-3 mb-8">
                    <li className="flex gap-2 text-sm font-medium text-stone-700"><div className="w-1.5 h-1.5 bg-brand-500 rounded-full mt-1.5"></div> Predictable schedule (28th)</li>
                    <li className="flex gap-2 text-sm font-medium text-stone-700"><div className="w-1.5 h-1.5 bg-brand-500 rounded-full mt-1.5"></div> High volume contracts</li>
                    <li className="flex gap-2 text-sm font-medium text-stone-700"><div className="w-1.5 h-1.5 bg-brand-500 rounded-full mt-1.5"></div> Optimized routes</li>
                </ul>
            </Card>

            {/* Ambassadors */}
            <Card className="p-8 hover:-translate-y-2 transition-transform duration-300 group bg-brand-900 text-white border-brand-900">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-6 backdrop-blur-sm">
                    <Users size={24} className="text-brand-300" />
                </div>
                <h3 className="font-bold text-xl text-white mb-3">Campus Reps</h3>
                <p className="text-brand-200 text-sm leading-relaxed mb-6">
                    Be the face of SML in your hall. Earn commissions on every student you refer.
                </p>
                <ul className="space-y-3 mb-8">
                    <li className="flex gap-2 text-sm font-medium text-brand-100"><div className="w-1.5 h-1.5 bg-brand-400 rounded-full mt-1.5"></div> Earn cash per referral</li>
                    <li className="flex gap-2 text-sm font-medium text-brand-100"><div className="w-1.5 h-1.5 bg-brand-400 rounded-full mt-1.5"></div> Free SML merchandise</li>
                    <li className="flex gap-2 text-sm font-medium text-brand-100"><div className="w-1.5 h-1.5 bg-brand-400 rounded-full mt-1.5"></div> Exclusive networking</li>
                </ul>
            </Card>
        </div>

        <div className="bg-stone-100 rounded-3xl p-10 md:p-16 text-center">
            <h2 className="text-2xl font-serif font-bold text-stone-900 mb-4">Let's Connect</h2>
            <p className="text-stone-600 mb-8 max-w-md mx-auto">
                Ready to work together? Send us an email with your proposal or portfolio.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button onClick={() => window.open('mailto:partners@smlghana.store')} size="lg" className="px-8 shadow-xl shadow-stone-900/10">
                    <Mail className="mr-2" size={18} /> Email Us
                </Button>
                <Button variant="outline" onClick={onBack} size="lg" className="px-8 bg-white">
                    Back to Home
                </Button>
            </div>
        </div>
    </div>
  );
};