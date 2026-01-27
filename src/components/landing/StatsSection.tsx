
import React from 'react';
import { motion } from 'framer-motion';

const MotionDiv = motion.div as any;

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1 },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

export const StatsSection = () => (
    <section className="py-24 bg-white text-stone-900">
        <MotionDiv 
            className="container-padding grid grid-cols-1 md:grid-cols-3 gap-12 text-center"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.5 }}
        >
            <MotionDiv variants={itemVariants}>
                <h3 className="text-5xl md:text-6xl font-heading font-bold text-brand-600">30%</h3>
                <p className="mt-2 text-stone-500 font-medium">Cheaper than average campus market prices.</p>
            </MotionDiv>
            <MotionDiv variants={itemVariants}>
                <h3 className="text-5xl md:text-6xl font-heading font-bold text-brand-600">1,500+</h3>
                <p className="mt-2 text-stone-500 font-medium">Students are shopping smarter and saving money.</p>
            </MotionDiv>
            <MotionDiv variants={itemVariants}>
                <h3 className="text-5xl md:text-6xl font-heading font-bold text-brand-600">GHS 5</h3>
                <p className="mt-2 text-stone-500 font-medium">Is all you need to start paying for your monthly basket.</p>
            </MotionDiv>
        </MotionDiv>
    </section>
);
