
import React from 'react';
import { motion } from 'framer-motion';
import { ASSETS } from '../../assets';

const MotionDiv = motion.div as any;

export const ProductMarquee = () => {
    const products = [
      { name: 'Perfumed Rice', image: ASSETS.PRODUCT_PLACEHOLDER },
      { name: 'Vegetable Oil', image: ASSETS.PRODUCT_PLACEHOLDER },
      { name: 'Sardines (Club)', image: ASSETS.PRODUCT_PLACEHOLDER },
      { name: 'Indomie Noodles', image: ASSETS.PRODUCT_PLACEHOLDER },
      { name: 'Tomato Paste', image: ASSETS.PRODUCT_PLACEHOLDER },
      { name: 'Nido Milk Powder', image: ASSETS.PRODUCT_PLACEHOLDER },
      { name: 'Sunlight Soap', image: ASSETS.PRODUCT_PLACEHOLDER },
    ];
    const marqueeItems = [...products, ...products]; // Duplicate for seamless loop

    return (
        <div className="relative w-full overflow-hidden bg-stone-50 py-12">
            <MotionDiv 
                className="flex whitespace-nowrap"
                animate={{ x: ['0%', '-50%'] }}
                transition={{ ease: 'linear', duration: 40, repeat: Infinity }}
            >
                {marqueeItems.map((p, i) => (
                    <div key={i} className="flex-shrink-0 w-64 mx-4 flex flex-col items-center">
                        <div className="w-full h-64 bg-white rounded-2xl overflow-hidden flex items-center justify-center p-4 shadow-sm">
                            <img src={p.image} alt={p.name} className="w-full h-full object-contain" />
                        </div>
                        <p className="mt-4 font-bold text-stone-800">{p.name}</p>
                    </div>
                ))}
            </MotionDiv>
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-stone-50 via-transparent to-stone-50"></div>
        </div>
    );
};
