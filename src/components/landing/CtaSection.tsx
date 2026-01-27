
import React from 'react';
import { Button } from '../../components/ui';
import { ArrowRight } from 'lucide-react';

interface CtaSectionProps {
    onProceed: () => void;
    onHelp: () => void;
}

export const CtaSection: React.FC<CtaSectionProps> = ({ onProceed, onHelp }) => (
    <section className="py-24 bg-brand-50 text-stone-900 text-center relative overflow-hidden">
        <div className="container-padding relative z-10">
            <h2 className="text-4xl md:text-5xl font-heading mb-6 tracking-tight font-bold">
                Eat Smart. Live Well.
            </h2>
            <p className="text-stone-600 max-w-xl mx-auto mb-10 text-lg font-light">
                Join thousands of students securing their monthly sustenance with us.
            </p>
            <Button
                size="xl"
                onClick={onProceed}
                className="rounded-full px-10 h-14 text-base font-bold bg-brand-900 text-white hover:bg-brand-800"
            >
                Get Started Now <ArrowRight size={18} className="ml-2"/>
            </Button>
        </div>
    </section>
);
