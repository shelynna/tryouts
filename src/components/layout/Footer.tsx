
import React from 'react';
import { ASSETS } from '../../assets';

const InstagramIcon = ({ size = 20, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

const FacebookIcon = ({ size = 20, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
  </svg>
);

const XIcon = ({ size = 20, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M4 4l11.733 16h4.267l-11.733 -16z" />
    <path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772" />
  </svg>
);

interface FooterProps {
  onNavigate?: (view: string) => void;
  onLegal?: (doc: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onLegal }) => {
  const socialLinks = [
    { icon: InstagramIcon, label: "Instagram" },
    { icon: XIcon, label: "X (Twitter)" },
    { icon: FacebookIcon, label: "Facebook" }
  ];

  return (
    <footer className="bg-brand-900 text-stone-300 py-16 font-sans relative overflow-hidden w-full border-t border-white/5">
      {/* Texture Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.05] mix-blend-overlay pointer-events-none"
        style={{ backgroundImage: `url(${ASSETS.NOISE_OVERLAY})` }}
      ></div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 border-b border-white/10 pb-16">
          
          {/* Brand Column */}
          <div className="md:col-span-4 space-y-8">
            <div className="flex items-center gap-3">
               <div className="p-1 rounded-xl">
                  {/* Removed SML Text next to logo */}
                  <img src={ASSETS.LOGO_WHITE} alt="SML" className="h-16 w-auto object-contain" />
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
                     <Icon size={18} />
                  </a>
               ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-4 md:col-start-6">
            <h4 className="font-serif font-medium text-white text-lg mb-6">Platform</h4>
            <ul className="space-y-4 text-sm font-medium">
              <li><button onClick={() => onNavigate?.('ABOUT')} className="text-stone-400 hover:text-brand-500 transition-colors flex items-center gap-2 hover:translate-x-1 duration-200">How it works</button></li>
              <li><button onClick={() => onNavigate?.('SHOP')} className="text-stone-400 hover:text-brand-500 transition-colors hover:translate-x-1 duration-200">Marketplace</button></li>
              <li><button onClick={() => onNavigate?.('ABOUT')} className="text-stone-400 hover:text-brand-500 transition-colors hover:translate-x-1 duration-200">Pricing Cycle</button></li>
              <li><button onClick={() => onNavigate?.('HELP')} className="text-stone-400 hover:text-brand-500 transition-colors hover:translate-x-1 duration-200">Partner with us</button></li>
            </ul>
          </div>

          {/* Support Links */}
          <div className="md:col-span-2">
            <h4 className="font-serif font-medium text-white text-lg mb-6">Legal</h4>
            <ul className="space-y-4 text-sm font-medium">
              <li><button onClick={() => onLegal?.('Privacy Policy')} className="text-stone-400 hover:text-brand-500 transition-colors hover:translate-x-1 duration-200">Privacy Policy</button></li>
              <li><button onClick={() => onLegal?.('Terms of Service')} className="text-stone-400 hover:text-brand-500 transition-colors hover:translate-x-1 duration-200">Terms of Service</button></li>
              <li><button onClick={() => onLegal?.('Refund Policy')} className="text-stone-400 hover:text-brand-500 transition-colors hover:translate-x-1 duration-200">Refund Policy</button></li>
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
