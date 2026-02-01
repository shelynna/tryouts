import React, { useState, useEffect } from 'react';
import { Card } from '../../ui';
import { Copy, Users, CheckCircle, Gift } from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';

export const ReferralCard: React.FC<{ code?: string }> = ({ code }) => {
    const [count, setCount] = useState(0);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const fetchCount = async () => {
            if (!code) return;
            const { count: referralCount } = await supabase
                .from('profiles')
                .select('id', { count: 'exact', head: true })
                .eq('referred_by', code);
            setCount(referralCount || 0);
        };
        fetchCount();
    }, [code]);

    const copyToClipboard = () => {
        if (!code) return;
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!code) return null;

    return (
        <Card className="bg-gradient-to-br from-indigo-900 to-blue-900 text-white border-none relative overflow-hidden h-full flex flex-col justify-between">
            {/* Background Effects */}
            <div className="absolute top-0 right-0 p-12 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 p-8 bg-blue-500/10 rounded-full blur-xl -ml-4 -mb-4 pointer-events-none"></div>
            
            <div className="relative z-10 mb-4">
                <div className="flex justify-between items-start mb-3">
                    <div className="p-2 bg-white/10 rounded-xl backdrop-blur-sm">
                        <Gift size={20} className="text-indigo-300" />
                    </div>
                    {count > 0 && (
                        <div className="text-xs font-bold bg-white/20 px-2 py-1 rounded-lg text-white flex items-center gap-1">
                            <Users size={12} /> {count} Referred
                        </div>
                    )}
                </div>
                
                <h3 className="font-heading font-bold text-lg text-white mb-1">Invite Friends</h3>
                <p className="text-indigo-200 text-xs leading-relaxed">
                    Share your code. Help others shop smarter.
                </p>
            </div>

            <div className="relative z-10">
                <p className="text-[10px] uppercase font-bold text-indigo-300 mb-1.5 tracking-widest">Your Code</p>
                <div 
                    onClick={copyToClipboard}
                    className="group bg-white/10 hover:bg-white/20 border border-white/10 hover:border-white/30 rounded-xl p-3 flex justify-between items-center cursor-pointer transition-all active:scale-95"
                >
                    <span className="font-mono font-bold tracking-widest text-lg text-white">{code}</span>
                    <div className={`p-1.5 rounded-lg transition-colors ${copied ? 'bg-emerald-500/20 text-emerald-300' : 'bg-black/20 text-white/70 group-hover:text-white'}`}>
                        {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
                    </div>
                </div>
                <p className="text-[10px] text-indigo-300/60 mt-2 text-center">
                    {copied ? "Copied to clipboard!" : "Tap to copy"}
                </p>
            </div>
        </Card>
    );
};