
import React, { useState, useRef } from 'react';
import { Card, Button } from '../../ui';
import { Save, Upload, Loader2, Image as ImageIcon } from 'lucide-react';
import { SystemSettings } from '../../../types';
import { API } from '../../../lib/api';
import { ASSETS } from '../../../assets';

interface ContentTabProps {
    settings: SystemSettings;
    onSave: (settings: SystemSettings) => void;
}

export const ContentTab: React.FC<ContentTabProps> = ({ settings, onSave }) => {
    const [heroImages, setHeroImages] = useState(settings.heroImages?.join('\n') || '');
    const [legalContent, setLegalContent] = useState({
        privacyPolicy: settings.legalContent?.privacyPolicy || '',
        termsOfService: settings.legalContent?.termsOfService || '',
        refundPolicy: settings.legalContent?.refundPolicy || ''
    });
    
    // Branding State
    const [branding, setBranding] = useState({
        logo: settings.branding?.logo || '',
        logoWhite: settings.branding?.logoWhite || ''
    });
    
    const [uploadingTarget, setUploadingTarget] = useState<'logo' | 'logoWhite' | null>(null);
    const logoInputRef = useRef<HTMLInputElement>(null);
    const logoWhiteInputRef = useRef<HTMLInputElement>(null);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'logo' | 'logoWhite') => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        setUploadingTarget(target);
        try {
            const url = await API.uploadImage(file);
            setBranding(prev => ({ ...prev, [target]: url }));
        } catch (error) {
            console.error("Upload failed", error);
            alert("Failed to upload image. Please try again.");
        } finally {
            setUploadingTarget(null);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            ...settings,
            heroImages: heroImages.split('\n').filter(s => s.trim() !== ''),
            legalContent,
            branding
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* BRANDING SECTION */}
            <Card>
                <h3 className="text-xl font-serif font-bold text-brand-900 mb-6">Branding & Identity</h3>
                <div className="grid md:grid-cols-2 gap-8">
                    {/* Main Logo */}
                    <div className="space-y-3">
                        <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest">Main Logo (Light Background)</label>
                        <div 
                            className="bg-white border-2 border-dashed border-stone-200 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-brand-400 hover:bg-brand-50/10 transition-colors h-48 relative"
                            onClick={() => logoInputRef.current?.click()}
                        >
                            <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={(e) => handleUpload(e, 'logo')} />
                            {uploadingTarget === 'logo' ? (
                                <Loader2 className="animate-spin text-brand-500" />
                            ) : branding.logo ? (
                                <img src={branding.logo} className="max-h-32 object-contain" alt="Main Logo" />
                            ) : (
                                <>
                                    <img src={ASSETS.LOGO} className="max-h-16 object-contain mb-4 opacity-50 grayscale" alt="Default" />
                                    <span className="text-xs font-bold text-stone-400">Click to upload custom logo</span>
                                </>
                            )}
                        </div>
                        {branding.logo && (
                            <button type="button" onClick={() => setBranding(prev => ({...prev, logo: ''}))} className="text-xs text-red-500 font-bold hover:underline">Reset to Default</button>
                        )}
                    </div>

                    {/* White Logo */}
                    <div className="space-y-3">
                        <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest">White Logo (Dark Background)</label>
                        <div 
                            className="bg-stone-900 border-2 border-dashed border-stone-700 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-stone-500 transition-colors h-48 relative"
                            onClick={() => logoWhiteInputRef.current?.click()}
                        >
                            <input type="file" ref={logoWhiteInputRef} className="hidden" accept="image/*" onChange={(e) => handleUpload(e, 'logoWhite')} />
                            {uploadingTarget === 'logoWhite' ? (
                                <Loader2 className="animate-spin text-white" />
                            ) : branding.logoWhite ? (
                                <img src={branding.logoWhite} className="max-h-32 object-contain" alt="White Logo" />
                            ) : (
                                <>
                                    <img src={ASSETS.LOGO_WHITE} className="max-h-16 object-contain mb-4 opacity-50" alt="Default" />
                                    <span className="text-xs font-bold text-stone-500">Click to upload white version</span>
                                </>
                            )}
                        </div>
                        {branding.logoWhite && (
                            <button type="button" onClick={() => setBranding(prev => ({...prev, logoWhite: ''}))} className="text-xs text-red-500 font-bold hover:underline">Reset to Default</button>
                        )}
                    </div>
                </div>
            </Card>

            <Card>
                <h3 className="text-xl font-serif font-bold text-brand-900 mb-6">Landing Page Assets</h3>
                <div>
                    <label className="block text-xs font-bold text-stone-500 mb-2 uppercase tracking-widest">Hero Background Images</label>
                    <p className="text-xs text-stone-400 mb-3">One URL per line. The system will create a crossfade slideshow if multiple images are provided.</p>
                    <textarea 
                    rows={4}
                    value={heroImages}
                    onChange={e => setHeroImages(e.target.value)}
                    className="w-full p-4 bg-stone-50 rounded-xl border border-stone-200 font-mono text-sm focus:outline-none focus:border-brand-500"
                    placeholder="https://..."
                    />
                </div>
            </Card>

            <Card>
                <h3 className="text-xl font-serif font-bold text-brand-900 mb-6">Legal Documents</h3>
                <div className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-stone-500 mb-2 uppercase tracking-widest">Privacy Policy</label>
                        <textarea 
                        rows={6}
                        value={legalContent.privacyPolicy}
                        onChange={e => setLegalContent({...legalContent, privacyPolicy: e.target.value})}
                        className="w-full p-4 bg-stone-50 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-brand-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-stone-500 mb-2 uppercase tracking-widest">Terms of Service</label>
                        <textarea 
                        rows={6}
                        value={legalContent.termsOfService}
                        onChange={e => setLegalContent({...legalContent, termsOfService: e.target.value})}
                        className="w-full p-4 bg-stone-50 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-brand-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-stone-500 mb-2 uppercase tracking-widest">Refund Policy</label>
                        <textarea 
                        rows={6}
                        value={legalContent.refundPolicy}
                        onChange={e => setLegalContent({...legalContent, refundPolicy: e.target.value})}
                        className="w-full p-4 bg-stone-50 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-brand-500"
                        />
                    </div>
                </div>
            </Card>

            <div className="flex justify-end">
                <Button type="submit" size="lg" className="gap-2">
                    <Save size={18} /> Publish Content Updates
                </Button>
            </div>
        </form>
    );
};
