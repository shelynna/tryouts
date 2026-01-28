
import React, { useEffect, useState } from 'react';
import { API } from '../../lib/api';
import { WifiOff, Database, RefreshCw } from 'lucide-react';
import { cn } from '../../lib/utils';

export const ServerStatus: React.FC = () => {
    const [status, setStatus] = useState<'ONLINE' | 'OFFLINE' | 'DB_ERROR'>('ONLINE');
    const [message, setMessage] = useState('');
    const [isChecking, setIsChecking] = useState(false);

    const check = async () => {
        setIsChecking(true);
        const result = await API.checkHealth();
        
        // Suppress offline status if the error is an AbortError (common in prod during auth handshakes)
        if (result.status === 'OFFLINE' && (result.message?.includes('aborted') || result.message?.includes('AbortError'))) {
             // Do not change status, assume transient
             console.warn("Transient health check abort ignored");
        } else {
             setStatus(result.status);
             setMessage(result.message || '');
        }
        
        setIsChecking(false);
    };

    useEffect(() => {
        // Delay first check slightly to let app settle
        const timer = setTimeout(check, 2000);
        
        // Check periodically (every 60s)
        const interval = setInterval(check, 60000); 
        
        return () => {
            clearTimeout(timer);
            clearInterval(interval);
        };
    }, []);

    if (status === 'ONLINE') return null;

    return (
        <div className={cn(
            "fixed bottom-4 right-4 z-[10000] px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 text-xs font-bold transition-all border backdrop-blur-md",
            status === 'DB_ERROR' 
                ? "bg-orange-50/90 text-orange-700 border-orange-200" 
                : "bg-red-50/90 text-red-700 border-red-200"
        )}>
            {status === 'DB_ERROR' ? (
                <Database size={16} className="shrink-0" />
            ) : (
                <WifiOff size={16} className="shrink-0" />
            )}
            
            <div className="flex flex-col">
                <span className="uppercase tracking-wider text-[10px] opacity-70">System Status</span>
                <span>{status === 'DB_ERROR' ? "Database Setup Required" : "Server Unreachable"}</span>
                {message && <span className="text-[10px] font-normal opacity-80 max-w-[150px] truncate">{message}</span>}
            </div>

            <button 
                onClick={check} 
                disabled={isChecking}
                className="ml-2 p-2 rounded-full hover:bg-black/5 transition-colors disabled:opacity-50"
            >
                <RefreshCw size={14} className={isChecking ? "animate-spin" : ""} />
            </button>
        </div>
    );
};
