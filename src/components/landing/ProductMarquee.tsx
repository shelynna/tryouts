
import React from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { API } from '../../lib/api';
import { ASSETS } from '../../assets';

const MotionDiv = motion.div as any;

export const ProductMarquee = () => {
    // Fetch active products from the DB to replace mockups
    const { data: products = [] } = useQuery({
        queryKey: ['landing-products'],
        queryFn: () => API.getProducts({ isAdmin: false }),
        staleTime: 1000 * 60 * 30, // Cache for 30 minutes
        retry: false
    });

    // If no products have been created yet, hide the marquee completely
    // ensuring we don't show any placeholder/mockup data.
    if (!products || products.length === 0) {
        return null;
    }

    // Duplicate items to ensure seamless infinite scrolling loop
    // If fetch returns few items, duplicate more times to fill the screen width
    const marqueeItems = products.length < 5 
        ? [...products, ...products, ...products, ...products] 
        : [...products, ...products];

    return (
        <div className="relative w-full overflow-hidden bg-stone-50 py-12 border-y border-stone-100/50">
            <MotionDiv 
                className="flex whitespace-nowrap"
                animate={{ x: ['0%', '-50%'] }}
                transition={{ ease: 'linear', duration: 40, repeat: Infinity }}
            >
                {marqueeItems.map((p: any, i: number) => (
                    <div key={`${p.id}-${i}`} className="flex-shrink-0 w-64 mx-4 flex flex-col items-center group">
                        <div className="w-full h-64 bg-white rounded-3xl overflow-hidden flex items-center justify-center p-6 shadow-sm border border-stone-100 group-hover:border-brand-200 transition-colors">
                            <img 
                                src={p.image || ASSETS.PRODUCT_PLACEHOLDER} 
                                alt={p.name} 
                                className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" 
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = ASSETS.PRODUCT_PLACEHOLDER;
                                }}
                            />
                        </div>
                        <p className="mt-4 font-heading font-bold text-stone-800 text-lg tracking-tight">{p.name}</p>
                        {p.size && (
                            <p className="text-xs text-stone-400 uppercase tracking-widest font-bold bg-white px-2 py-1 rounded-md border border-stone-100 mt-1">
                                {p.size}
                            </p>
                        )}
                    </div>
                ))}
            </MotionDiv>
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-stone-50 via-transparent to-stone-50"></div>
        </div>
    );
};
