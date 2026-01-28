
import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { API } from '../lib/api';
import { Product } from '../types';
import { useBasket } from '../context/BasketContext';
import { ProductCard } from '../components/products/ProductCard';
import { ProductDetailsModal } from '../components/products/ProductDetailsModal';
import { FloatingCart } from '../components/products/FloatingCart';
import { Select, Skeleton, Pagination, Button, useToast } from '../components/ui';
import { Search, SlidersHorizontal, Lock, PackageSearch, LayoutDashboard } from 'lucide-react';
import { FilterDrawer } from '../components/products/FilterDrawer';
import { Logger } from '../lib/logger';
import { PRODUCT_CATEGORIES, SORT_OPTIONS } from '../lib/constants';
import { cn, formatCurrency } from '../lib/utils';
// @ts-ignore
import { useNavigate } from 'react-router-dom';

const MotionDiv = motion.div as any;
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
  const navigate = useNavigate();
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  
  // Combine 'All' with defined categories
  const categories = ['All', ...PRODUCT_CATEGORIES];
  const { basket, addItem, itemCount, isBasketLocked, totalValue } = useBasket();

  // Debounced fetch for search & category filter
  useEffect(() => {
    const timer = setTimeout(() => {
        fetchProducts();
    }, 300); 
    return () => clearTimeout(timer);
  }, [searchQuery, filter]);

  // Reset page when search or filter changes
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

  const handleResetFilters = () => {
      setFilter('All');
      setSearchQuery('');
      setSortOrder('default');
      setCurrentPage(1);
      showToast("Filters reset to default", "info");
  };

  // Implement Sorting Logic
  const sortedProducts = React.useMemo(() => {
    return [...products].sort((a, b) => {
        if (sortOrder === 'price_asc') return a.price - b.price;
        if (sortOrder === 'price_desc') return b.price - a.price;
        if (sortOrder === 'name') return a.name.localeCompare(b.name);
        return 0; // 'default' / Featured
    });
  }, [products, sortOrder]);

  // Pagination Logic using the sorted and filtered results
  const totalPages = Math.ceil(sortedProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = sortedProducts.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE
  );

  const getItemCount = (pid: string) => basket?.items?.find((i: any) => i.productId === pid)?.quantity || 0;

  const handleIncrement = async (p: Product) => {
      await addItem(p, 1);
  };

  const handleDecrement = async (p: Product) => {
      await addItem(p, -1);
  };

  return (
    <div className="min-h-screen animate-in fade-in duration-500">
      
      {/* Quick Dashboard Header */}
      <div className="bg-white rounded-2xl border border-stone-200 p-4 mb-6 shadow-sm flex items-center justify-between">
          <div>
              <h2 className="text-xl font-heading font-bold text-stone-900">SML Market</h2>
              <p className="text-stone-500 text-xs mt-0.5">Secure your monthly stock.</p>
          </div>
          
          <div className="flex items-center gap-3">
              <div className="hidden md:block text-right">
                  <p className="text-[10px] font-bold uppercase text-stone-400 tracking-widest">Basket Total</p>
                  <p className="text-lg font-bold text-brand-600 font-mono">{formatCurrency(totalValue)}</p>
              </div>
              <Button onClick={() => navigate('/dashboard')} variant="secondary" size="sm" className="gap-2 bg-stone-100 hover:bg-stone-200 text-stone-700">
                  <LayoutDashboard size={16} /> <span className="hidden sm:inline">My Dashboard</span>
              </Button>
          </div>
      </div>

      {/* Header & Search */}
      <div className="sticky top-[0px] z-30 bg-[#F5F5F7]/95 backdrop-blur-md pb-4 pt-1">
          <div className="flex gap-3 items-center">
              <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                  <input 
                      type="text" 
                      placeholder="Search essentials (e.g. Rice, Oil)..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-white border border-stone-200 rounded-xl pl-10 pr-4 py-3.5 text-sm focus:ring-2 focus:ring-brand-500/20 outline-none transition-all shadow-sm"
                  />
              </div>
              <button 
                  onClick={() => setFilterDrawerOpen(true)}
                  className={cn(
                      "p-3.5 rounded-xl border transition-colors relative md:hidden", 
                      filter !== 'All' || sortOrder !== 'default' ? 'bg-brand-900 border-brand-900 text-white shadow-lg' : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
                  )}
              >
                  <SlidersHorizontal size={20} />
                  {(filter !== 'All' || sortOrder !== 'default') && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-accent-500 rounded-full border-2 border-white shadow-sm animate-pulse"></span>
                  )}
              </button>
          </div>
          
          {/* Horizontally Scrollable Category Chips */}
          <div className="mt-4 flex gap-2 overflow-x-auto pb-2 no-scrollbar scroll-smooth">
              {categories.map(cat => (
                  <button
                      key={cat}
                      onClick={() => setFilter(cat)}
                      className={cn(
                          "px-5 py-2.5 rounded-full text-xs font-bold transition-all border whitespace-nowrap",
                          filter === cat 
                              ? 'bg-brand-900 text-white border-brand-900 shadow-md transform scale-105' 
                              : 'bg-white text-stone-500 border-stone-200 hover:border-brand-300 hover:text-brand-900'
                      )}
                  >
                      {cat}
                  </button>
              ))}
          </div>
      </div>

      <div className="pb-8">
          
          {/* Status Bar */}
          <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-serif font-bold text-stone-900 flex items-center gap-3">
                    {filter === 'All' ? 'All Essentials' : filter}
                    <span className="text-xs font-sans font-bold text-stone-400 bg-white border border-stone-200 px-2 py-1 rounded-lg">
                        {sortedProducts.length}
                    </span>
                </h2>
              </div>
              
              {/* Desktop Sort Control */}
              <div className="hidden md:block w-56">
                  <Select 
                      label="Sort By"
                      options={SORT_OPTIONS}
                      value={sortOrder}
                      onChange={(e: any) => setSortOrder(e.target.value)}
                      className="bg-white border-stone-200"
                  />
              </div>
          </div>

          {/* Global Notification: Locked State */}
          {isBasketLocked && (
              <div className="mb-8 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-center gap-3 text-amber-800 text-sm font-bold shadow-sm animate-in slide-in-from-top-4 duration-500">
                  <div className="bg-amber-100 p-2 rounded-lg"><Lock size={18} /></div>
                  <span>The current cycle is locked. New items will be secured for your <strong>Next Month's</strong> basket.</span>
              </div>
          )}

          {/* Products Grid / States */}
          {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                  {[1,2,3,4,5,6,7,8].map(i => (
                      <div key={i} className="space-y-4">
                          <Skeleton className="aspect-[4/5] rounded-[2rem] w-full" />
                          <Skeleton className="h-6 w-3/4 rounded-lg" />
                          <Skeleton className="h-4 w-1/2 rounded-lg" />
                      </div>
                  ))}
              </div>
          ) : sortedProducts.length > 0 ? (
              <>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 gap-y-8 md:gap-6 md:gap-y-10">
                      <AnimatePresence mode='popLayout'>
                          {paginatedProducts.map(product => (
                              <ProductCard 
                                  key={product.id} 
                                  product={product}
                                  count={getItemCount(product.id)}
                                  isLocked={false} 
                                  onIncrement={handleIncrement}
                                  onDecrement={handleDecrement}
                                  onClick={setSelectedProduct}
                              />
                          ))}
                      </AnimatePresence>
                  </div>

                  <div className="mt-12">
                    <Pagination 
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                    />
                  </div>
              </>
          ) : (
              <MotionDiv 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-20 text-center max-w-md mx-auto"
              >
                  <div className="w-24 h-24 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border border-stone-100">
                      <PackageSearch size={40} className="text-stone-300" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-2xl font-serif font-bold text-stone-900 mb-2">No essentials found</h3>
                  <p className="text-stone-500 mb-8 text-sm">
                      We couldn't find items matching your filters.
                  </p>
                  <div className="flex flex-col gap-3">
                    <Button onClick={handleResetFilters} size="md" className="rounded-xl shadow-lg shadow-brand-900/10">
                        Reset All Filters
                    </Button>
                  </div>
              </MotionDiv>
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
