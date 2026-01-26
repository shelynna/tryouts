
import React, { useState } from 'react';
import { Card, Badge, Button, Input, useToast } from '../../ui';
import { PickupListEntry, PickupPoint, BasketStatus } from '../../../types';
import { Truck, Search, QrCode, CheckCircle, Package } from 'lucide-react';
import { API } from '../../../lib/api';
import { formatDate } from '../../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface PickupTabProps {
    pickupList: PickupListEntry[];
    pickupFilter: string;
    onFilterChange: (filter: string) => void;
}

export const PickupTab: React.FC<PickupTabProps> = ({ pickupList, pickupFilter, onFilterChange }) => {
    const { showToast } = useToast();
    const [searchCode, setSearchCode] = useState('');
    const [scannedBasket, setScannedBasket] = useState<PickupListEntry | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [isRedeeming, setIsRedeeming] = useState(false);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchCode.trim()) return;
        setIsSearching(true);
        setScannedBasket(null);
        try {
            const basket = await API.getBasketByDeliveryCode(searchCode.trim().toUpperCase());
            if (basket) {
                setScannedBasket(basket);
            } else {
                showToast("Invalid code. No order found.", "error");
            }
        } catch (error) {
            showToast("Error searching for code.", "error");
        } finally {
            setIsSearching(false);
        }
    };

    const handleRedeem = async () => {
        if (!scannedBasket) return;
        if (!confirm(`Confirm collection for ${scannedBasket.userName}?`)) return;
        
        setIsRedeeming(true);
        try {
            await API.redeemBasket(scannedBasket.basketId);
            showToast("Order marked as COLLECTED", "success");
            setScannedBasket({ ...scannedBasket, status: BasketStatus.COLLECTED, pickupTimestamp: new Date().toISOString() });
        } catch (error) {
            showToast("Failed to redeem order.", "error");
        } finally {
            setIsRedeeming(false);
        }
    };

    return (
        <div className="space-y-8">
            {/* --- Code Redemption Section --- */}
            <Card className="bg-stone-900 text-white border-none relative overflow-hidden">
                <div className="absolute top-0 right-0 p-20 bg-brand-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                
                <div className="relative z-10 grid md:grid-cols-2 gap-8 items-center">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-white/10 rounded-lg"><QrCode className="text-brand-400" /></div>
                            <h3 className="text-2xl font-serif font-bold">Fast Checkout</h3>
                        </div>
                        <p className="text-stone-400 mb-6">Enter the student's delivery code to instantly pull up their order and mark it as collected.</p>
                        
                        <form onSubmit={handleSearch} className="flex gap-2">
                            <input 
                                value={searchCode}
                                onChange={e => setSearchCode(e.target.value.toUpperCase())}
                                placeholder="SML-KNUST-..."
                                className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-stone-500 focus:outline-none focus:border-brand-500 font-mono uppercase"
                            />
                            <Button type="submit" loading={isSearching} className="bg-brand-500 hover:bg-brand-400 text-white border-none">
                                <Search size={20} />
                            </Button>
                        </form>
                    </div>

                    {/* Result Display */}
                    <div className="bg-white/5 rounded-2xl p-6 border border-white/10 min-h-[200px] flex flex-col justify-center">
                        <AnimatePresence mode='wait'>
                            {!scannedBasket ? (
                                <motion.div 
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                    className="text-center text-stone-500"
                                >
                                    <Package size={40} className="mx-auto mb-2 opacity-50" />
                                    <p>Scan result will appear here</p>
                                </motion.div>
                            ) : (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                                    className="space-y-4"
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="font-bold text-xl">{scannedBasket.userName}</h4>
                                            <p className="text-sm text-stone-400">{scannedBasket.userPhone} • {scannedBasket.userPickupPoint}</p>
                                        </div>
                                        <Badge status={scannedBasket.status} />
                                    </div>
                                    
                                    <div className="py-2 border-y border-white/10 text-sm space-y-1">
                                        {scannedBasket.items.map((item, i) => (
                                            <div key={i} className="flex justify-between">
                                                <span>{item.quantity}x {item.name}</span>
                                                <span className="text-stone-500">{item.size}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {scannedBasket.status !== BasketStatus.COLLECTED ? (
                                        <Button fullWidth onClick={handleRedeem} loading={isRedeeming} variant="success">
                                            Confirm Collection
                                        </Button>
                                    ) : (
                                        <div className="text-center text-emerald-400 font-bold text-sm bg-emerald-500/10 py-2 rounded-lg">
                                            Collected at {formatDate(scannedBasket.pickupTimestamp!)}
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </Card>

            {/* --- Standard List View --- */}
            <div>
                <div className="flex gap-2 mb-4 p-1 bg-stone-100 inline-flex rounded-xl overflow-x-auto max-w-full">
                    {(Object.values(PickupPoint) as string[]).concat(['ALL']).map((point) => (
                        <button
                        key={point}
                        onClick={() => onFilterChange(point)}
                        className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${pickupFilter === point ? 'bg-white text-brand-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
                        >
                            {point === 'ALL' ? 'All Locations' : point}
                        </button>
                    ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {pickupList.map((entry, i) => (
                        <Card key={i} className="p-0 border-l-4 border-l-brand-500 overflow-hidden">
                            <div className="p-6 pb-4">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h4 className="font-bold text-lg text-brand-900">{entry.userName}</h4>
                                        <p className="text-sm text-stone-500 font-mono">{entry.userPhone}</p>
                                    </div>
                                    <Badge status={entry.status} size="sm" />
                                </div>
                                <div className="bg-stone-50 rounded-xl p-3 text-sm space-y-2 mb-2 border border-stone-100">
                                    {entry.items.map((it, idx) => (
                                        <div key={idx} className="flex justify-between items-center">
                                            <span className="text-stone-700 font-medium">{it.quantity}x {it.name}</span>
                                            <span className="text-stone-400 text-[10px] uppercase font-bold">{it.size}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="px-6 py-3 bg-stone-50 border-t border-stone-100 flex justify-between items-center text-xs font-bold text-stone-500 uppercase tracking-widest">
                                <span className="flex items-center gap-1"><Truck size={12}/> {entry.userPickupPoint}</span>
                                <span className="font-mono text-brand-600">{entry.deliveryCode || `#${entry.basketId.substring(0,6)}`}</span>
                            </div>
                        </Card>
                    ))}
                </div>
                {pickupList.length === 0 && <div className="p-20 text-center text-stone-400 bg-stone-50 rounded-3xl border-2 border-dashed border-stone-200">No pickup tasks available for selected filter.</div>}
            </div>
        </div>
    );
};
