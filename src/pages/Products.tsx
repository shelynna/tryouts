
import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { API } from '../lib/api';
import { Product, BasketStatus } from '../types';
import { useBasket } from '../context/BasketContext';
import { ProductFilter } from '../components/products/ProductFilter';
import { ProductCard } from '../components/products/ProductCard';
import { ProductDetailsModal } from '../components/products/ProductDetailsModal';
import { FloatingCart } from '../components/products/FloatingCart';
import { Select, Skeleton } from '../components/ui';
import { Filter, SlidersHorizontal } from 'lucide-react';

export const ProductsPage: React.FC<{ onAction: (msg: string) => void }> = ({ onAction }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filter, setFilter] = useState('All');
  const [sortOrder, setSortOrder] = useState('default');
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  const categories = ['All', 'Grains', 'Oils', 'Canned', 'Noodles', 'Cleaning', 'Electronics'];
  const { basket, addItem, itemCount } = useBasket();

  useEffect(() => {
    fetchProducts();
  }, [searchQuery, filter]);

  const fetchProducts = async () => {
      setIsLoading(true);
      try {
          const data = await API.getProducts({ 
              search: searchQuery, 
              category: filter 
          });
          setProducts(data);
      } catch (e) {
          // Silent fail
      } finally {
          setIsLoading(false);
      }
  };

  const sortedProducts = [...products].sort((a, b) => {
      if (sortOrder === 'price_asc') return a.price - b.price;
      if (sortOrder === 'price_desc') return b.price - a.price;
      if (sortOrder === 'name') return a.name.localeCompare(b.name);
      return 0;
  });

  const getItemCount = (pid: string) => basket?.items?.find((i: any) => i.productId === pid)?.quantity || 0;
  const isLocked = basket?.status !== BasketStatus.OPEN && basket !== undefined;

  const handleIncrement = async (p: Product) => {
      await addItem(p.id, 1, p.price);
  };

  const handleDecrement = async (p: Product) => {
      await addItem(p.id, -1, p.price);
  };

  return (
    <div className="min-h-screen bg-white pt-24 pb-20">
      
      {/* Header */}
      <div className="container-padding mb-12">
          <h1 className="text-5xl md:text-7xl font-serif font-medium mb-4">Marketplace</h1>
          <p className="text-stone-500 max-w-xl text-lg">Curated essentials for your monthly upkeep. Prices locked for the cycle.</p>
      </div>

      <div className="container-padding flex flex-col md:flex-row gap-12">
          
          {/* Sidebar Filters (Desktop) */}
          <div className="w-full md:w-64 shrink-0 hidden md:block space-y-8 sticky top-32 h-fit">
              <div>
                  <h3 className="font-bold text-sm uppercase tracking-widest mb-4">Categories</h3>
                  <div className="space-y-2">
                      {categories.map(cat => (
                          <button 
                            key={cat}
                            onClick={() => setFilter(cat)}
                            className={`block text-lg transition-colors ${filter === cat ? 'font-serif font-bold italic text-brand-600' : 'text-stone-500 hover:text-stone-900'}`}
                          >
                              {cat}
                          </button>
                      ))}
                  </div>
              </div>
              
              <div>
                  <h3 className="font-bold text-sm uppercase tracking-widest mb-4">Sort By</h3>
                  <select 
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    className="w-full bg-stone-50 border-none rounded-lg py-3 px-4 text-sm focus:ring-0 cursor-pointer hover:bg-stone-100 transition-colors"
                  >
                        <option value="default">Featured</option>
                        <option value="price_asc">Price: Low to High</option>
                        <option value="price_desc">Price: High to Low</option>
                        <option value="name">Name: A-Z</option>
                  </select>
              </div>
          </div>

          {/* Mobile Filter Bar */}
          <div className="md:hidden overflow-x-auto no-scrollbar pb-4 -mx-4 px-4 flex gap-2">
              {categories.map(cat => (
                  <button 
                    key={cat}
                    onClick={() => setFilter(cat)}
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap border ${filter === cat ? 'bg-stone-900 text-white border-stone-900' : 'bg-white text-stone-900 border-stone-200'}`}
                  >
                      {cat}
                  </button>
              ))}
          </div>

          {/* Grid */}
          <div className="flex-1">
              {isLoading ? (
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-12">
                      {[1,2,3,4,5,6].map(i => (
                          <div key={i} className="space-y-4">
                              <Skeleton className="aspect-[4/5] rounded-2xl" />
                              <Skeleton className="h-6 w-3/4" />
                              <Skeleton className="h-4 w-1/4" />
                          </div>
                      ))}
                  </div>
              ) : (
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-12">
                    <AnimatePresence mode='popLayout'>
                    {sortedProducts.map((p) => (
                        <ProductCard 
                            key={p.id}
                            product={p}
                            count={getItemCount(p.id)}
                            isLocked={isLocked}
                            onIncrement={handleIncrement}
                            onDecrement={handleDecrement}
                            onClick={setSelectedProduct}
                        />
                    ))}
                    </AnimatePresence>
                    {sortedProducts.length === 0 && (
                        <div className="col-span-full py-20 text-center text-stone-400">
                            <p className="text-xl font-serif">No products found.</p>
                            <button onClick={() => setFilter('All')} className="text-brand-600 underline mt-2">View all products</button>
                        </div>
                    )}
                </div>
              )}
          </div>
      </div>

      <ProductDetailsModal 
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        currentQuantity={selectedProduct ? getItemCount(selectedProduct.id) : 0}
        onIncrement={() => selectedProduct && handleIncrement(selectedProduct)}
        onDecrement={() => selectedProduct && handleDecrement(selectedProduct)}
        isLocked={isLocked}
      />

      <FloatingCart itemCount={itemCount} isLocked={isLocked} />
    </div>
  );
};
