
import React, { useEffect, useState } from 'react';
import { API } from '../../lib/api';
import { Wifi, WifiOff } from 'lucide-react';
import { cn } from '../../lib/utils';

export const ServerStatus: React.FC = () => {
    // Default to ONLINE to avoid visual noise on load. Only show if confirmed OFFLINE.
    const [status, setStatus] = useState<'ONLINE' | 'OFFLINE'>('ONLINE');

    useEffect(() => {
        const check = async () => {
            const isOnline = await API.checkHealth();
            setStatus(isOnline ? 'ONLINE' : 'OFFLINE');
        };
        
        // Delay first check slightly to let app settle
        const timer = setTimeout(check, 2000);
        
        // Check periodically
        const interval = setInterval(check, 30000); 
        
        return () => {
            clearTimeout(timer);
            clearInterval(interval);
        };
    }, []);

    if (status === 'ONLINE') return null;

    return (
        <div className={cn(
            "fixed bottom-4 right-4 z-[10000] px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-xs font-bold transition-all",
            "bg-red-500 text-white animate-pulse"
        )}>
            <WifiOff size={14} />
            Server Unreachable
        </div>
    );
};
