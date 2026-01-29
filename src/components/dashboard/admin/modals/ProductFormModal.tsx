
import React, { useState, useRef, useEffect } from 'react';
import { Modal, Button, Input, Select } from '../../../ui';
import { Product } from '../../../../types';
import { ASSETS } from '../../../../assets';
import { API } from '../../../../lib/api';
import { PRODUCT_CATEGORIES } from '../../../../lib/constants';
import { Edit2, Image as ImageIcon, Upload, X, Phone, Loader2 } from 'lucide-react';

interface ProductFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: Product | null; // null means create
    onSave: (data: Partial<Product>) => Promise<void>;
    notify: (msg: string, type?: any) => void;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({ isOpen, onClose, product, onSave, notify }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    
    const [formData, setFormData] = useState<Partial<Product> & { sellerPhone?: string }>({
        name: '', category: PRODUCT_CATEGORIES[0], size: '', price: 0, description: '', image: '', isActive: true, stockStatus: 'IN_STOCK', sellerPhone: ''
    });

    useEffect(() => {
        if (isOpen) {
            if (product) {
                setFormData({ ...product, sellerPhone: product.metadata?.sellerPhone || '' });
            } else {
                setFormData({ name: '', category: PRODUCT_CATEGORIES[0], size: '', price: 0, description: '', image: '', isActive: true, stockStatus: 'IN_STOCK', sellerPhone: '' });
            }
        }
    }, [isOpen, product]);

    const handleInputChange = (name: string, value: any) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                notify("Image is too large. Max 5MB allowed.", "error");
                return;
            }
            setIsUploading(true);
            try {
                const publicUrl = await API.uploadImage(file);
                handleInputChange('image', publicUrl);
                notify("Image uploaded successfully", "success");
            } catch (error: any) {
                notify("Failed to upload image.", "error");
            } finally {
                setIsUploading(false);
            }
        }
    };

    const handleSubmit = async () => {
        if (!formData.name?.trim()) return notify("Product name is required", "error");
        if (!formData.price || Number(formData.price) < 0) return notify("Price must be valid", "error");
        
        const payload: Partial<Product> = {
            ...formData,
            name: formData.name?.trim(),
            category: formData.category?.trim(),
            size: formData.size?.trim(),
            price: parseFloat(formData.price?.toString() || '0'), // Force number type
            description: formData.description?.trim(),
            image: (formData.image && formData.image.trim().length > 0) ? formData.image.trim() : ASSETS.PRODUCT_PLACEHOLDER,
            metadata: {
                ...(product?.metadata || {}),
                sellerPhone: formData.sellerPhone
            }
        };
        await onSave(payload);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={product ? 'Edit Product' : 'Add New Product'}
            size="xl"
            footer={
                <>
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={isUploading} className="px-8">{product ? 'Update Product' : 'Create Product'}</Button>
                </>
            }
        >
            <div className="flex flex-col lg:flex-row gap-8">
                {/* Image Upload Section */}
                <div className="w-full lg:w-5/12 space-y-4">
                    <div className="flex justify-between items-end">
                        <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest">Product Image</label>
                    </div>
                    <div 
                        className="aspect-[4/5] rounded-3xl bg-stone-50 border-2 border-dashed border-stone-200 hover:border-brand-400 hover:bg-brand-50/10 transition-all cursor-pointer relative overflow-hidden group flex flex-col items-center justify-center text-center p-6"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileSelect} />
                        {isUploading ? (
                            <div className="absolute inset-0 bg-white/80 z-20 flex flex-col items-center justify-center">
                                <Loader2 className="animate-spin text-brand-600 mb-2" size={32} />
                                <span className="text-xs font-bold text-stone-600">Uploading...</span>
                            </div>
                        ) : null}
                        {formData.image ? (
                            <>
                                <img src={formData.image} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                                    <div className="bg-white/20 p-3 rounded-full text-white"><Edit2 size={24} /></div>
                                </div>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleInputChange('image', ''); }}
                                    className="absolute top-3 right-3 bg-white text-red-500 p-2 rounded-full shadow-md hover:bg-red-50 transition-colors z-20"
                                >
                                    <X size={16} />
                                </button>
                            </>
                        ) : (
                            <>
                                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4 text-brand-500"><ImageIcon size={32} /></div>
                                <h4 className="font-bold text-stone-700 mb-1">No Image</h4>
                                <p className="text-xs text-stone-400 mb-4">Click to upload</p>
                                <div className="bg-stone-200 px-4 py-2 rounded-lg text-xs font-bold text-stone-600">Choose file</div>
                            </>
                        )}
                    </div>
                    
                    {!formData.image && (
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"><Upload size={14}/></span>
                                <input type="text" placeholder="Paste image URL" value={formData.image || ''} onChange={(e) => handleInputChange('image', e.target.value)} className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-200 bg-white focus:outline-none focus:border-brand-500 transition-all" />
                            </div>
                        </div>
                    )}
                    <p className="text-[10px] text-stone-400 text-center">Supported formats: JPEG, JPG, PNG (Max 5MB)</p>
                </div>

                {/* Form Fields */}
                <div className="flex-1 space-y-5">
                    <Input label="Product Name *" placeholder="e.g. Perfumed Rice" value={formData.name} onChange={(e) => handleInputChange('name', e.target.value)} className="font-medium text-lg" />
                    <div className="grid grid-cols-2 gap-5">
                        <Select 
                            label="Category *" 
                            value={formData.category} 
                            onChange={(e: any) => handleInputChange('category', e.target.value)} 
                            options={PRODUCT_CATEGORIES.map(c => ({ label: c, value: c }))} 
                        />
                        <Input label="Price (GHS) *" type="number" step="0.01" value={formData.price} onChange={(e) => handleInputChange('price', e.target.value)} className="font-mono font-bold" />
                    </div>
                    <Input label="Size / Unit *" value={formData.size} onChange={(e) => handleInputChange('size', e.target.value)} placeholder="e.g. 5kg, 1L, Box of 12" />
                    <Input label="Seller WhatsApp (optional)" value={formData.sellerPhone} onChange={(e) => handleInputChange('sellerPhone', e.target.value)} placeholder="e.g. +233551234567" icon={<Phone size={16} />} />
                    <div>
                        <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-2">Description</label>
                        <textarea value={formData.description} onChange={(e) => handleInputChange('description', e.target.value)} rows={5} className="block w-full rounded-xl border border-stone-200 bg-stone-50 p-4 text-stone-900 placeholder:text-stone-400 focus:bg-white transition-all focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 text-sm resize-none" placeholder="Product details and features..." />
                    </div>
                    <div className="flex gap-4 pt-2">
                         <div onClick={() => handleInputChange('isActive', !formData.isActive)} className={`flex-1 p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${formData.isActive ? 'bg-brand-50 border-brand-200' : 'bg-stone-50 border-stone-200'}`}>
                            <span className={`text-xs font-bold uppercase ${formData.isActive ? 'text-brand-700' : 'text-stone-500'}`}>Visible in Store</span>
                            <div className={`w-8 h-4 rounded-full relative transition-colors ${formData.isActive ? 'bg-brand-600' : 'bg-stone-300'}`}>
                                <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform`} style={{ left: formData.isActive ? '18px' : '2px' }}></div>
                            </div>
                        </div>
                         <div onClick={() => handleInputChange('stockStatus', formData.stockStatus === 'IN_STOCK' ? 'SOLD_OUT' : 'IN_STOCK')} className={`flex-1 p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${formData.stockStatus === 'IN_STOCK' ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                            <span className={`text-xs font-bold uppercase ${formData.stockStatus === 'IN_STOCK' ? 'text-emerald-700' : 'text-red-700'}`}>In Stock</span>
                            <div className={`w-8 h-4 rounded-full relative transition-colors ${formData.stockStatus === 'IN_STOCK' ? 'bg-emerald-500' : 'bg-red-400'}`}>
                                <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform`} style={{ left: formData.stockStatus === 'IN_STOCK' ? '18px' : '2px' }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
};
