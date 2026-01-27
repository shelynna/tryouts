
import React, { useState } from 'react';
import { Card, Button } from '../../ui';
import { Product, SystemSettings } from '../../../types';
import { ASSETS } from '../../../assets';
import { Plus, Edit2, Eye, EyeOff, Archive } from 'lucide-react';
import { formatCurrency } from '../../../lib/utils';
import { API } from '../../../lib/api';
import { ProductFormModal } from './modals/ProductFormModal';

interface ProductsTabProps {
    products: Product[];
    settings: SystemSettings;
    refreshAdminData: () => void;
    notify: (msg: string, type?: any) => void;
}

export const ProductsTab: React.FC<ProductsTabProps> = ({ products, settings, refreshAdminData, notify }) => {
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [showProductForm, setShowProductForm] = useState(false);

    const openCreate = () => {
        setEditingProduct(null);
        setShowProductForm(true);
    };

    const openEdit = (p: Product) => {
        setEditingProduct(p);
        setShowProductForm(true);
    };

    const handleSaveProduct = async (productData: Partial<Product>) => {
        notify("Saving product details...", "info");
        try {
            await API.saveProduct({
                ...productData,
                ...(editingProduct && editingProduct.id ? { id: editingProduct.id } : {})
            });
            setShowProductForm(false);
            setEditingProduct(null);
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

            <ProductFormModal 
                isOpen={showProductForm}
                onClose={() => setShowProductForm(false)}
                product={editingProduct}
                onSave={handleSaveProduct}
                notify={notify}
            />

            {/* Product Grid Display */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
               {products.map(p => (
                  <Card key={p.id} noPadding className={`group relative overflow-hidden flex flex-col transition-all hover:shadow-xl ${!p.isActive ? 'opacity-70' : ''}`}>
                     {/* Admin Actions Overlay - Always visible on desktop hover */}
                     <div className="absolute top-3 right-3 z-20 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={(e) => { e.stopPropagation(); openEdit(p); }} className="w-8 h-8 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-sm text-stone-600 hover:text-brand-900 hover:scale-110 transition-all"><Edit2 size={14}/></button>
                     </div>

                     <div className="aspect-[4/3] bg-stone-100 relative flex items-center justify-center overflow-hidden">
                        <img src={p.image} className={`w-full h-full object-cover transition-all duration-500 ${p.stockStatus === 'SOLD_OUT' ? 'grayscale opacity-50' : 'group-hover:scale-110'}`} alt={p.name} />
                        
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
