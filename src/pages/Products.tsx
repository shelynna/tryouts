
import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { API } from '../lib/api';
import { Product } from '../types';
import { useBasket } from '../context/BasketContext';
import { ProductCard } from '../components/products/ProductCard';
import { ProductDetailsModal } from '../components/products/ProductDetailsModal';
import { FloatingCart } from '../components/products/FloatingCart';
import { Select, Skeleton, Pagination, Button, useToast } from '../components/ui';
import { Search, SlidersHorizontal, Lock } from 'lucide-react';
import { FilterDrawer } from '../components/products/FilterDrawer';
import { Logger } from '../lib/logger';
import { PRODUCT_CATEGORIES, SORT_OPTIONS } from '../lib/constants';

const ITEMS_PER_PAGE = 8;

export const ProductsPage: React.FC<{ onAction: (msg: string) => void }> = ({ onAction }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filter, setFilter] = useState('All');
  const [sortOrder, setSortOrder] = useState('default');
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isFilterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const { showToast } = useToast();
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  
  // Combine 'All' with defined categories
  const categories = ['All', ...PRODUCT_CATEGORIES];
  const { basket, addItem, itemCount, isBasketLocked } = useBasket();

  // Debounced fetch for search
  useEffect(() => {
    const timer = setTimeout(() => {
        fetchProducts();
    }, 300); // 300ms debounce
    return () => clearTimeout(timer);
  }, [searchQuery, filter]);

  // Reset page when filter/search changes
  useEffect(() => {
      setCurrentPage(1);
  }, [searchQuery, filter, sortOrder]);

  const fetchProducts = async () => {
      setIsLoading(true);
      try {
          const data = await API.getProducts({ 
              search: searchQuery, 
              category: filter 
          });
          setProducts(data);
      } catch (e) {
          Logger.error("Failed to fetch products", e);
          showToast("Could not load products. Please check your connection.", "error");
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

  // Pagination Logic
  const totalPages = Math.ceil(sortedProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = sortedProducts.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE
  );

  const getItemCount = (pid: string) => basket?.items?.find((i: any) => i.productId === pid)?.quantity || 0;

  const handleIncrement = async (p: Product) => {
      // NOTE: Removed `isBasketLocked` check here. 
      // BasketContext now handles adding to "Next Cycle" basket if current is locked.
      await addItem(p, 1);
  };

  const handleDecrement = async (p: Product) => {
      // Allow decrementing logic to be handled by context (e.g. modify future basket if that's what's active)
      await addItem(p, -1);
  };

  return (
    <div className="min-h-screen bg-white pt-4 pb-24 font-sans">
      
      {/* Header & Search */}
      <div className="sticky top-[72px] md:top-[80px] z-30 bg-white/95 backdrop-blur-md border-b border-stone-100 px-4 py-3 shadow-sm">
          <div className="max-w-7xl mx-auto flex gap-3 items-center">
              <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                  <input 
                      type="text" 
                      placeholder="Search essentials..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-stone-100 border-none rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-brand-500/20 focus:bg-white transition-all outline-none"
                  />
              </div>
              <button 
                  onClick={() => setFilterDrawerOpen(true)}
                  className={`p-3 rounded-xl border transition-colors relative ${filter !== 'All' ? 'bg-brand-50 border-brand-200 text-brand-700' : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'}`}
              >
                  <SlidersHorizontal size={20} />
                  {filter !== 'All' && <div className="absolute top-2 right-2 w-2 h-2 bg-brand-500 rounded-full border border-white"></div>}
              </button>
          </div>
          
          {/* Quick Category Chips (Desktop) */}
          <div className="max-w-7xl mx-auto mt-3 hidden md:flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {categories.map(cat => (
                  <button
                      key={cat}
                      onClick={() => setFilter(cat)}
                      className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border whitespace-nowrap ${
                          filter === cat 
                              ? 'bg-brand-900 text-white border-brand-900 shadow-md' 
                              : 'bg-white text-stone-500 border-stone-200 hover:border-brand-300 hover:text-brand-700'
                      }`}
                  >
                      {cat}
                  </button>
              ))}
          </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
          
          {/* Status Bar */}
          <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-heading font-bold text-stone-900">
                  {filter === 'All' ? 'All Products' : filter}
                  <span className="ml-2 text-sm font-sans font-medium text-stone-400 bg-stone-100 px-2 py-0.5 rounded-md">{sortedProducts.length}</span>
              </h2>
              
              {/* Desktop Sort */}
              <div className="hidden md:block w-48">
                  <Select 
                      options={SORT_OPTIONS}
                      value={sortOrder}
                      onChange={(e: any) => setSortOrder(e.target.value)}
                      className="h-10 text-xs py-0"
                  />
              </div>
          </div>

          {/* Locked State Banner */}
          {isBasketLocked && (
              <div className="mb-6 bg-orange-50 border border-orange-100 rounded-xl p-3 flex items-center justify-center gap-2 text-orange-800 text-sm font-bold">
                  <Lock size={16} /> Current Cycle Locked. New items will be added to Next Cycle.
              </div>
          )}

          {/* Products Grid */}
          {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
                  {[1,2,3,4,5,6,7,8].map(i => (
                      <div key={i} className="space-y-3">
                          <Skeleton className="aspect-[4/5] rounded-2xl w-full" />
                          <Skeleton className="h-4 w-2/3" />
                          <Skeleton className="h-4 w-1/3" />
                      </div>
                  ))}
              </div>
          ) : paginatedProducts.length > 0 ? (
              <>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8 md:gap-x-8 md:gap-y-12">
                      <AnimatePresence mode='popLayout'>
                          {paginatedProducts.map(product => (
                              <ProductCard 
                                  key={product.id} 
                                  product={product}
                                  count={getItemCount(product.id)}
                                  isLocked={false} // Always unlock card interaction, context handles logic
                                  onIncrement={handleIncrement}
                                  onDecrement={handleDecrement}
                                  onClick={setSelectedProduct}
                              />
                          ))}
                      </AnimatePresence>
                  </div>

                  <Pagination 
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={setCurrentPage}
                  />
              </>
          ) : (
              <div className="py-20 text-center">
                  <div className="w-20 h-20 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4 text-stone-400">
                      <Search size={32} />
                  </div>
                  <h3 className="text-lg font-bold text-stone-900">No products found</h3>
                  <p className="text-stone-500">Try adjusting your filters or search query.</p>
                  <Button variant="ghost" onClick={() => {setFilter('All'); setSearchQuery('');}} className="mt-4">
                      Clear Filters
                  </Button>
              </div>
          )}
      </div>

      <FloatingCart itemCount={itemCount} isLocked={isBasketLocked} />

      <FilterDrawer 
          isOpen={isFilterDrawerOpen}
          onClose={() => setFilterDrawerOpen(false)}
          categories={categories}
          currentCategory={filter}
          onCategoryChange={(c) => { setFilter(c); setFilterDrawerOpen(false); }}
          currentSort={sortOrder}
          onSortChange={setSortOrder}
      />

      <ProductDetailsModal 
          isOpen={!!selectedProduct}
          onClose={() => setSelectedProduct(null)}
          product={selectedProduct}
          currentQuantity={selectedProduct ? getItemCount(selectedProduct.id) : 0}
          onIncrement={() => selectedProduct && handleIncrement(selectedProduct)}
          onDecrement={() => selectedProduct && handleDecrement(selectedProduct)}
          isLocked={false} 
      />
    </div>
  );
};
