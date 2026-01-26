
import React, { useState } from 'react';
import { Card, Button, Input, Select, Modal } from '../../ui';
import { Product, SystemSettings } from '../../../types';
import { ASSETS } from '../../../assets';
import { Plus, Edit2, Eye, EyeOff, Archive, Image as ImageIcon } from 'lucide-react';
import { formatCurrency } from '../../../lib/utils';
import { API } from '../../../lib/api';

interface ProductsTabProps {
    products: Product[];
    settings: SystemSettings;
    refreshAdminData: () => void;
    notify: (msg: string, type?: any) => void;
}

export const ProductsTab: React.FC<ProductsTabProps> = ({ products, settings, refreshAdminData, notify }) => {
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [showProductForm, setShowProductForm] = useState(false);
    
    // Default form state
    const [formData, setFormData] = useState<Partial<Product>>({
        name: '', category: 'Grains', size: '', price: 0, description: '', image: '', isActive: true, stockStatus: 'IN_STOCK'
    });

    const openCreate = () => {
        setEditingProduct(null);
        setFormData({ name: '', category: 'Grains', size: '', price: 0, description: '', image: '', isActive: true, stockStatus: 'IN_STOCK' });
        setShowProductForm(true);
    };

    const openEdit = (p: Product) => {
        setEditingProduct(p);
        setFormData({ ...p });
        setShowProductForm(true);
    };

    const handleInputChange = (name: string, value: any) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveProduct = async () => {
        if (!formData.name?.trim()) return notify("Product name is required", "error");
        if (!formData.price || formData.price <= 0) return notify("Price must be greater than zero", "error");
        if (!formData.category) return notify("Category is required", "error");
        if (!formData.size) return notify("Unit size is required", "error");

        notify("Saving product details...", "info");
        
        try {
            const productPayload: Partial<Product> = {
                ...formData,
                name: formData.name?.trim(),
                category: formData.category?.trim(),
                size: formData.size?.trim(),
                description: formData.description?.trim(),
                image: (formData.image && formData.image.trim().length > 0) ? formData.image.trim() : ASSETS.PRODUCT_RICE,
                isActive: formData.isActive ?? true,
                stockStatus: formData.stockStatus ?? 'IN_STOCK',
                ...(editingProduct && editingProduct.id ? { id: editingProduct.id } : {})
            };
        
            await API.saveProduct(productPayload);
            setShowProductForm(false);
            setEditingProduct(null);
            setFormData({ name: '', category: 'Grains', size: '', price: 0, description: '', image: '', isActive: true, stockStatus: 'IN_STOCK' });
            refreshAdminData();
            notify(editingProduct ? "Product updated" : "Product created", "success");
        } catch (error: any) {
            notify(error.message || "Failed to save product", "error");
        }
    };

    const toggleProductVisibility = async (p: Product, e: React.MouseEvent) => {
        e.stopPropagation();
        const newStatus = !p.isActive;
        try {
            await API.saveProduct({ ...p, isActive: newStatus });
            refreshAdminData();
            notify(`Product ${newStatus ? 'visible' : 'hidden'}`, "success");
        } catch (e: any) {
            notify("Failed to update visibility", "error");
        }
    };

    const toggleStockStatus = async (p: Product, e: React.MouseEvent) => {
        e.stopPropagation();
        const newStatus = p.stockStatus === 'IN_STOCK' ? 'SOLD_OUT' : 'IN_STOCK';
        try {
            await API.saveProduct({ ...p, stockStatus: newStatus });
            refreshAdminData();
            notify(`Marked as ${newStatus === 'IN_STOCK' ? 'In Stock' : 'Sold Out'}`, "success");
        } catch (e: any) {
            notify("Failed to update stock", "error");
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-2xl border border-stone-100 shadow-soft gap-4">
               <div>
                  <h3 className="text-xl font-serif font-bold text-stone-900">Inventory Control</h3>
                  <p className="text-xs text-stone-500 font-medium mt-1">Manage catalogue visibility and availability.</p>
               </div>
               <Button onClick={openCreate} size="md" className="gap-2 shadow-lg shadow-stone-900/10 w-full sm:w-auto">
                  <Plus size={16} /> Add Product
               </Button>
            </div>

            <Modal
                isOpen={showProductForm}
                onClose={() => setShowProductForm(false)}
                title={editingProduct ? 'Edit Product' : 'Add New Product'}
                size="lg"
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setShowProductForm(false)}>Cancel</Button>
                        <Button onClick={handleSaveProduct}>{editingProduct ? 'Update Product' : 'Create Product'}</Button>
                    </>
                }
            >
                <div className="flex gap-8 flex-col md:flex-row">
                    {/* Left: Image Preview */}
                    <div className="w-full md:w-1/3 space-y-4">
                        <div className="aspect-square rounded-2xl bg-stone-50 border-2 border-dashed border-stone-200 overflow-hidden relative flex items-center justify-center group">
                            {formData.image ? (
                                <img 
                                src={formData.image} 
                                alt="Preview" 
                                className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                                onError={(e) => { (e.target as HTMLImageElement).src = ASSETS.PRODUCT_RICE; }} 
                                />
                            ) : (
                                <div className="text-stone-300 flex flex-col items-center">
                                    <ImageIcon size={48} />
                                    <span className="text-xs font-bold mt-2">No Image</span>
                                </div>
                            )}
                        </div>
                        
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Image Source (URL)</label>
                            <input 
                                type="text" 
                                placeholder="/assets/images/..."
                                value={formData.image}
                                onChange={(e) => handleInputChange('image', e.target.value)}
                                className="w-full text-xs p-3 rounded-xl border border-stone-200 bg-stone-50 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 transition-all"
                            />
                        </div>
                        
                        {/* Toggles */}
                        <div className="bg-stone-50 p-4 rounded-xl space-y-3 border border-stone-100">
                            <div 
                                onClick={() => handleInputChange('isActive', !formData.isActive)}
                                className="flex items-center justify-between cursor-pointer group"
                            >
                                <span className="text-xs font-bold text-stone-600 uppercase">Visibility</span>
                                <div className={`w-10 h-5 rounded-full relative transition-colors ${formData.isActive ? 'bg-brand-900' : 'bg-stone-300'}`}>
                                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-transform ${formData.isActive ? 'left-6' : 'left-1'}`}></div>
                                </div>
                            </div>
                            <div 
                                onClick={() => handleInputChange('stockStatus', formData.stockStatus === 'IN_STOCK' ? 'SOLD_OUT' : 'IN_STOCK')}
                                className="flex items-center justify-between cursor-pointer group"
                            >
                                <span className="text-xs font-bold text-stone-600 uppercase">Stock Status</span>
                                <div className={`w-10 h-5 rounded-full relative transition-colors ${formData.stockStatus === 'IN_STOCK' ? 'bg-emerald-500' : 'bg-red-400'}`}>
                                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-transform ${formData.stockStatus === 'IN_STOCK' ? 'left-6' : 'left-1'}`}></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Details */}
                    <div className="w-full md:w-2/3 space-y-5">
                        <Input label="Product Name" value={formData.name} onChange={(e) => handleInputChange('name', e.target.value)} placeholder="e.g. Perfumed Rice" required />
                        
                        <div className="grid grid-cols-2 gap-5">
                            <Select 
                                label="Category" 
                                value={formData.category}
                                onChange={(e: any) => handleInputChange('category', e.target.value)}
                                options={[
                                    { label: 'Grains', value: 'Grains' }, { label: 'Oils', value: 'Oils' }, 
                                    { label: 'Canned', value: 'Canned' }, { label: 'Cleaning', value: 'Cleaning' },
                                    { label: 'Noodles', value: 'Noodles' }, { label: 'Electronics', value: 'Electronics' }
                                ]} 
                            />
                            <Input label="Price (GHS)" type="number" step="0.01" value={formData.price} onChange={(e) => handleInputChange('price', e.target.value)} required />
                        </div>
                        
                        <Input label="Size / Unit" value={formData.size} onChange={(e) => handleInputChange('size', e.target.value)} required placeholder="e.g. 5kg, 1L, Box of 12" />
                        
                        <div>
                            <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest ml-1 mb-2">Description</label>
                            <textarea 
                                value={formData.description}
                                onChange={(e) => handleInputChange('description', e.target.value)}
                                rows={4}
                                className="block w-full rounded-xl border border-stone-200 bg-white p-4 text-stone-900 placeholder:text-stone-300 transition-all focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 text-sm"
                                placeholder="Product details and features..."
                            />
                        </div>
                    </div>
                </div>
            </Modal>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
               {products.map(p => (
                  <Card key={p.id} noPadding className={`group relative overflow-hidden flex flex-col transition-all hover:shadow-xl ${!p.isActive ? 'opacity-70' : ''}`}>
                     {/* Admin Actions Overlay - Always visible on desktop hover */}
                     <div className="absolute top-3 right-3 z-20 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={(e) => { e.stopPropagation(); openEdit(p); }} className="w-8 h-8 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-sm text-stone-600 hover:text-brand-900 hover:scale-110 transition-all"><Edit2 size={14}/></button>
                     </div>

                     <div className="aspect-[4/3] bg-stone-100 relative flex items-center justify-center overflow-hidden">
                        <img src={p.image} className={`w-full h-full object-contain transition-all duration-500 ${p.stockStatus === 'SOLD_OUT' ? 'grayscale opacity-50' : 'group-hover:scale-110'}`} alt={p.name} />
                        
                        {/* Badges */}
                        <div className="absolute top-3 left-3 flex flex-col gap-1">
                            {!p.isActive && <span className="bg-stone-900/80 backdrop-blur text-white text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1"><EyeOff size={10}/> Hidden</span>}
                            {p.stockStatus === 'SOLD_OUT' && <span className="bg-red-600/90 backdrop-blur text-white text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1"><Archive size={10}/> Sold Out</span>}
                        </div>
                     </div>

                     <div className="p-4 flex-1 flex flex-col">
                        <div className="flex justify-between items-start mb-1">
                           <h4 className="font-bold text-stone-900 line-clamp-1">{p.name}</h4>
                           <span className="font-bold text-stone-600">{formatCurrency(p.price)}</span>
                        </div>
                        <p className="text-xs text-stone-500 font-bold uppercase tracking-wider mb-4">{p.size}</p>
                        
                        {/* Quick Toggles */}
                        <div className="mt-auto grid grid-cols-2 gap-2">
                            <button 
                                onClick={(e) => toggleProductVisibility(p, e)}
                                className={`py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 transition-colors ${p.isActive ? 'bg-stone-100 text-stone-600 hover:bg-stone-200' : 'bg-brand-900 text-white'}`}
                            >
                                {p.isActive ? <><Eye size={12}/> Hide</> : <><EyeOff size={12}/> Show</>}
                            </button>
                            <button 
                                onClick={(e) => toggleStockStatus(p, e)}
                                className={`py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 transition-colors ${p.stockStatus === 'IN_STOCK' ? 'bg-stone-100 text-stone-600 hover:bg-stone-200' : 'bg-emerald-100 text-emerald-700'}`}
                            >
                                {p.stockStatus === 'IN_STOCK' ? 'Mark Out' : 'Restock'}
                            </button>
                        </div>
                     </div>
                  </Card>
               ))}
            </div>
         </div>
    );
};
