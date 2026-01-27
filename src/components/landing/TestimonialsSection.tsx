
import React from 'react';
import { motion } from 'framer-motion';

const MotionDiv = motion.div as any;

export const TestimonialsSection = () => {
    const testimonials = [
      { name: "Kofi", school: "KNUST, 3rd Year", quote: "This is a life saver. SML helped me stock rice immediately school reopened without needing all the cash upfront." },
      { name: "Sarah", school: "UCC, 2nd Year", quote: "The payment plan is amazing. I pay GHS 20 whenever I sell a wig or get cash. It's so flexible." },
      { name: "Emmanuel", school: "LEGON, Final Year", quote: "Cheaper than the hall market and I don't have to carry heavy bags from Madina. The convenience is unmatched." }
    ];

    return (
        <section className="py-24 bg-white overflow-hidden">
            <div className="container-padding text-center">
                <h2 className="text-3xl md:text-4xl font-heading font-bold mb-16 text-stone-900">Why Students Love SML</h2>
                <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {testimonials.map((t, i) => (
                        <MotionDiv
                            key={i}
                            className="bg-stone-50 p-8 rounded-3xl transition-all duration-300 hover:shadow-xl hover:-translate-y-2"
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, amount: 0.5 }}
                            transition={{ duration: 0.5, delay: i * 0.1 }}
                        >
                            <p className="text-stone-600 font-medium mb-6 leading-relaxed italic text-lg">"{t.quote}"</p>
                            <div>
                                <p className="font-bold text-stone-900">{t.name}</p>
                                <p className="text-xs text-stone-500 uppercase tracking-wider">{t.school}</p>
                            </div>
                        </MotionDiv>
                    ))}
                </div>
            </div>
        </section>
    );
};
