
import React, { useState } from 'react';
import { PlanSelector } from '../../components/subscription/PlanSelector';
import { useAuth } from '../../context/AuthContext';
import { Button, Skeleton, useToast } from '../../components/ui';
import { ArrowLeft, Crown, ShieldCheck, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSubscription } from '../../hooks/useSubscription';
import { CreditFacility } from '../../components/subscription/CreditFacility';
import { ExclusiveDeals } from '../../components/subscription/ExclusiveDeals';
import { usePaymentProcessor } from '../../hooks/usePaymentProcessor';

export const Plans: React.FC = () => {
    const { user, refreshUser } = useAuth();
    const navigate = useNavigate();
    const { downgradeToStandard, isSML, loading, refresh: refreshSubscription } = useSubscription(user?.id || '');
    const { showToast } = useToast();
    
    // Use the shared hook
    const { processPayment, isProcessing } = usePaymentProcessor();

    const handleUpgradePayment = async () => {
        if (!user) return;
        const amount = 15.00; // Fixed Subscription Fee
        
        await processPayment(amount, user, undefined, 'SUBSCRIPTION', async () => {
            await Promise.all([refreshUser(), refreshSubscription()]);
            showToast("Welcome to SML Subscriber Tier!", "success");
        });
    };

    const handlePlanSelect = async (code: string) => {
        if (code === 'sml') {
            await handleUpgradePayment();
        } else {
            if (confirm("Downgrade to Standard? You will lose credit access immediately.")) {
                const res = await downgradeToStandard();
                if (res.success) {
                    showToast("Plan downgraded to Standard.", "success");
                    await Promise.all([refreshUser(), refreshSubscription()]);
                } else {
                    showToast("Downgrade failed: " + res.error, "error");
                }
            }
        }
    };

    if (!user) return null;

    if (loading) {
        return (
            <div className="container-padding py-8 space-y-8">
                <Skeleton className="h-10 w-32 rounded-lg" />
                <div className="grid md:grid-cols-2 gap-6">
                    <Skeleton className="h-64 w-full rounded-3xl" />
                    <Skeleton className="h-64 w-full rounded-3xl" />
                </div>
            </div>
        );
    }

    return (
        <div className="container-padding py-8 space-y-8 pb-20">
            <div className="flex items-center justify-between">
                <Button variant="ghost" onClick={() => navigate('/dashboard')} className="gap-2 text-stone-500 hover:text-stone-900">
                    <ArrowLeft size={18}/> Back
                </Button>
                {isSML && (
                    <span className="bg-brand-900 text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-2 shadow-md">
                        <Crown size={14} className="text-yellow-400" /> Active Subscriber
                    </span>
                )}
            </div>

            <div className="text-center max-w-2xl mx-auto mb-10">
                <h1 className="text-3xl md:text-4xl font-serif font-bold text-stone-900 mb-2">My Subscription</h1>
                <p className="text-stone-500 text-lg">Manage your plan and access exclusive benefits.</p>
            </div>

            {/* Subscriber Benefits Section */}
            {isSML ? (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-brand-50 border border-brand-100 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-brand-600 shadow-sm border border-brand-100">
                                <ShieldCheck size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-brand-900 text-lg">Plan Active</h3>
                                <p className="text-brand-800/70 text-sm">Your SML subscription is valid for this semester.</p>
                            </div>
                        </div>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="border-brand-200 text-brand-700 bg-white hover:bg-brand-50"
                            onClick={() => {
                                document.getElementById('plans-section')?.scrollIntoView({ behavior: 'smooth' });
                            }}
                        >
                            Manage Plan
                        </Button>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <CreditFacility userId={user.id} />
                        <ExclusiveDeals userId={user.id} />
                    </div>
                </div>
            ) : (
                <div className="bg-gradient-to-br from-stone-900 to-stone-800 rounded-3xl p-8 md:p-12 text-center text-white mb-12 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full bg-[url('/assets/images/patterns/cubes.png')] opacity-10"></div>
                    <div className="relative z-10 max-w-xl mx-auto space-y-6">
                        <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto backdrop-blur-md border border-white/10">
                            <Crown size={32} className="text-yellow-400" />
                        </div>
                        <h2 className="text-3xl font-heading font-bold">Unlock the Full Experience</h2>
                        <p className="text-stone-300 text-lg leading-relaxed">
                            Upgrade to Subscriber to access our <strong>Credit Facility</strong> (Top-Ups), exclusive discounts, and priority delivery services.
                        </p>
                        <Button 
                            onClick={handleUpgradePayment} 
                            disabled={isProcessing}
                            className="bg-white text-stone-900 hover:bg-stone-100 font-bold px-8 h-12 rounded-xl shadow-lg"
                        >
                            {isProcessing ? <Loader2 className="animate-spin" /> : 'Upgrade for GHS 15.00'}
                        </Button>
                    </div>
                </div>
            )}

            {/* Plans Selector */}
            <div id="plans-section" className="pt-8 border-t border-stone-200">
                <div className="text-center mb-8">
                    <h3 className="text-xl font-bold text-stone-900">Available Plans</h3>
                </div>
                <PlanSelector userId={user.id} onPlanSelect={handlePlanSelect} />
            </div>
        </div>
    );
};
