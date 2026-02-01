
import React, { useState } from 'react';
import { Card, Button, Input } from '../../ui';
import { Product, SystemSettings } from '../../../types';
import { ASSETS } from '../../../assets';
import { Plus, Edit2, Eye, EyeOff, Archive, LayoutGrid, LayoutList, Search, AlertCircle } from 'lucide-react';
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
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [search, setSearch] = useState('');

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

    const filteredProducts = products.filter(p => 
        p.name.toLowerCase().includes(search.toLowerCase()) || 
        p.category.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-2xl border border-stone-100 shadow-soft gap-4">
               <div>
                  <h3 className="text-xl font-serif font-bold text-stone-900">Inventory Control</h3>
                  <p className="text-xs text-stone-500 font-medium mt-1">Manage {filteredProducts.length} items.</p>
               </div>
               
               <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                   <div className="relative">
                       <Search className="absolute left-3 top-2.5 text-stone-400" size={16} />
                       <Input 
                           placeholder="Search products..." 
                           value={search} 
                           onChange={e => setSearch(e.target.value)} 
                           className="pl-10 h-10 text-xs w-full sm:w-48 bg-stone-50 border-stone-200"
                       />
                   </div>
                   <div className="flex bg-stone-100 p-1 rounded-lg border border-stone-200">
                       <button 
                           onClick={() => setViewMode('grid')} 
                           className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow text-stone-900' : 'text-stone-500 hover:text-stone-700'}`}
                       >
                           <LayoutGrid size={16} />
                       </button>
                       <button 
                           onClick={() => setViewMode('list')} 
                           className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow text-stone-900' : 'text-stone-500 hover:text-stone-700'}`}
                       >
                           <LayoutList size={16} />
                       </button>
                   </div>
                   <Button onClick={openCreate} size="sm" className="gap-2 shadow-lg shadow-stone-900/10">
                      <Plus size={16} /> Add Product
                   </Button>
               </div>
            </div>

            <ProductFormModal 
                isOpen={showProductForm}
                onClose={() => setShowProductForm(false)}
                product={editingProduct}
                onSave={handleSaveProduct}
                notify={notify}
            />

            {/* View Mode Switching */}
            {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                   {filteredProducts.map(p => (
                      <Card key={p.id} noPadding className={`group relative overflow-hidden flex flex-col transition-all hover:shadow-xl ${!p.isActive ? 'opacity-70' : ''}`}>
                         <div className="absolute top-3 right-3 z-20 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={(e) => { e.stopPropagation(); openEdit(p); }} className="w-8 h-8 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-sm text-stone-600 hover:text-brand-900 hover:scale-110 transition-all"><Edit2 size={14}/></button>
                         </div>

                         <div className="aspect-[4/3] bg-stone-100 relative flex items-center justify-center overflow-hidden">
                            <img src={p.image} className={`w-full h-full object-cover transition-all duration-500 ${p.stockStatus === 'SOLD_OUT' ? 'grayscale opacity-50' : 'group-hover:scale-110'}`} alt={p.name} />
                            
                            <div className="absolute top-3 left-3 flex flex-col gap-1">
                                {!p.isActive && <span className="bg-stone-900/80 backdrop-blur text-white text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1"><EyeOff size={10}/> Hidden</span>}
                                {p.stockStatus === 'SOLD_OUT' && <span className="bg-red-600/90 backdrop-blur text-white text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1"><Archive size={10}/> Sold Out</span>}
                                {p.stockQuantity < 10 && p.stockStatus === 'IN_STOCK' && (
                                    <span className="bg-orange-500/90 backdrop-blur text-white text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1"><AlertCircle size={10}/> Low Stock ({p.stockQuantity})</span>
                                )}
                            </div>
                         </div>

                         <div className="p-4 flex-1 flex flex-col">
                            <div className="flex justify-between items-start mb-1">
                               <h4 className="font-bold text-stone-900 line-clamp-1">{p.name}</h4>
                               <span className="font-bold text-stone-600">{formatCurrency(p.price)}</span>
                            </div>
                            <p className="text-xs text-stone-500 font-bold uppercase tracking-wider mb-4">{p.size}</p>
                            
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
            ) : (
                <Card noPadding className="overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-stone-50 text-stone-500 font-bold uppercase text-[10px] tracking-widest border-b border-stone-100">
                                <tr>
                                    <th className="px-6 py-3 w-16">Image</th>
                                    <th className="px-6 py-3">Product Name</th>
                                    <th className="px-6 py-3">Category</th>
                                    <th className="px-6 py-3">Price</th>
                                    <th className="px-6 py-3 text-center">Status</th>
                                    <th className="px-6 py-3 text-center">Stock</th>
                                    <th className="px-6 py-3 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-100">
                                {filteredProducts.map(p => (
                                    <tr key={p.id} className="hover:bg-stone-50 group">
                                        <td className="px-6 py-3">
                                            <div className="w-10 h-10 rounded-lg bg-stone-100 overflow-hidden border border-stone-200">
                                                <img src={p.image || ASSETS.PRODUCT_PLACEHOLDER} className="w-full h-full object-cover" alt="" />
                                            </div>
                                        </td>
                                        <td className="px-6 py-3 font-bold text-stone-900">{p.name} <span className="font-normal text-stone-400 text-xs block">{p.size}</span></td>
                                        <td className="px-6 py-3 text-stone-500 text-xs uppercase font-bold">{p.category}</td>
                                        <td className="px-6 py-3 font-mono">{formatCurrency(p.price)}</td>
                                        <td className="px-6 py-3 text-center">
                                            <button 
                                                onClick={(e) => toggleProductVisibility(p, e)}
                                                className={`text-[10px] px-2 py-1 rounded font-bold uppercase ${p.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-200 text-stone-500'}`}
                                            >
                                                {p.isActive ? 'Visible' : 'Hidden'}
                                            </button>
                                        </td>
                                        <td className="px-6 py-3 text-center">
                                            <button 
                                                onClick={(e) => toggleStockStatus(p, e)}
                                                className={`text-[10px] px-2 py-1 rounded font-bold uppercase ${p.stockStatus === 'IN_STOCK' ? (p.stockQuantity < 10 ? 'bg-orange-100 text-orange-700' : 'bg-blue-50 text-blue-700') : 'bg-red-100 text-red-700'}`}
                                            >
                                                {p.stockStatus === 'IN_STOCK' ? (p.stockQuantity < 10 ? `Low (${p.stockQuantity})` : 'In Stock') : 'Sold Out'}
                                            </button>
                                        </td>
                                        <td className="px-6 py-3 text-center">
                                            <Button size="sm" variant="outline" onClick={() => openEdit(p)} className="h-8 px-3">
                                                Edit
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}
         </div>
    );
};
