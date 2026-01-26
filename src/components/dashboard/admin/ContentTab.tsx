
import React, { useState } from 'react';
import { Card, Button } from '../../ui';
import { Save } from 'lucide-react';
import { SystemSettings } from '../../../types';

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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            ...settings,
            heroImages: heroImages.split('\n').filter(s => s.trim() !== ''),
            legalContent
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
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
