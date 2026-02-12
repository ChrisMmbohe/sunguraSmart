'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { IProduct } from '@/database';
import { ProductGrid } from '@/components/store/ProductGrid';
import { StoreFilters } from '@/components/store/StoreFilters';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function StorePage() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<IProduct[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [filters, setFilters] = useState({
    query: searchParams.get('q') || '',
    category: searchParams.get('category') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    sortBy: searchParams.get('sort') || 'newest',
  });

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.query) params.append('q', filters.query);
      if (filters.category) params.append('category', filters.category);
      if (filters.minPrice) params.append('minPrice', filters.minPrice);
      if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
      params.append('sortBy', filters.sortBy);
      params.append('page', currentPage.toString());
      params.append('limit', '20');

      const response = await fetch(`/api/products?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch products');

      const data = await response.json();
      setProducts(data.data);
      setTotalPages(data.pagination.totalPages);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setIsLoading(false);
    }
  }, [filters, currentPage]);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch('/api/products?limit=1');
      if (response.ok) {
        const data = await response.json();
        const uniqueCategories = [
          ...new Set(data.data.map((p: IProduct) => p.category)),
        ] as string[];
        setCategories(uniqueCategories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleSearch = (query: string) => {
    setFilters((prev) => ({ ...prev, query }));
    setCurrentPage(1);
  };

  const handleCategoryChange = (category: string) => {
    setFilters((prev) => ({ ...prev, category }));
    setCurrentPage(1);
  };

  const handlePriceChange = (min: number, max: number) => {
    setFilters((prev) => ({
      ...prev,
      minPrice: min > 0 ? min.toString() : '',
      maxPrice: max < 10000 ? max.toString() : '',
    }));
    setCurrentPage(1);
  };

  const handleSortChange = (sort: string) => {
    setFilters((prev) => ({ ...prev, sortBy: sort }));
    setCurrentPage(1);
  };

  const handleAddToCart = async (productId: string) => {
    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity: 1 }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add to cart');
      }

      toast.success('Added to cart!');
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to add to cart');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Store</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Browse our selection of quality products for rabbit farming
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-4">
          {/* Sidebar Filters */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <StoreFilters
                categories={categories}
                onSearch={handleSearch}
                onCategoryChange={handleCategoryChange}
                onPriceChange={handlePriceChange}
                onSortChange={handleSortChange}
              />
            </div>
          </div>

          {/* Products Grid */}
          <div className="lg:col-span-3">
            <ProductGrid
              products={products}
              isLoading={isLoading}
              onAddToCart={handleAddToCart}
            />

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-12 flex justify-center gap-2">
                <Button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  variant="outline"
                >
                  Previous
                </Button>
                <div className="flex items-center gap-2">
                  {[...Array(Math.min(5, totalPages))].map((_, i) => {
                    const page = i + Math.max(1, currentPage - 2);
                    if (page > totalPages) return null;
                    return (
                      <Button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        variant={page === currentPage ? 'default' : 'outline'}
                      >
                        {page}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  variant="outline"
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
