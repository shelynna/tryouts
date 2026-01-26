import React, { useEffect, useState } from 'react';
import { API } from '../../lib/api';
import { Wifi, WifiOff } from 'lucide-react';
import { cn } from './utils';

export const ServerStatus: React.FC = () => {
    const [status, setStatus] = useState<'ONLINE' | 'OFFLINE' | 'CHECKING'>('CHECKING');

    useEffect(() => {
        const check = async () => {
            const isOnline = await API.checkHealth();
            setStatus(isOnline ? 'ONLINE' : 'OFFLINE');
        };
        
        check();
        // Check periodically
        const interval = setInterval(check, 30000); 
        return () => clearInterval(interval);
    }, []);

    if (status === 'ONLINE') return null; // Don't show anything if healthy

    return (
        <div className={cn(
            "fixed bottom-4 right-4 z-[9999] px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-xs font-bold transition-all",
            status === 'OFFLINE' ? "bg-red-500 text-white animate-pulse" : "bg-stone-200 text-stone-500"
        )}>
            {status === 'OFFLINE' ? <WifiOff size={14} /> : <Wifi size={14} />}
            {status === 'OFFLINE' ? "Server Unreachable" : "Connecting..."}
        </div>
    );
};