
import React, { useState, useRef, useEffect } from 'react';
import { Card, Button, useToast } from '../../ui';
import { API } from '../../../lib/api';
import { QrCode, Search, CheckCircle, XCircle, Package, ArrowRight, Camera, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../lib/utils';

const MotionDiv = motion.div as any;

export const PickupTab: React.FC = () => {
    const { showToast } = useToast();
    const [code, setCode] = useState('');
    const [processing, setProcessing] = useState(false);
    const [result, setResult] = useState<{ success: boolean; message: string; student?: string; count?: number } | null>(null);
    const [isCameraActive, setIsCameraActive] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);

    // Camera logic (Simulated for UI demonstration)
    const toggleCamera = async () => {
        if (isCameraActive) {
            setIsCameraActive(false);
            if (videoRef.current && videoRef.current.srcObject) {
                const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
                tracks.forEach(track => track.stop());
            }
        } else {
            setIsCameraActive(true);
            try {
                // Request camera (browser will ask permission)
                const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            } catch (err) {
                console.error("Camera access denied", err);
                showToast("Camera access denied or unavailable.", "error");
                setIsCameraActive(false);
            }
        }
    };

    // Cleanup camera on unmount
    useEffect(() => {
        return () => {
            if (videoRef.current && videoRef.current.srcObject) {
                const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
                tracks.forEach(track => track.stop());
            }
        };
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const fullCode = code.startsWith('SML-') ? code : `SML-${code}`;
        
        if (fullCode.length < 5) {
            showToast("Please enter a valid code", "error");
            return;
        }
        
        setProcessing(true);
        setResult(null);

        try {
            const res = await API.collectDelivery(fullCode.trim());
            setResult(res as any);
            if (res.success) {
                // Haptic feedback if available
                if (navigator.vibrate) navigator.vibrate(200);
                setCode(''); 
            } else {
                if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
            }
        } catch (e: any) {
            setResult({ success: false, message: e.message || "Network Error" });
        } finally {
            setProcessing(false);
        }
    };

    const handleReset = () => {
        setResult(null);
        setCode('');
    };

    return (
        <div className="max-w-md mx-auto py-6 font-sans">
            
            {/* 1. HERO SECTION: CAMERA TRIGGER */}
            <div className="mb-8">
                <div 
                    className={cn(
                        "relative w-full aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl transition-all duration-500 border-4",
                        isCameraActive ? "border-brand-500 bg-black" : "border-white bg-stone-900"
                    )}
                >
                    {isCameraActive ? (
                        <>
                            <video 
                                ref={videoRef} 
                                autoPlay 
                                playsInline 
                                className="absolute inset-0 w-full h-full object-cover"
                            />
                            {/* Scanning Overlay */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="w-48 h-48 border-2 border-white/50 rounded-xl relative">
                                    <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-brand-500 -mt-1 -ml-1"></div>
                                    <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-brand-500 -mt-1 -mr-1"></div>
                                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-brand-500 -mb-1 -ml-1"></div>
                                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-brand-500 -mb-1 -mr-1"></div>
                                    <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-red-500/50 animate-pulse"></div>
                                </div>
                            </div>
                            <button 
                                onClick={toggleCamera} 
                                className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full backdrop-blur-md"
                            >
                                <X size={20} />
                            </button>
                        </>
                    ) : (
                        <div 
                            onClick={toggleCamera}
                            className="absolute inset-0 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-stone-800 transition-colors group"
                        >
                            <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform backdrop-blur-sm border border-white/10">
                                <Camera size={36} className="text-brand-400" />
                            </div>
                            <h3 className="font-heading font-bold text-white text-xl">Tap to Scan QR</h3>
                            <p className="text-stone-400 text-sm mt-1">Point camera at student's phone</p>
                        </div>
                    )}
                </div>
            </div>

            {/* 2. MANUAL ENTRY */}
            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-3xl shadow-soft border border-stone-100 relative overflow-hidden">
                <label className="block text-center text-xs font-bold text-stone-400 uppercase tracking-widest mb-6">
                    Or Enter Code Manually
                </label>
                
                <div className="flex items-center justify-center gap-2 mb-8">
                    {/* Prefix (Static) */}
                    <div className="bg-stone-100 px-4 py-4 rounded-xl border border-stone-200 text-stone-500 font-mono text-xl font-bold select-none h-16 flex items-center">
                        SML-
                    </div>
                    
                    {/* Input Field */}
                    <input 
                        type="text" // using text to allow pasting full code if needed, but styling suggests numbers
                        placeholder="0000" 
                        value={code.replace('SML-', '')}
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                        className="w-full max-w-[180px] h-16 text-center text-3xl font-mono font-bold tracking-widest text-stone-900 border-2 border-brand-100 rounded-xl focus:ring-4 focus:ring-brand-500/20 focus:border-brand-500 outline-none shadow-inner placeholder:text-stone-200 bg-stone-50 focus:bg-white transition-all uppercase"
                    />
                </div>

                <Button 
                    fullWidth 
                    size="xl" 
                    loading={processing} 
                    className="h-16 text-lg rounded-2xl shadow-xl shadow-brand-900/20 bg-brand-900 hover:bg-brand-800"
                    disabled={!code}
                >
                    Confirm Collection <ArrowRight className="ml-2" />
                </Button>
            </form>

            {/* 3. RESULT OVERLAY (Modal Style) */}
            <AnimatePresence>
                {result && (
                    <MotionDiv
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-stone-900/80 backdrop-blur-md"
                        onClick={handleReset}
                    >
                        <div className="bg-white w-full max-w-sm rounded-3xl p-8 text-center shadow-2xl relative" onClick={e => e.stopPropagation()}>
                            <button onClick={handleReset} className="absolute top-4 right-4 p-2 text-stone-400 hover:bg-stone-100 rounded-full">
                                <X size={20} />
                            </button>

                            <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ${result.success ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                                {result.success ? <CheckCircle size={48} strokeWidth={2} /> : <XCircle size={48} strokeWidth={2} />}
                            </div>
                            
                            <h2 className="text-2xl font-heading font-bold text-stone-900 mb-2">
                                {result.success ? "Collection Verified!" : "Failed"}
                            </h2>
                            
                            <p className="text-stone-500 mb-6 font-medium">
                                {result.message}
                            </p>

                            {result.success && result.student && (
                                <div className="bg-stone-50 rounded-xl p-4 border border-stone-200 mb-6 text-left">
                                    <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">Items Released To</p>
                                    <p className="text-lg font-bold text-stone-900">{result.student}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <Package size={14} className="text-brand-600" />
                                        <span className="text-sm font-medium text-stone-700">{result.count} items in basket</span>
                                    </div>
                                </div>
                            )}

                            <Button onClick={handleReset} fullWidth size="lg" variant={result.success ? 'primary' : 'secondary'}>
                                {result.success ? 'Scan Next' : 'Try Again'}
                            </Button>
                        </div>
                    </MotionDiv>
                )}
            </AnimatePresence>
        </div>
    );
};
