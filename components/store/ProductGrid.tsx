'use client';

import { IProduct } from '@/database';
import { ProductCard } from './ProductCard';

interface ProductGridProps {
  products: IProduct[];
  isLoading?: boolean;
  onAddToCart?: (productId: string) => void;
}

export function ProductGrid({ products, isLoading, onAddToCart }: ProductGridProps) {
  if (isLoading) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800"
            style={{ height: '400px' }}
          />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex h-96 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            No products found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Try adjusting your search or filters
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard
          key={product._id?.toString()}
          product={product}
          onAddToCart={() => onAddToCart?.(product._id?.toString() || '')}
        />
      ))}
    </div>
  );
}
