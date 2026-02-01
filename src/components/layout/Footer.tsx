
import React, { useState } from 'react';
import { ASSETS } from '../../assets';
// @ts-ignore
import { Link } from 'react-router-dom';
import { Instagram, Twitter, Facebook } from 'lucide-react';

interface FooterProps {
  onNavigate?: (view: string) => void;
  onLegal?: (doc: string) => void;
  logoUrl?: string; // New prop
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onLegal, logoUrl }) => {
  const socialLinks = [
    { icon: Instagram, label: "Instagram" },
    { icon: Twitter, label: "X (Twitter)" },
    { icon: Facebook, label: "Facebook" }
  ];

  return (
    <footer className="bg-brand-900 text-stone-300 py-16 font-sans relative overflow-hidden w-full border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 border-b border-white/10 pb-16">
          <div className="md:col-span-4 space-y-8">
            <div className="flex items-center gap-3">
               <div className="p-1 rounded-xl">
                  <img src={logoUrl || ASSETS.LOGO_WHITE} alt="SML" className="h-16 w-auto object-contain" />
               </div>
            </div>
            <p className="text-base text-stone-400 leading-relaxed font-light">
              Bridging the gap between monthly needs and daily cashflow. Stock your pantry, pay small-small.
            </p>
            <div className="flex gap-4">
               {socialLinks.map(({ icon: Icon, label }, i) => (
                  <a 
                    key={i} 
                    href="#" 
                    aria-label={label}
                    className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-brand-500 hover:text-white hover:border-brand-500 transition-all duration-300"
                  >
                     <Icon size={20} />
                  </a>
               ))}
            </div>
          </div>

          <div className="md:col-span-4 md:col-start-6">
            <h4 className="font-serif font-medium text-white text-lg mb-6">Platform</h4>
            <ul className="space-y-4 text-sm font-medium">
              <li><Link to="/about" className="text-stone-400 hover:text-brand-500 transition-colors flex items-center gap-2 hover:translate-x-1 duration-200">How it works</Link></li>
              <li><Link to="/shop" className="text-stone-400 hover:text-brand-500 transition-colors hover:translate-x-1 duration-200">Marketplace</Link></li>
              <li><Link to="/partner" className="text-stone-400 hover:text-brand-500 transition-colors hover:translate-x-1 duration-200">Partner with us</Link></li>
            </ul>
          </div>

          <div className="md:col-span-2">
            <h4 className="font-serif font-medium text-white text-lg mb-6">Legal</h4>
            <ul className="space-y-4 text-sm font-medium">
              <li><button onClick={() => onLegal?.('Privacy Policy')} className="text-stone-400 hover:text-brand-500 transition-colors hover:translate-x-1 duration-200 text-left">Privacy Policy</button></li>
              <li><button onClick={() => onLegal?.('Terms of Service')} className="text-stone-400 hover:text-brand-500 transition-colors hover:translate-x-1 duration-200 text-left">Terms of Service</button></li>
              <li><button onClick={() => onLegal?.('Refund Policy')} className="text-stone-400 hover:text-brand-500 transition-colors hover:translate-x-1 duration-200 text-left">Refund Policy</button></li>
            </ul>
          </div>
        </div>
        
        <div className="pt-8 flex flex-col md:flex-row justify-between items-center text-xs font-medium text-stone-500 uppercase tracking-widest gap-4">
          <span>© {new Date().getFullYear()} Smart Monthly Living (SML). All rights reserved.</span>
          <div className="flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-brand-500 animate-pulse"></div>
             <span className="text-brand-500">System Online</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
    