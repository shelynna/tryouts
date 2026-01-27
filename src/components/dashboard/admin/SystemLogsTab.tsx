
import React, { useEffect, useState, useRef } from 'react';
import { Card, Button, Badge } from '../../ui';
import { supabase } from '../../../lib/supabaseClient';
import { RefreshCw, AlertTriangle, Info, AlertCircle, Trash, CheckCircle, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MotionTr = motion.tr as any;

export const SystemLogsTab: React.FC = () => {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [isLive, setIsLive] = useState(false);

    const fetchLogs = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('system_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);
        
        if (data) setLogs(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchLogs();

        // Realtime Subscription
        const channel = supabase.channel('realtime_logs')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'system_logs' },
                (payload: any) => {
                    const newLog = payload.new;
                    setLogs((prev) => [newLog, ...prev].slice(0, 50)); // Keep list manageable
                }
            )
            .subscribe((status: string) => {
                if (status === 'SUBSCRIBED') setIsLive(true);
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const getIcon = (level: string) => {
        switch(level) {
            case 'ERROR': return <AlertCircle size={16} className="text-red-500" />;
            case 'WARN': return <AlertTriangle size={16} className="text-orange-500" />;
            case 'TRANSACTION': return <CheckCircle size={16} className="text-emerald-500" />;
            default: return <Info size={16} className="text-blue-500" />;
        }
    };

    return (
        <Card noPadding className="h-[600px] flex flex-col font-sans">
            <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50/50 sticky top-0 z-20 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                    <div>
                        <h3 className="font-heading font-bold text-xl text-brand-900">System Logs</h3>
                        <p className="text-sm text-stone-500">Real-time application events and error tracking.</p>
                    </div>
                    {isLive && (
                        <div className="hidden md:flex items-center gap-2 px-2 py-1 bg-red-50 text-red-600 rounded-full border border-red-100 animate-pulse">
                            <div className="w-2 h-2 rounded-full bg-red-500"></div>
                            <span className="text-[10px] font-bold uppercase tracking-widest">Live</span>
                        </div>
                    )}
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={fetchLogs} loading={loading} className="gap-2">
                        <RefreshCw size={14} /> <span className="hidden sm:inline">Refresh</span>
                    </Button>
                </div>
            </div>
            <div className="flex-1 overflow-auto p-0">
                <table className="w-full text-sm text-left">
                    <thead className="bg-stone-50 text-stone-500 font-bold uppercase text-[10px] tracking-widest sticky top-0 z-10 border-b border-stone-200 shadow-sm">
                        <tr>
                            <th className="px-6 py-3 w-32">Timestamp</th>
                            <th className="px-6 py-3 w-24">Level</th>
                            <th className="px-6 py-3">Message</th>
                            <th className="px-6 py-3">User ID</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                        <AnimatePresence initial={false}>
                        {logs.map((log) => (
                            <MotionTr 
                                key={log.id} 
                                initial={{ opacity: 0, x: -20, backgroundColor: "#ecfdf5" }}
                                animate={{ opacity: 1, x: 0, backgroundColor: "#ffffff" }}
                                transition={{ duration: 0.5 }}
                                className="hover:bg-stone-50 transition-colors"
                            >
                                <td className="px-6 py-3 whitespace-nowrap text-stone-500 text-xs font-mono">
                                    {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                </td>
                                <td className="px-6 py-3">
                                    <div className="flex items-center gap-2 font-bold text-xs uppercase">
                                        {getIcon(log.level)} {log.level}
                                    </div>
                                </td>
                                <td className="px-6 py-3">
                                    <div className="font-medium text-stone-800 text-sm">{log.message}</div>
                                    {log.details && log.details !== '{}' && (
                                        <details className="mt-1 group">
                                            <summary className="text-[10px] text-brand-600 cursor-pointer hover:underline list-none font-bold uppercase tracking-wider flex items-center gap-1">
                                                <Activity size={10} /> View Details
                                            </summary>
                                            <pre className="mt-2 p-3 bg-stone-900 rounded-lg text-[10px] overflow-x-auto text-green-400 font-mono border border-stone-800 shadow-inner leading-relaxed">
                                                {log.details}
                                            </pre>
                                        </details>
                                    )}
                                </td>
                                <td className="px-6 py-3 text-xs font-mono text-stone-400">
                                    {log.user_id ? log.user_id.substring(0,8)+'...' : '-'}
                                </td>
                            </MotionTr>
                        ))}
                        </AnimatePresence>
                        {logs.length === 0 && !loading && (
                            <tr><td colSpan={4} className="p-12 text-center text-stone-400">No logs recorded yet.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};
